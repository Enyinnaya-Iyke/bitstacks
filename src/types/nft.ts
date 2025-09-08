// Type Extracted From Gamma API
export interface NFTTokenMetadata {
  fully_qualified_token_id: string;
  image_url?: string | null;
  image_type?: string | null;
  image_protocol?: string | null;
  asset_url?: string | null;
  asset_type?: string | null;
  asset_protocol?: string | null;
  asset_id: string;
  name: string;
  contract_id: string;
  description?: string | null;
}

export interface NFTCollectionMetadata {
  contract_id: string;
  collection_level: number;
  name: string;
}

export interface NFTItem {
  chain: string;
  listed: boolean;
  fully_qualified_token_id: string;
  collection_contract_id: string;
  token_id: number;
  asset_id: string;
  address: string;
  nft_token_metadata?: NFTTokenMetadata | null;
  nft_collection_metadata?: NFTCollectionMetadata | null;
}

export interface NFTResponse {
  counts: {
    all: number;
    eth: number;
    stx: number;
    listed: number;
    unlisted: number;
  };
  items: NFTItem[];
}

export interface NFTCollection {
  id: string;
  name: string | null;
  image: string | null;
}
