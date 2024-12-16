import React, { useState, useEffect } from "react";
import { Typography, Row, Col, Pagination, message } from "antd";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { NFTCard } from "../components/NFTCard";
import { FilterSection } from "../components/FilterSection";
import { PurchaseModal } from "../components/Modals";
import { fetchNFTs, purchaseNFT } from "../api";
import { NFT, MarketViewProps, RarityFilter, SortOption } from "../types";
import { PAGE_SIZE } from "../constants";
import { getFilteredNFTs } from "../utils";

const { Title } = Typography;

const MarketView: React.FC<MarketViewProps> = ({ marketplaceAddr }) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rarity, setRarity] = useState<RarityFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isBuyModalVisible, setIsBuyModalVisible] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  const { signAndSubmitTransaction } = useWallet();

  const loadNFTs = async (selectedRarity?: number) => {
    try {
      const fetchedNFTs = await fetchNFTs(marketplaceAddr, selectedRarity);
      setNfts(fetchedNFTs);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      message.error("Failed to fetch NFTs.");
    }
  };

  useEffect(() => {
    loadNFTs(rarity === 'all' ? undefined : rarity);
  }, [rarity, marketplaceAddr]);

  const handleBuyClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsBuyModalVisible(true);
  };

  const handlePurchase = async () => {
    if (!selectedNft) return;

    try {
      await purchaseNFT(marketplaceAddr, selectedNft.id, selectedNft.price);
      message.success("NFT purchased successfully!");
      setIsBuyModalVisible(false);
      loadNFTs(rarity === 'all' ? undefined : rarity);
    } catch (error) {
      console.error("Error purchasing NFT:", error);
      message.error("Failed to purchase NFT.");
    }
  };

  const filteredNfts = getFilteredNFTs(nfts, priceRange, sortBy);
  const paginatedNfts = filteredNfts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Title level={2}>Marketplace</Title>

      <FilterSection
        rarity={rarity}
        sortBy={sortBy}
        priceRange={priceRange}
        onRarityChange={setRarity}
        onSortChange={setSortBy}
        onPriceRangeChange={setPriceRange}
      />

      <Row gutter={[24, 24]} justify="center">
        {paginatedNfts.map((nft) => (
          <Col key={nft.id} xs={24} sm={12} md={8} lg={6}>
            <NFTCard nft={nft} mode="market" onBuyClick={handleBuyClick} />
          </Col>
        ))}
      </Row>

      <Pagination
        current={currentPage}
        pageSize={PAGE_SIZE}
        total={filteredNfts.length}
        onChange={setCurrentPage}
        style={{ margin: "30px 0" }}
      />

      <PurchaseModal
        visible={isBuyModalVisible}
        nft={selectedNft}
        onCancel={() => setIsBuyModalVisible(false)}
        onConfirm={handlePurchase}
      />
    </div>
  );
};

export default MarketView;
