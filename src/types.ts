export interface NFT {
    id: number;
    name: string;
    owner: string;
    description: string;
    uri: string;
    rarity: number;
    price: number;
    for_sale: boolean;
    in_auction: boolean;
  }

  export interface MarketViewProps {
    marketplaceAddr: string;
  }
  
  export type SortOption = 'latest' | 'price_asc' | 'price_desc' | 'rarity';
  export type RarityFilter = 'all' | number;

  export interface NFTDetails {
    name: string;
    description: string;
    uri: string;
  }
  
  export interface Auction {
    id: number;
    nftId: number;
    currentBid: number;
    endTime: number;
    highestBidder: string;
    seller: string;
    active: boolean;
    nftDetails?: NFTDetails;
  }
  
  export interface MoveAuction {
    nft_id: string;
    seller: string;
    start_price: string;
    current_bid: string;
    highest_bidder: string;
    end_time: string;
    active: boolean;
  }
  
  export interface AuctionProps {
    marketplaceAddr: string;
  }
  
  export interface BidAmounts {
    [key: number]: string;
  }
  