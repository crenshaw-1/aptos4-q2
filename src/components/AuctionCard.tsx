import React from 'react';
import { Card, Button, Input, Image } from 'antd';
import { Auction } from '../types';
import { formatTimeRemaining, truncateAddress } from '../utils';

interface AuctionCardProps {
  auction: Auction;
  bidAmount: string;
  userAddress?: string;
  onBidAmountChange: (value: string) => void;
  onPlaceBid: () => void;
  onStopAuction: () => void;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({
  auction,
  bidAmount,
  userAddress,
  onBidAmountChange,
  onPlaceBid,
  onStopAuction,
}) => (
  <Card 
    title={auction.nftDetails?.name}
    style={{ marginBottom: '20px' }}
    cover={
      <Image
        alt={auction.nftDetails?.name}
        src={auction.nftDetails?.uri}
        style={{ height: 200, objectFit: 'cover' }}
      />
    }
    actions={[
      userAddress?.toLowerCase() === auction.seller.toLowerCase() && (
        <Button
          key="stopAuction"
          type="primary"
          danger
          onClick={onStopAuction}
        >
          Stop Auction
        </Button>
      )
    ].filter(Boolean)}
  >
    <p>NFT ID: {auction.nftId}</p>
    <p>Current Bid: {auction.currentBid} APT</p>
    <p>Time Remaining: {formatTimeRemaining(auction.endTime)}</p>
    <p>Highest Bidder: {truncateAddress(auction.highestBidder)}</p>
    <p>Seller: {truncateAddress(auction.seller)}</p>
    
    {auction.active && userAddress && 
      auction.seller.toLowerCase() !== userAddress.toLowerCase() && (
        <div style={{ marginTop: '15px' }}>
          <Input
            style={{ marginBottom: '10px' }}
            placeholder="Enter bid amount in APT"
            value={bidAmount}
            onChange={(e) => onBidAmountChange(e.target.value)}
            type="number"
            min={auction.currentBid + 0.1}
            step="0.1"
          />
          <Button 
            type="primary" 
            block
            onClick={onPlaceBid}
            disabled={!bidAmount || parseFloat(bidAmount) <= auction.currentBid}
          >
            Place Bid
          </Button>
        </div>
      )}
  </Card>
);
