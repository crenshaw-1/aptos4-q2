import React, { useState, useEffect } from 'react';
import { Card, Button, Input, message, Modal, Image } from 'antd';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AptosClient } from 'aptos';

const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');

interface NFTDetails {
    name: string;
    description: string;
    uri: string;
}

interface Auction {
    id: number;
    nftId: number;
    currentBid: number;
    endTime: number;
    highestBidder: string;
    seller: string;
    active: boolean;
    nftDetails?: NFTDetails;
}

type MoveAuction = {
    nft_id: string;
    seller: string;
    start_price: string;
    current_bid: string;
    highest_bidder: string;
    end_time: string;
    active: boolean;
}

const formatTimeRemaining = (endTime: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) return 'Ended';
    
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    
    return `${hours}h ${minutes}m ${seconds}s`;
};

interface AuctionProps {
    marketplaceAddr: string;
}

const AuctionView: React.FC<AuctionProps> = ({ marketplaceAddr }) => {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [bidAmounts, setBidAmounts] = useState<{ [key: number]: string }>({});
    const { account, signAndSubmitTransaction } = useWallet();

    const fetchNFTDetails = async (nftId: number): Promise<NFTDetails> => {
        try {
            const response = await client.view({
                function: `${marketplaceAddr}::NFTMarketplace::get_nft_details`,
                arguments: [marketplaceAddr, nftId.toString()],
                type_arguments: [],
            });
    
            const [_, __, name, description, uri] = response;
    
            const hexToUint8Array = (hexString: string): Uint8Array => {
                const bytes = new Uint8Array(hexString.length / 2);
                for (let i = 0; i < hexString.length; i += 2) {
                    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
                }
                return bytes;
            };
    
            return {
                name: new TextDecoder().decode(hexToUint8Array(String(name).slice(2))),
                description: new TextDecoder().decode(hexToUint8Array(String(description).slice(2))),
                uri: new TextDecoder().decode(hexToUint8Array(String(uri).slice(2))),
            };
        } catch (error) {
            console.error('Error fetching NFT details:', error);
            throw error;
        }
    };

    const handleBidAmountChange = (auctionId: number, value: string) => {
        setBidAmounts(prev => ({
            ...prev,
            [auctionId]: value
        }));
    };    

    // Update the fetchAuctions function to only show active auctions
    const fetchAuctions = async () => {
        try {
            const response = await client.view({
                function: `${marketplaceAddr}::NFTMarketplace::get_active_auctions`,
                arguments: [marketplaceAddr],
                type_arguments: [],
            });
    
            // Type assertion and proper array handling
            const activeAuctions = response[0] as MoveAuction[];
            const auctionsWithDetails = await Promise.all(
                activeAuctions.map(async (auction: MoveAuction) => {
                    const nftDetails = await fetchNFTDetails(Number(auction.nft_id));
                    return {
                        id: Number(auction.nft_id),
                        nftId: Number(auction.nft_id),
                        currentBid: Number(auction.current_bid) / 100000000,
                        endTime: Number(auction.end_time),
                        highestBidder: auction.highest_bidder,
                        seller: auction.seller,
                        active: auction.active,
                        nftDetails,
                    };
                })
            );
    
            setAuctions(auctionsWithDetails);
        } catch (error) {
            console.error('Error fetching auctions:', error);
            message.error('Failed to load auctions');
        }
    };
    


    const placeBid = async (auctionId: number) => {
        if (!account) {
            message.error('Please connect your wallet');
            return;
        }
    
        const auction = auctions.find(a => a.id === auctionId);
        if (!auction) return;
    
        const bidAmount = bidAmounts[auctionId];
        if (!bidAmount) return;
    
        try {
            const transaction = {
                type: "entry_function_payload",
                function: `${marketplaceAddr}::NFTMarketplace::place_bid`,
                type_arguments: [],
                arguments: [
                    marketplaceAddr,
                    auctionId.toString(),
                    (parseFloat(bidAmount) * 100000000).toString()
                ]
            };
    
            const response = await (window as any).aptos.signAndSubmitTransaction(transaction);
            await client.waitForTransaction(response.hash);
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
            const transaction = {
                type: "entry_function_payload",
                function: `${marketplaceAddr}::NFTMarketplace::stop_auction`,
                type_arguments: [],
                arguments: [
                    marketplaceAddr,  // marketplace address
                    auctionId.toString()  // auction ID
                ]
            };
    
            const pendingTransaction = await (window as any).aptos.signAndSubmitTransaction(transaction);
            await client.waitForTransaction(pendingTransaction.hash);
            
            message.success('Auction stopped successfully');
            fetchAuctions(); // Refresh the NFT list
        } catch (error: any) {
            console.error('Stop auction error:', error);
            
            // More specific error messages
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {auctions.map((auction) => (
                    <Card 
                        key={auction.id} 
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
                            account?.address.toLowerCase() === auction.seller.toLowerCase() && (
                                <Button
                                    key="stopAuction"
                                    type="primary"
                                    danger
                                    onClick={() => handleStopAuction(auction.id)}
                                >
                                    Stop Auction
                                </Button>
                            )
                        ].filter(Boolean)}
                    >
                        <p>NFT ID: {auction.nftId}</p>
                        <p>Current Bid: {auction.currentBid} APT</p>
                        <p>Time Remaining: {formatTimeRemaining(auction.endTime)}</p>
                        <p>Highest Bidder: {auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}</p>
                        <p>Seller: {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}</p>
                        
                        {auction.active && account && 
                            auction.seller.toLowerCase() !== account.address.toLowerCase() && (
                                <div style={{ marginTop: '15px' }}>
                                    <Input
                                        style={{ marginBottom: '10px' }}
                                        placeholder="Enter bid amount in APT"
                                        value={bidAmounts[auction.id] || ''}
                                        onChange={(e) => handleBidAmountChange(auction.id, e.target.value)}
                                        type="number"
                                        min={auction.currentBid + 0.1}
                                        step="0.1"
                                    />
                                    <Button 
                                        type="primary" 
                                        block
                                        onClick={() => placeBid(auction.id)}
                                        disabled={!bidAmounts[auction.id] || 
                                                parseFloat(bidAmounts[auction.id]) <= auction.currentBid}
                                    >
                                        Place Bid
                                    </Button>
                                </div>
                            )}
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AuctionView;
