import { AptosClient } from "aptos";
import { APTOS_NODE_URL, MARKETPLACE_ADDRESS, OCTAS } from "./constants";
import { decodeHexString } from "./utils";
import { NFT } from "./types";
import { decodeNFTData } from "./utils";
import { NFTDetails, MoveAuction, Auction } from './types';
import { hexToUint8Array } from './utils';

const client = new AptosClient(APTOS_NODE_URL);

export const fetchNFTsForOwner = async (
  ownerAddress: string, 
  selectedRarity?: number
): Promise<NFT[]> => {
  const nftIdsResponse = await client.view({
    function: `${MARKETPLACE_ADDRESS}::NFTMarketplace::get_all_nfts_for_owner`,
    arguments: [MARKETPLACE_ADDRESS, ownerAddress, "100", "0"],
    type_arguments: [],
  });

  const nftIds = Array.isArray(nftIdsResponse[0]) ? nftIdsResponse[0] : nftIdsResponse;
  
  const nfts = await Promise.all(
    nftIds.map(async (id) => {
      const nftDetails = await client.view({
        function: `${MARKETPLACE_ADDRESS}::NFTMarketplace::get_nft_details`,
        arguments: [MARKETPLACE_ADDRESS, id],
        type_arguments: [],
      });

      const [nftId, owner, name, description, uri, price, forSale, rarity] = nftDetails;
      const inAuction = await checkAuctionStatus(Number(nftId));

      return {
        id: Number(nftId),
        name: decodeHexString(String(name)),
        description: decodeHexString(String(description)),
        uri: decodeHexString(String(uri)),
        rarity: Number(rarity),
        price: Number(price) / OCTAS,
        for_sale: forSale,
        in_auction: inAuction,
        owner,
      };
    })
  );
  
  return selectedRarity !== undefined 
    ? nfts.filter(nft => nft.rarity === selectedRarity) 
    : nfts as NFT[];
};


export const checkAuctionStatus = async (nftId: number): Promise<boolean> => {
  const response = await client.view({
    function: `${MARKETPLACE_ADDRESS}::NFTMarketplace::is_nft_in_auction`,
    arguments: [MARKETPLACE_ADDRESS, nftId.toString()],
    type_arguments: [],
  });
  return response[0] === true;
};

export const createTransaction = (functionName: string, args: any[]) => ({
  type: "entry_function_payload",
  function: `${MARKETPLACE_ADDRESS}::NFTMarketplace::${functionName}`,
  type_arguments: [],
  arguments: args,
});

export const fetchNFTs = async (marketplaceAddr: string, selectedRarity?: number): Promise<NFT[]> => {
  const response = await client.getAccountResource(
    marketplaceAddr,
    `${marketplaceAddr}::NFTMarketplace::Marketplace`
  );

  const nftList = (response.data as { nfts: NFT[] }).nfts;
  const decodedNfts = nftList.map(decodeNFTData);

  return decodedNfts.filter((nft) => 
    nft.for_sale && (selectedRarity === undefined || nft.rarity === selectedRarity)
  );
};

export const purchaseNFT = async (
  marketplaceAddr: string,
  nftId: number,
  price: number
): Promise<string> => {
  const priceInOctas = price * OCTAS;
  
  const transaction = {
    type: "entry_function_payload",
    function: `${marketplaceAddr}::NFTMarketplace::purchase_nft`,
    type_arguments: [],
    arguments: [marketplaceAddr, nftId.toString(), priceInOctas.toString()],
  };

  const response = await (window as any).aptos.signAndSubmitTransaction(transaction);
  await client.waitForTransaction(response.hash);
  
  return response.hash;
};

export const fetchNFTDetails = async (marketplaceAddr: string, nftId: number): Promise<NFTDetails> => {
  const response = await client.view({
    function: `${marketplaceAddr}::NFTMarketplace::get_nft_details`,
    arguments: [marketplaceAddr, nftId.toString()],
    type_arguments: [],
  });

  const [_, __, name, description, uri] = response;

  return {
    name: new TextDecoder().decode(hexToUint8Array(String(name).slice(2))),
    description: new TextDecoder().decode(hexToUint8Array(String(description).slice(2))),
    uri: new TextDecoder().decode(hexToUint8Array(String(uri).slice(2))),
  };
};

export const fetchActiveAuctions = async (marketplaceAddr: string): Promise<Auction[]> => {
  const response = await client.view({
    function: `${marketplaceAddr}::NFTMarketplace::get_active_auctions`,
    arguments: [marketplaceAddr],
    type_arguments: [],
  });
  const activeAuctions = response[0] as MoveAuction[];
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Filter out inactive or expired auctions on the frontend as well
  const validAuctions = activeAuctions.filter(auction => 
    auction.active && Number(auction.end_time) > currentTime
  );

  console.log(validAuctions);
  
  return Promise.all(
    validAuctions.map(async (auction: MoveAuction) => {
      const nftDetails = await fetchNFTDetails(marketplaceAddr, Number(auction.nft_id));
      return {
        id: Number(auction.nft_id),
        nftId: Number(auction.nft_id),
        currentBid: Number(auction.current_bid) / OCTAS,
        endTime: Number(auction.end_time),
        highestBidder: auction.highest_bidder,
        seller: auction.seller,
        active: auction.active,
        nftDetails,
      };
    })
  );
};


export const placeBid = async (
  marketplaceAddr: string,
  auctionId: number,
  bidAmount: number
): Promise<string> => {
  const transaction = {
    type: "entry_function_payload",
    function: `${marketplaceAddr}::NFTMarketplace::place_bid`,
    type_arguments: [],
    arguments: [
      marketplaceAddr,
      auctionId.toString(),
      (bidAmount * OCTAS).toString()
    ]
  };

  const response = await (window as any).aptos.signAndSubmitTransaction(transaction);
  await client.waitForTransaction(response.hash);
  return response.hash;
};

export const stopAuction = async (
  marketplaceAddr: string,
  auctionId: number
): Promise<string> => {
  console.log("Auction ID:", auctionId);
  try {
    const transaction = createTransaction("stop_auction", [marketplaceAddr, auctionId.toString()])
    const response = await (window as any).aptos.signAndSubmitTransaction(transaction);
    await client.waitForTransaction(response.hash);
    return response.hash;
  } catch (error: any) {
    // Map Move abort codes to user-friendly messages
    const errorCode = error.message?.match(/Move abort (\d+)/)?.[1];
    switch (errorCode) {
      case '4000':
        throw new Error('Auction not found');
      case '1201':
        throw new Error('Only the auction owner can stop this auction');
      case '1200':
        throw new Error('NFT not found');
      default:
        throw new Error('Failed to stop auction: ' + error.message);
    }
  }
};

