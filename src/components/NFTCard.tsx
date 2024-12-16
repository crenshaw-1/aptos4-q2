import React from 'react';
import { Card, Button, Tag } from 'antd';
import { NFT } from '../types';
import { RARITY_COLORS, RARITY_LABELS } from '../constants';
import { truncateAddress } from '../utils';

const { Meta } = Card;

interface NFTCardProps {
  nft: NFT;
  mode: 'market' | 'owned';
  onBuyClick?: (nft: NFT) => void;
  onSellClick?: (nft: NFT) => void;
  onAuctionClick?: (nft: NFT) => void;
  onTransferClick?: (nft: NFT) => void;
  onStopAuction?: (id: number) => void;
}

export const NFTCard: React.FC<NFTCardProps> = ({
  nft,
  mode,
  onBuyClick,
  onSellClick,
  onAuctionClick,
  onTransferClick,
  onStopAuction,
}) => {
  const renderActions = () => {
    if (mode === 'market') {
      return [
        <Button type="link" onClick={() => onBuyClick?.(nft)}>
          Buy
        </Button>
      ];
    }

    return nft.in_auction ? [
      <Button 
        key="stopAuction" 
        type="link" 
        danger
        onClick={() => onStopAuction?.(nft.id)}
      >
        Stop Auction
      </Button>
    ] : [
      <Button key="sell" type="link" onClick={() => onSellClick?.(nft)}>
        Sell
      </Button>,
      <Button key="auction" type="link" onClick={() => onAuctionClick?.(nft)}>
        Create Auction
      </Button>,
      <Button key="transfer" type="link" onClick={() => onTransferClick?.(nft)}>
        Transfer
      </Button>
    ];
  };

  return (
    <Card
      hoverable
      style={{
        width: "100%",
        maxWidth: "280px",
        minWidth: "220px",
        margin: "0 auto",
      }}
      cover={<img alt={nft.name} src={nft.uri} />}
      actions={renderActions()}
    >
      <Tag
        color={RARITY_COLORS[nft.rarity]}
        style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "10px" }}
      >
        {RARITY_LABELS[nft.rarity]}
      </Tag>

      <Meta 
        title={nft.name} 
        description={`Price: ${nft.price} APT`} 
      />
      
      <p>{nft.description}</p>
      <p>ID: {nft.id}</p>
      <p>Owner: {truncateAddress(nft.owner)}</p>

      {mode === 'owned' && (
        <div style={{ margin: "10px 0" }}>
          {nft.in_auction ? (
            <Tag color="purple" style={{ marginTop: '8px', display: 'inline-block' }}>
              In Auction
            </Tag>
          ) : (
            <p>For Sale: {nft.for_sale ? "Yes" : "No"}</p>
          )}
        </div>
      )}
    </Card>
  );
};
