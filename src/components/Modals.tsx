import React from 'react';
import { Modal, Button, Input } from 'antd';
import { NFT } from '../types';
import { truncateAddress } from '@aptos-labs/wallet-adapter-react';
import { RARITY_LABELS } from '../constants';

interface SellModalProps {
  visible: boolean;
  selectedNft: NFT | null;
  salePrice: string;
  onCancel: () => void;
  onConfirm: () => void;
  onPriceChange: (value: string) => void;
}


interface TransferModalProps {
    visible: boolean;
    selectedNft: NFT | null;
    transferAddress: string;
    onCancel: () => void;
    onConfirm: () => void;
    onAddressChange: (value: string) => void;
}

interface AuctionModalProps {
    visible: boolean;
    selectedNft: NFT | null;
    startPrice: string;
    duration: string;
    onCancel: () => void;
    onConfirm: () => void;
    onStartPriceChange: (value: string) => void;
    onDurationChange: (value: string) => void;
}

interface PurchaseModalProps {
    visible: boolean;
    nft: NFT | null;
    onCancel: () => void;
    onConfirm: () => void;
  }

export const SellModal: React.FC<SellModalProps> = ({
  visible,
  selectedNft,
  salePrice,
  onCancel,
  onConfirm,
  onPriceChange,
}) => (
  <Modal
    title="Sell NFT"
    visible={visible}
    onCancel={onCancel}
    footer={[
      <Button key="cancel" onClick={onCancel}>Cancel</Button>,
      <Button key="confirm" type="primary" onClick={onConfirm}>Confirm Listing</Button>,
    ]}
  >
    {selectedNft && (
      <>
        <p><strong>NFT ID:</strong> {selectedNft.id}</p>
        <p><strong>Name:</strong> {selectedNft.name}</p>
        <p><strong>Description:</strong> {selectedNft.description}</p>
        <p><strong>Rarity:</strong> {selectedNft.rarity}</p>
        <p><strong>Current Price:</strong> {selectedNft.price} APT</p>
        <Input
          type="number"
          placeholder="Enter sale price in APT"
          value={salePrice}
          onChange={(e) => onPriceChange(e.target.value)}
          style={{ marginTop: 10 }}
        />
      </>
    )}
  </Modal>
);

export const TransferModal: React.FC<TransferModalProps> = ({
  visible,
  selectedNft,
  transferAddress,
  onCancel,
  onConfirm,
  onAddressChange,
}) => (
  <Modal
    title="Transfer NFT"
    visible={visible}
    onCancel={onCancel}
    footer={[
      <Button key="cancel" onClick={onCancel}>Cancel</Button>,
      <Button key="confirm" type="primary" onClick={onConfirm}>Transfer NFT</Button>,
    ]}
  >
    {selectedNft && (
      <>
        <p><strong>NFT ID:</strong> {selectedNft.id}</p>
        <p><strong>Name:</strong> {selectedNft.name}</p>
        <Input
          placeholder="Enter recipient address"
          value={transferAddress}
          onChange={(e) => onAddressChange(e.target.value)}
          style={{ marginTop: 10 }}
        />
      </>
    )}
  </Modal>
);

export const AuctionModal: React.FC<AuctionModalProps> = ({
    visible,
    selectedNft,
    startPrice,
    duration,
    onCancel,
    onConfirm,
    onStartPriceChange,
    onDurationChange,
  }) => (
    <Modal
      title="Create Auction"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button key="confirm" type="primary" onClick={onConfirm}>Create Auction</Button>,
      ]}
    >
      {selectedNft && (
        <>
          <p><strong>NFT ID:</strong> {selectedNft.id}</p>
          <p><strong>Name:</strong> {selectedNft.name}</p>
          <Input
            type="number"
            placeholder="Starting price in APT"
            value={startPrice}
            onChange={(e) => onStartPriceChange(e.target.value)}
            style={{ marginTop: 10, marginBottom: 10 }}
          />
          <Input
            type="number"
            placeholder="Duration in hours"
            value={duration}
            onChange={(e) => onDurationChange(e.target.value)}
            style={{ marginBottom: 10 }}
          />
        </>
      )}
    </Modal>
  );

  export const PurchaseModal: React.FC<PurchaseModalProps> = ({
    visible,
    nft,
    onCancel,
    onConfirm,
  }) => (
    <Modal
      title="Purchase NFT"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button key="confirm" type="primary" onClick={onConfirm}>Confirm Purchase</Button>,
      ]}
    >
      {nft && (
        <>
          <p><strong>NFT ID:</strong> {nft.id}</p>
          <p><strong>Name:</strong> {nft.name}</p>
          <p><strong>Description:</strong> {nft.description}</p>
          <p><strong>Rarity:</strong> {RARITY_LABELS[nft.rarity]}</p>
          <p><strong>Price:</strong> {nft.price} APT</p>
          <p><strong>Owner:</strong> {truncateAddress(nft.owner)}</p>
        </>
      )}
    </Modal>
  );