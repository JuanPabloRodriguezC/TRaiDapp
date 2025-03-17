
#[starknet::contract]
pub mod PragmaDataFetcher {
    use starknet::{
        event::EventEmitter,
        storage::{StoragePointerReadAccess, StoragePointerWriteAccess},
        ContractAddress
    };
    use pragma_lib::abi::{IPragmaABIDispatcher, IPragmaABIDispatcherTrait};
    use pragma_lib::types::{DataType, AggregationMode, PragmaPricesResponse};
    use crate::interfaces::IPragmaDataFetcher::{IPragmaDataFetcher};
    
    
    const ETH_USD: felt252 = 19514442401534788;  //ETH/USD to felt252, can be used as asset_id
    const BTC_USD: felt252 = 18669995996566340;  //BTC/USD
    
    #[storage]
    struct Storage {
        pragma_oracle_address: ContractAddress,
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
        self.pragma_oracle_address.write(pragma_oracle_address);
    }

    #[abi(embed_v0)]
    impl PragmaDataFetcher of IPragmaDataFetcher<ContractState> {
        // Get current price for a token pair
        fn get_current_median(self: @ContractState) -> u128 {
            let oracle_dispatcher = IPragmaABIDispatcher{contract_address : self.pragma_oracle_address.read()};
            let output : PragmaPricesResponse= oracle_dispatcher.get_data_median(DataType::SpotEntry('ETH/USD'));
            return output.price;
        }
    }
}
