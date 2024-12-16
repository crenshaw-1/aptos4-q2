import React, { useEffect, useState, useCallback } from "react";
import { Typography, Row, Col, Pagination, message } from "antd";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { NFTCard } from "../components/NFTCard";
import { SellModal, TransferModal, AuctionModal } from "../components/Modals";
import { fetchNFTsForOwner, createTransaction } from "../api";
import { NFT, RarityFilter, SortOption } from "../types";
import { AptosClient } from "aptos";
import { PAGE_SIZE, MARKETPLACE_ADDRESS, OCTAS } from "../constants";
import { FilterSection } from "../components/FilterSection";
import { getFilteredNFTs } from "../utils";

const { Title } = Typography;

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

const MyNFTs: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rarity, setRarity] = useState<RarityFilter>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [modalStates, setModalStates] = useState({
    sell: false,
    transfer: false,
    auction: false,
  });
  const [formValues, setFormValues] = useState({
    salePrice: "",
    transferAddress: "",
    auctionStartPrice: "",
    auctionDuration: "",
  });

  const { account, signAndSubmitTransaction } = useWallet();

  const fetchUserNFTs = useCallback(async (selectedRarity?: number) => {
    if (!account) return;
    try {
      const userNFTs = await fetchNFTsForOwner(account.address, selectedRarity);
      console.log("NFTS:", userNFTs);
      setNfts(userNFTs);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      message.error("Failed to fetch your NFTs.");
    }
  }, [account]);
  

  useEffect(() => {
    fetchUserNFTs(rarity === 'all' ? undefined : rarity);
    const interval = setInterval(fetchUserNFTs, 10000);
    return () => clearInterval(interval);
  }, [fetchUserNFTs]);

  const handleTransaction = async (
    functionName: string,
    args: any[],
    successMessage: string
  ) => {
    try {
      console.log("arguments", args);
      const transaction = createTransaction(functionName, args);
      const response = await (window as any).aptos.signAndSubmitTransaction(transaction);
      await client.waitForTransaction(response.hash);
      message.success(successMessage);
      fetchUserNFTs();
      return true;
    } catch (error) {
      console.error(`Error in ${functionName}:`, error);
      message.error(`Failed to ${functionName.replace(/_/g, ' ')}`);
      return false;
    }
  };

const handleModalOpen = (modalType: keyof typeof modalStates, nft: NFT) => {
  setSelectedNft(nft);
  setModalStates(prev => ({
    ...prev,
    [modalType]: true
  }));
};

const handleModalClose = (modalType: keyof typeof modalStates) => {
  setModalStates(prev => ({
    ...prev,
    [modalType]: false
  }));
  setSelectedNft(null);
  setFormValues(prev => ({
    ...prev,
    [`${modalType}Price`]: "",
    transferAddress: "",
    auctionDuration: ""
  }));
};

const handleFormChange = (field: keyof typeof formValues, value: string) => {
  setFormValues(prev => ({
    ...prev,
    [field]: value
  }));
};

const handleConfirmListing = async () => {
  if (!selectedNft || !formValues.salePrice) return;

  const priceInOctas = parseFloat(formValues.salePrice) * OCTAS;
  const success = await handleTransaction(
    "list_for_sale",
    [MARKETPLACE_ADDRESS, selectedNft.id.toString(), priceInOctas.toString()],
    "NFT listed for sale successfully!"
  );

  if (success) {
    handleModalClose('sell');
  }
};

const handleTransferNFT = async () => {
  if (!selectedNft || !formValues.transferAddress) return;

  const success = await handleTransaction(
    "transfer_nft",
    [MARKETPLACE_ADDRESS, selectedNft.id.toString(), formValues.transferAddress],
    "NFT transferred successfully!"
  );

  if (success) {
    handleModalClose('transfer');
  }
};

const handleCreateAuction = async () => {
  if (!selectedNft || !formValues.auctionStartPrice || !formValues.auctionDuration) return;

  const startPriceInOctas = parseFloat(formValues.auctionStartPrice) * OCTAS;
  const durationInSeconds = parseInt(formValues.auctionDuration) * 3600;

  const success = await handleTransaction(
    "create_auction",
    [
      MARKETPLACE_ADDRESS,
      selectedNft.id.toString(),
      startPriceInOctas.toString(),
      durationInSeconds.toString()
    ],
    "Auction created successfully!"
  );

  if (success) {
    handleModalClose('auction');
  }
};

  const handleStopAuction = async (auctionId: number) => {
    await handleTransaction(
      "stop_auction",
      [MARKETPLACE_ADDRESS, auctionId.toString()],
      "Auction stopped successfully!"
    );
  };

  const filteredNFTs = getFilteredNFTs(nfts, priceRange, sortBy);


  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Title level={2}>My Collection</Title>
      <FilterSection
        rarity={rarity}
        sortBy={sortBy}
        priceRange={priceRange}
        onRarityChange={setRarity}
        onSortChange={setSortBy}
        onPriceRangeChange={setPriceRange}
      />
      <Row gutter={[24, 24]} justify="center">
        {filteredNFTs
          .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
          .map((nft) => (
            <Col key={nft.id} xs={24} sm={12} md={8} lg={6}>
              <NFTCard
                nft={nft}
                mode="owned"
                onSellClick={() => handleModalOpen('sell', nft)}
                onAuctionClick={() => handleModalOpen('auction', nft)}
                onTransferClick={() => handleModalOpen('transfer', nft)}
                onStopAuction={(id) => handleStopAuction(id)}
              />
            </Col>
          ))}
      </Row>

      <Pagination
        current={currentPage}
        pageSize={PAGE_SIZE}
        total={filteredNFTs.length}
        onChange={setCurrentPage}
        style={{ marginTop: "20px" }}
      />

      {/* Modals */}
      <SellModal
        visible={modalStates.sell}
        selectedNft={selectedNft}
        salePrice={formValues.salePrice}
        onCancel={() => handleModalClose('sell')}
        onConfirm={handleConfirmListing}
        onPriceChange={(value) => handleFormChange('salePrice', value)}
      />
      
      <TransferModal
        visible={modalStates.transfer}
        selectedNft={selectedNft}
        transferAddress={formValues.transferAddress}
        onCancel={() => handleModalClose('transfer')}
        onConfirm={handleTransferNFT}
        onAddressChange={(value) => handleFormChange('transferAddress', value)}
      />
      
      <AuctionModal
        visible={modalStates.auction}
        selectedNft={selectedNft}
        startPrice={formValues.auctionStartPrice}
        duration={formValues.auctionDuration}
        onCancel={() => handleModalClose('auction')}
        onConfirm={handleCreateAuction}
        onStartPriceChange={(value) => handleFormChange('auctionStartPrice', value)}
        onDurationChange={(value) => handleFormChange('auctionDuration', value)}
      />
    </div>
  );
};

export default MyNFTs;
