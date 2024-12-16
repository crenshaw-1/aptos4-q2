import { OCTAS } from "./constants";
import { NFT, SortOption } from "./types";

export const hexToUint8Array = (hexString: string): Uint8Array => {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes;
  };
  
  export const decodeHexString = (hexString: string): string => {
    return new TextDecoder().decode(hexToUint8Array(hexString.slice(2)));
  };

  
  export const truncateAddress = (address: string, start = 6, end = 4): string => {
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };
  
  
  export const decodeNFTData = (nft: any): NFT => ({
    ...nft,
    name: new TextDecoder().decode(hexToUint8Array(nft.name.slice(2))),
    description: new TextDecoder().decode(hexToUint8Array(nft.description.slice(2))),
    uri: new TextDecoder().decode(hexToUint8Array(nft.uri.slice(2))),
    price: nft.price / OCTAS,
  });
  
  export const formatTimeRemaining = (endTime: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) return 'Ended';
    
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

 export const getFilteredNFTs = (nfts: NFT[], priceRange: [number, number], sortBy: SortOption) => {
    return nfts
      .filter(nft => 
        nft.price >= priceRange[0] && 
        nft.price <= priceRange[1]
      )
      .sort((a, b) => {
        switch(sortBy) {
          case 'price_asc': return a.price - b.price;
          case 'price_desc': return b.price - a.price;
          case 'rarity': return b.rarity - a.rarity;
          default: return b.id - a.id;
        }
      });
  };