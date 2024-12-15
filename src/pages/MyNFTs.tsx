import React, { useEffect, useState, useCallback } from "react";
import { Typography, Card, Row, Col, Pagination, message, Button, Input, Modal, Tag } from "antd";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const { Title } = Typography;
const { Meta } = Card;

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

type NFT = {
  id: number;
  name: string;
  owner: string;
  description: string;
  uri: string;
  rarity: number;
  price: number;
  for_sale: boolean;
  in_auction: boolean; // New field
};

const MyNFTs: React.FC = () => {
  const pageSize = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const { account, signAndSubmitTransaction } = useWallet();
  const marketplaceAddr = "0x8a7bb6820951395ea0a351ff4ba8c551daf013f652e0791a7b60b67f71ced7b6";

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [salePrice, setSalePrice] = useState<string>("");
  
  const [isAuctionModalVisible, setIsAuctionModalVisible] = useState(false);
  const [auctionStartPrice, setAuctionStartPrice] = useState("");
  const [auctionDuration, setAuctionDuration] = useState("");

  const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
  const [transferAddress, setTransferAddress] = useState("");


  const handleTransferNFT = async () => {
    if (!selectedNft || !transferAddress) return;

    try {
        const transaction = {
            type: "entry_function_payload",
            function: `${marketplaceAddr}::NFTMarketplace::transfer_nft`,
            type_arguments: [],
            arguments: [
                marketplaceAddr,
                selectedNft.id.toString(),
                transferAddress
            ]
        };

        const response = await (window as any).aptos.signAndSubmitTransaction(transaction);
        await client.waitForTransaction(response.hash);

        message.success("NFT transferred successfully!");
        setIsTransferModalVisible(false);
        setTransferAddress("");
        setSelectedNft(null);
        fetchUserNFTs();
    } catch (error) {
        console.error("Error transferring NFT:", error);
        message.error("Failed to transfer NFT");
    }
  };


  const fetchUserNFTs = useCallback(async () => {
    if (!account) return;

    try {
      console.log("Fetching NFT IDs for owner:", account.address);

      const nftIdsResponse = await client.view({
        function: `${marketplaceAddr}::NFTMarketplace::get_all_nfts_for_owner`,
        arguments: [marketplaceAddr, account.address, "100", "0"],
        type_arguments: [],
      });

      const nftIds = Array.isArray(nftIdsResponse[0]) ? nftIdsResponse[0] : nftIdsResponse;
      setTotalNFTs(nftIds.length);

      if (nftIds.length === 0) {
        console.log("No NFTs found for the owner.");
        setNfts([]);
        return;
      }

      console.log("Fetching details for each NFT ID:", nftIds);

      const userNFTs = (await Promise.all(
        nftIds.map(async (id) => {
          try {
            const nftDetails = await client.view({
              function: `${marketplaceAddr}::NFTMarketplace::get_nft_details`,
              arguments: [marketplaceAddr, id],
              type_arguments: [],
            });

            const [nftId, owner, name, description, uri, price, forSale, rarity] = nftDetails as [
              number,
              string,
              string,
              string,
              string,
              number,
              boolean,
              number
            ];
            const inAuction = await checkAuctionStatus(nftId);

            const hexToUint8Array = (hexString: string): Uint8Array => {
              const bytes = new Uint8Array(hexString.length / 2);
              for (let i = 0; i < hexString.length; i += 2) {
                bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
              }
              return bytes;
            };

            return {
              id: nftId,
              name: new TextDecoder().decode(hexToUint8Array(name.slice(2))),
              description: new TextDecoder().decode(hexToUint8Array(description.slice(2))),
              uri: new TextDecoder().decode(hexToUint8Array(uri.slice(2))),
              rarity,
              price: price / 100000000, // Convert octas to APT
              for_sale: forSale,
              in_auction: inAuction,
            };
          } catch (error) {
            console.error(`Error fetching details for NFT ID ${id}:`, error);
            return null;
          }
        })
      )).filter((nft): nft is NFT => nft !== null);

      console.log("User NFTs:", userNFTs);
      setNfts(userNFTs);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      message.error("Failed to fetch your NFTs.");
    }
  }, [account, marketplaceAddr]);

  const checkAuctionStatus = async (nftId: number): Promise<boolean> => {
    try {
      const response = await client.view({
        function: `${marketplaceAddr}::NFTMarketplace::is_nft_in_auction`,
        arguments: [marketplaceAddr, nftId.toString()],
        type_arguments: [],
      });
      // Explicitly convert the response to boolean
      return response[0] === true;
    } catch (error) {
      console.error('Error checking auction status:', error);
      return false;
    }
  };  

  const handleStopAuction = async (auctionId: number) => {
    try {
        const transaction = {
            type: "entry_function_payload",
            function: `${marketplaceAddr}::NFTMarketplace::stop_auction`,
            type_arguments: [],
            arguments: [marketplaceAddr, auctionId.toString()]
        };

        const response = await (window as any).aptos.signAndSubmitTransaction(transaction);
        await client.waitForTransaction(response.hash);
        message.success('Auction stopped successfully');
    } catch (error) {
        console.error('Error stopping auction:', error);
        message.error('Failed to stop auction');
    }
};

  const handleCreateAuction = async () => {
    if (!selectedNft || !auctionStartPrice || !auctionDuration) return;

    try {
        const startPriceInOctas = parseFloat(auctionStartPrice) * 100000000;
        const durationInSeconds = parseInt(auctionDuration) * 3600; // Convert hours to seconds

        const transaction = {
            type: "entry_function_payload",
            function: `${marketplaceAddr}::NFTMarketplace::create_auction`,
            type_arguments: [],
            arguments: [
                marketplaceAddr,
                selectedNft.id.toString(),
                startPriceInOctas.toString(),
                durationInSeconds.toString()
            ]
        };

        const response = await (window as any).aptos.signAndSubmitTransaction(transaction);
        await client.waitForTransaction(response.hash);

        message.success("Auction created successfully!");
        setIsAuctionModalVisible(false);
        setAuctionStartPrice("");
        setAuctionDuration("");
        fetchUserNFTs();
    } catch (error) {
        console.error("Error creating auction:", error);
        message.error("Failed to create auction");
    }
};

  const handleSellClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedNft(null);
    setSalePrice("");
  };

  const handleConfirmListing = async () => {
    if (!selectedNft || !salePrice) return;
  
    try {
      const priceInOctas = parseFloat(salePrice) * 100000000;
  
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::list_for_sale`,
        type_arguments: [],
        arguments: [marketplaceAddr, selectedNft.id.toString(), priceInOctas.toString()],
      };
  
      // Bypass type checking
      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);
  
      message.success("NFT listed for sale successfully!");
      setIsModalVisible(false);
      setSalePrice("");
      fetchUserNFTs();
    } catch (error) {
      console.error("Error listing NFT for sale:", error);
      message.error("Failed to list NFT for sale.");
    }
  };

  useEffect(() => {
    fetchUserNFTs();
  }, [fetchUserNFTs, currentPage]);

  const paginatedNFTs = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Title level={2} style={{ marginBottom: "20px" }}>My Collection</Title>
      <p>Your personal collection of NFTs.</p>
  
      {/* Card Grid */}
      <Row
        gutter={[24, 24]}
        style={{
          marginTop: 20,
          width: "100%",
          maxWidth: "100%",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {paginatedNFTs.map((nft) => (
          <Col
            key={nft.id}
            xs={24} sm={12} md={8} lg={8} xl={6}
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
           <Card
              hoverable
              style={{
                  width: "100%",
                  maxWidth: "280px",
                  minWidth: "220px",
                  margin: "0 auto",
              }}
              cover={<img alt={nft.name} src={nft.uri} />}
              actions={[
                !nft.in_auction ? (
                    <>
                        <Button key="sell" type="link" onClick={() => handleSellClick(nft)}>
                            Sell
                        </Button>
                        <Button
                            key="auction"
                            type="link"
                            onClick={() => {
                                setSelectedNft(nft);
                                setIsAuctionModalVisible(true);
                            }}
                        >
                            Create Auction
                        </Button>
                        <Button
                            key="transfer"
                            type="link"
                            onClick={() => {
                                setSelectedNft(nft);
                                setIsTransferModalVisible(true);
                            }}
                        >
                            Transfer
                        </Button>
                    </>
                ) : (
                    <Button 
                        key="stopAuction" 
                        type="link" 
                        danger
                        onClick={() => handleStopAuction(nft.id)}
                    >
                        Stop Auction
                    </Button>
                )
            ]}         
          >
              <Meta title={nft.name} description={`Rarity: ${nft.rarity}, Price: ${nft.price} APT`} />
              <p>ID: {nft.id}</p>
              <p>{nft.description}</p>
              <div style={{ margin: "10px 0" }}>
                  {nft.in_auction ? (
                      <Tag color="purple" style={{ marginTop: '8px', display: 'inline-block' }}>
                          In Auction
                      </Tag>
                  ) : (
                      <p>For Sale: {nft.for_sale ? "Yes" : "No"}</p>
                  )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
  
      <div style={{ marginTop: 30, marginBottom: 30 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalNFTs}
          onChange={(page) => setCurrentPage(page)}
          style={{ display: "flex", justifyContent: "center" }}
        />
      </div>
  
      <Modal
        title="Sell NFT"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmListing}>
            Confirm Listing
          </Button>,
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
              onChange={(e) => setSalePrice(e.target.value)}
              style={{ marginTop: 10 }}
            />
          </>
        )}
      </Modal>

      <Modal
        title="Transfer NFT"
        visible={isTransferModalVisible}
        onCancel={() => {
            setIsTransferModalVisible(false);
            setSelectedNft(null);
            setTransferAddress("");
        }}
        footer={[
            <Button key="cancel" onClick={() => setIsTransferModalVisible(false)}>
                Cancel
            </Button>,
            <Button key="confirm" type="primary" onClick={handleTransferNFT}>
                Transfer NFT
            </Button>
        ]}
    >
        {selectedNft && (
            <>
                <p><strong>NFT ID:</strong> {selectedNft.id}</p>
                <p><strong>Name:</strong> {selectedNft.name}</p>
                <Input
                    placeholder="Enter recipient address"
                    value={transferAddress}
                    onChange={(e) => setTransferAddress(e.target.value)}
                    style={{ marginTop: 10 }}
                />
            </>
        )}
      </Modal>

      <Modal
          title="Create Auction"
          visible={isAuctionModalVisible}
          onCancel={() => {
              setIsAuctionModalVisible(false);
              setSelectedNft(null);
              setAuctionStartPrice("");
              setAuctionDuration("");
          }}
          footer={[
              <Button key="cancel" onClick={() => setIsAuctionModalVisible(false)}>
                  Cancel
              </Button>,
              <Button key="confirm" type="primary" onClick={handleCreateAuction}>
                  Create Auction
              </Button>
          ]}
      >
          {selectedNft && (
              <>
                  <p><strong>NFT ID:</strong> {selectedNft.id}</p>
                  <p><strong>Name:</strong> {selectedNft.name}</p>
                  <Input
                      type="number"
                      placeholder="Starting price in APT"
                      value={auctionStartPrice}
                      onChange={(e) => setAuctionStartPrice(e.target.value)}
                      style={{ marginTop: 10, marginBottom: 10 }}
                  />
                  <Input
                      type="number"
                      placeholder="Duration in hours"
                      value={auctionDuration}
                      onChange={(e) => setAuctionDuration(e.target.value)}
                      style={{ marginBottom: 10 }}
                  />
              </>
          )}
      </Modal>
    </div>
  );  
};

export default MyNFTs;