import { AptosClient, Types } from "aptos";

export const initializeMarketplace = async (
    client: AptosClient,
    account: Types.Address,
    signAndSubmitTransaction: any
) => {
    const transaction = {
        type: "entry_function_payload",
        function: `${account}::NFTMarketplace::initialize`,
        type_arguments: [],
        arguments: []
    };

    const response = await signAndSubmitTransaction(transaction);
    await client.waitForTransaction(response.hash);
    return response.hash;
};
