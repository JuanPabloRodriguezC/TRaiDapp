// Pragma Oracle interface for price data
#[starknet::interface]
pub trait IPragmaDataFetcher<TContractState> {
    fn get_asset_price(self: @TContractState, asset_id: felt252) -> u128;
}