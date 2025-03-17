// Pragma Oracle interface for price data
#[starknet::interface]
pub trait IPragmaDataFetcher<TContractState> {
    fn get_current_median(self: @TContractState) -> u128;
}