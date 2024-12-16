import React, { useState, useEffect } from 'react';
import { message, Slider } from 'antd';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AuctionCard } from '../components/AuctionCard';
import { fetchActiveAuctions, placeBid, stopAuction } from '../api';
import { Auction, AuctionProps, BidAmounts } from '../types';

const AuctionView: React.FC<AuctionProps> = ({ marketplaceAddr }) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [bidAmounts, setBidAmounts] = useState<BidAmounts>({});
  const { account } = useWallet();


  const handleBidAmountChange = (auctionId: number, value: string) => {
    setBidAmounts(prev => ({
      ...prev,
      [auctionId]: value
    }));
  };

  const fetchAuctions = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    try {
      const activeAuctions = await fetchActiveAuctions(marketplaceAddr);
      setAuctions(activeAuctions);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      message.error('Failed to load auctions');
    }
  };

  const handlePlaceBid = async (auctionId: number) => {
    if (!account) {
      message.error('Please connect your wallet');
      return;
    }

    const bidAmount = bidAmounts[auctionId];
    if (!bidAmount) return;

    try {
      await placeBid(marketplaceAddr, auctionId, parseFloat(bidAmount));
      message.success('Bid placed successfully!');
      fetchAuctions();
      setBidAmounts(prev => ({
        ...prev,
        [auctionId]: ''
      }));
    } catch (error) {
      console.error('Error placing bid:', error);
      message.error('Failed to place bid');
    }
  };

  const handleStopAuction = async (auctionId: number) => {
    try {
      await stopAuction(marketplaceAddr, auctionId);
      message.success('Auction stopped successfully');
      fetchAuctions();
    } catch (error: any) {
      console.error('Stop auction error:', error);
      console.log("Message", error.message);
      if (error.message?.includes('1201')) {
        message.error('Only the auction seller can stop the auction');
      } else if (error.message?.includes('1202')) {
        message.error('This auction is no longer active');
      } else if (error.message?.includes('1203')) {
        message.error('This NFT is not in an auction state');
      } else {
        message.error('Failed to stop auction. Please try again.');
      }
    }
  };

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setAuctions(prev => [...prev]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  return (
    <div className="auction-container" style={{ padding: '20px' }}>
      <h2>Live Auctions</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {auctions.map((auction) => (
          <AuctionCard
            key={auction.id}
            auction={auction}
            bidAmount={bidAmounts[auction.id] || ''}
            userAddress={account?.address}
            onBidAmountChange={(value) => handleBidAmountChange(auction.id, value)}
            onPlaceBid={() => handlePlaceBid(auction.id)}
            onStopAuction={() => handleStopAuction(auction.nftId)}
          />
        ))}
      </div>
    </div>
  );
};

export default AuctionView;
