#[starknet::contract]
pub mod MockPragma {
    use pragma_lib::types::{DataType, PragmaPricesResponse};
    use crate::interfaces::IMockPragma::IMockPragma;
    #[storage]
    struct Storage {
        // Storage might be used to set return values dynamically in more complex mocks
    }

    #[abi(embed_v0)]
    impl MockPragmaImpl of IMockPragma<ContractState> {
        // Implement the function called by your contract
        fn get_data_median(self: @ContractState, data_type: DataType) -> PragmaPricesResponse {
            // Return a fixed, known price for testing
            // Using an example price like 1900 USD for ETH with 8 decimals
            PragmaPricesResponse {
                price: 1900_00000000_u128,
                decimals: 8,
                last_updated_timestamp: 1678886400, // Example timestamp
                num_sources_aggregated: 5, // Example number
                expiration_timestamp: Option::None, // Example expiration
            }
        }
    }
}