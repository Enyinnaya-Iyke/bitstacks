import type { NFTCollection, NFTResponse } from "@/types/nft";
import CreateCommunityForm from "./_components/create-community-form";
import { ipfsToHttp } from "@/lib/utils/text";
import { GAMMA_API_URL } from "@/lib/constants";

const getOwnedNFTS = async (
    stxAddress: string,
): Promise<NFTResponse | null> => {
    try {
        const url = `${GAMMA_API_URL}holdings/joint?stxAddresses=${stxAddress}`;
        const res = await fetch(url);

        if (!res.ok) {
            console.error(
                `Failed to fetch NFTs: ${res.status} ${res.statusText}`,
            );
            return null;
        }

        const data = (await res.json()) as NFTResponse;
        return data;
    } catch (err) {
        console.error("Error fetching NFTs:", err);
        return null;
    }
};

const groupCollections = (data: NFTResponse | null): NFTCollection[] => {
    if (!data) return [];

    return data.items
        .map((item) => ({
            id: item.collection_contract_id,
            name: item.nft_collection_metadata?.name || null,
            image: ipfsToHttp(item.nft_token_metadata?.image_url || null),
        }))
        .filter(
            (v, i, a) => a.findIndex((t) => t.id === v.id) === i, // dedupe by id
        );
};

export default async function CreateCommunityPage() {
    // Change to linked address later
    const address = "SP25RK61425QBXW105M85SY22WJ46T6T6G5D1XJ9";
    const ownedNFTs = await getOwnedNFTS(address);
    const collections = groupCollections(ownedNFTs);

    // collections now contains an array of unique collections
    return <CreateCommunityForm collections={collections} />;
}
