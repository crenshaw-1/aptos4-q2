export const APTOS_NODE_URL = "https://fullnode.devnet.aptoslabs.com/v1";
export const MARKETPLACE_ADDRESS = "0x2173a45c40df5848c9926c7278f134798c583cad9e1e9978f9a890ce5cbc70a7";
export const PAGE_SIZE = 8;
export const OCTAS = 100000000;

export const RARITY_COLORS: { [key: number]: string } = {
  1: "green",
  2: "blue",
  3: "purple",
  4: "orange",
};

export const RARITY_LABELS: { [key: number]: string } = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Super Rare",
};

export const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rarity', label: 'Rarity' }
];
