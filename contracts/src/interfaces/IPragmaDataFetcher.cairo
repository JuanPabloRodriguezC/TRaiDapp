// Pragma Oracle interface for price data
#[starknet::interface]
trait PragmaDataFetcher<TContractState> {
    fn get_asset_price(self: @TContractState, asset_id: felt252) -> u128;
    fn get_spot_median(self: @TContractState, pair_id: felt252) -> (u128, u128, u128);
    fn get_spot_median_twap(self: @TContractState, pair_id: felt252, time_amount: u64) -> (u128, u128, u128, u128);
    fn get_historical_price(self: @TContractState, pair_id: felt252, timestamp: u64) -> (u128, u128, u128);
}