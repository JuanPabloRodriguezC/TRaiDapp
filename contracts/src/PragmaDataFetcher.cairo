
#[starknet::contract]
pub mod PragmaDataFetcher {
    use starknet::{
        storage::{StoragePointerReadAccess, StoragePointerWriteAccess},
        ContractAddress
    };
    
    use pragma_lib::abi::{IPragmaABIDispatcher, IPragmaABIDispatcherTrait};
    use pragma_lib::types::{DataType, PragmaPricesResponse};
    use crate::interfaces::IPragmaDataFetcher::{IPragmaDataFetcher};
    
    
    const ETH_USD: felt252 = 19514442401534788;  //ETH/USD to felt252, can be used as asset_id
    const BTC_USD: felt252 = 18669995996566340;  //BTC/USD
    
    #[storage]
    struct Storage {
        pragma_contract: ContractAddress,
    }
    // Events
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PriceReceived: PriceReceived,
        HistoricalPriceReceived: HistoricalPriceReceived
    }
    
    #[derive(Drop, starknet::Event)]
    struct PriceReceived {
        pair_id: felt252, 
        price: u128
    }
    
    #[derive(Drop, starknet::Event)]
    struct HistoricalPriceReceived {
        pair_id: felt252, 
        price: u128,
        decimals: u128,
        timestamp: u128
    }
    

    #[constructor]
    fn constructor(ref self: ContractState, pragma_oracle_address: ContractAddress) {
        self.pragma_contract.write(pragma_oracle_address);
    }

    #[abi(embed_v0)]
    impl PragmaDataFetcher of IPragmaDataFetcher<ContractState> {
        // Get current price for a token pair
        fn get_asset_price(self: @ContractState, asset_id: felt252) -> u128 {
            // Retrieve the oracle dispatcher
            let oracle_dispatcher = IPragmaABIDispatcher {
                contract_address: self.pragma_contract.read(),
            };

            // Call the Oracle contract, for a spot entry
            let output: PragmaPricesResponse = oracle_dispatcher
                .get_data_median(DataType::SpotEntry(asset_id));

            return output.price;
        }

    }
}

