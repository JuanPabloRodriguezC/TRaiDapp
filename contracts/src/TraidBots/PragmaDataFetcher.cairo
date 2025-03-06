// This example demonstrates how to fetch token pair price data from Pragma Oracle in StarkNet
// SPDX-License-Identifier: MIT

#[starknet::contract]
mod PragmaDataFetcher {
    use starknet::{ContractAddress, get_caller_address, call_contract_syscall, get_block_timestamp};
    use array::{ArrayTrait, SpanTrait};
    use traits::{Into, TryInto};
    use option::OptionTrait;
    use core::result::ResultTrait;
    use pragma_lib::abi::{
            IPragmaABIDispatcher, IPragmaABIDispatcherTrait,
            ISummaryStatsABIDispatcher,ISummaryStatsABIDispatcherTrait};
    use pragma_lib::types::{DataType, AggregationMode, PragmaPricesResponse};
    use crate::interfaces::IPragmaDataFetcher::{IPragmaDataFetcher}
    
    const ETH_USD: felt252 = 19514442401534788;  //ETH/USD to felt252, can be used as asset_id
    const BTC_USD: felt252 = 18669995996566340;  //BTC/USD
    
    #[storage]
    struct Storage {
        pragma_oracle_address: ContractAddress,
        summary_stats: ContractAddress,
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
        price: u128,
        decimals: u128,
        timestamp: u128
    }
    
    #[derive(Drop, starknet::Event)]
    struct HistoricalPriceReceived {
        pair_id: felt252, 
        price: u128,
        decimals: u128,
        timestamp: u128
    }

    #[constructor]
    fn constructor(ref self: ContractState, pragma_oracle_address: ContractAddress, summary_stats_address : ContractAddress) {
        self.pragma_oracle_address.write(pragma_oracle_address);
        self.summary_stats.write(summary_stats_address);
    }

    #[external(v0)]
    impl PragmaDataFetcherImpl of IPragmaDataFetcher<ContractState> {
        // Get current price for a token pair
        fn get_current_price(self: @ContractState, pair_id: felt252) -> (u128, u128, u128) {
            let oracle_address = self.pragma_oracle_address.read();
            let oracle_dispatcher = IPragmaOracleDispatcher { contract_address: oracle_address };
            
            // Get median spot price
            let (price, decimals, last_updated_timestamp) = oracle_dispatcher.get_spot_median(pair_id);
            
            // Emit event with price data
            self.emit(Event::PriceReceived(PriceReceived {
                pair_id: pair_id, 
                price: price,
                decimals: decimals,
                timestamp: last_updated_timestamp
            }));
            
            (price, decimals, last_updated_timestamp)
        }
        
        // Get time-weighted average price for a token pair
        fn get_twap_price(self: @ContractState, pair_id: felt252, time_period: u64) -> (u128, u128, u128, u128) {
            let oracle_address = self.pragma_oracle_address.read();
            let oracle_dispatcher = IPragmaOracleDispatcher { contract_address: oracle_address };
            
            // Get time-weighted average price
            oracle_dispatcher.get_spot_median_twap(pair_id, time_period)
        }
        
        // Get historical price for a specific timestamp
        fn get_historical_price(self: @ContractState, pair_id: felt252, timestamp: u64) -> (u128, u128, u128) {
            let oracle_address = self.pragma_oracle_address.read();
            let oracle_dispatcher = IPragmaOracleDispatcher { contract_address: oracle_address };
            
            // Get historical price data
            let (price, decimals, actual_timestamp) = oracle_dispatcher.get_historical_price(pair_id, timestamp);
            
            // Emit event with historical price data
            self.emit(Event::HistoricalPriceReceived(HistoricalPriceReceived {
                pair_id: pair_id, 
                price: price,
                decimals: decimals,
                timestamp: actual_timestamp
            }));
            
            (price, decimals, actual_timestamp)
        }
        
        // Helper function to interpret pair_id
        // Common pair_ids in Pragma:
        // ETH/USD: "ETH/USD"
        // BTC/USD: "BTC/USD"
        fn get_pair_id_examples(self: @ContractState) -> Array<felt252> {
            let mut pairs = ArrayTrait::new();
            pairs.append('ETH/USD'); // Ethereum/USD pair
            pairs.append('BTC/USD'); // Bitcoin/USD pair
            pairs.append('WBTC/USD'); // Wrapped Bitcoin/USD pair
            pairs.append('USDC/USD'); // USDC/USD pair
            pairs
        }
    }
}
