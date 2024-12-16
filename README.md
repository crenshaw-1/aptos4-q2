# NFT Marketplace: Auction & Transfer Features

## Auction System

### Creating an Auction
- Select any owned NFT to start an auction
- Set starting price in APT
- Define auction duration (in hours)
- NFT gets locked during active auction

### Bidding
- View all active auctions in the Auction tab
- Place bids higher than current highest bid
- Automatic refund of previous highest bidder
- Real-time auction status updates

### Auction Management
- Sellers can stop auctions at any time
- Automatic bidder refunds on auction stop
- Auction ends automatically after duration expires
- Winners receive NFT directly to their wallet

## NFT Transfer System

### Direct Transfers
- Transfer NFTs directly to any Aptos wallet address
- No fees for peer-to-peer transfers
- Instant delivery to recipient
- Transaction confirmation and tracking

## Technical Integration

### Smart Contract Functions
```move
stop_auction(account: &signer, marketplace_addr: address, auction_id: u64)
transfer_nft(from: &signer, to: address, nft_id: u64)
create_auction(seller: &signer, nft_id: u64, start_price: u64, duration: u64)
place_bid(bidder: &signer, auction_id: u64, bid_amount: u64)

Frontend Integration
- Real-time auction updates
- Wallet connection required for transactions
- Transaction status notifications
- Error handling and user feedback
- Usage Examples


Creating an Auction:
- Click "Create Auction" on owned NFT
- Set price and duration
- Confirm transaction

Transferring NFT:
- Select NFT from inventory
- Click "Transfer"
- Enter recipient address
- Confirm transaction

Error Codes
Code	Description
1200	NFT not found
1201	Not auction owner
4000	Auction not found
