use starknet::ContractAddress;

#[starknet::interface]
pub trait ITraidingModelsMetrics<TContractState> {
    fn get_asset_price(self: @TContractState, asset_id: felt252) -> u128;
    fn update_model_predictions(ref self: TContractState, model_id: u64, prediction: u128) -> bool;
    fn get_bot_portfolio_value(self: @TContractState, model_id: u64) -> u128;
    fn get_model_error(self: @TContractState, model_id: u64) -> (u128, u128);
    fn get_model_roi(self: @TContractState, model_id: u64) -> (u128, bool);
    fn get_model_max_drawdown(self: @TContractState, model_id: u64) -> u128;
    fn get_model_winning_ratio(self: @TContractState, model_id: u64) -> u128;
}

#[starknet::interface]
pub trait ITraidingModelsOrders<TContractState> {
    fn deposit(ref self: TContractState, token_address: ContractAddress, model_id: u64, amount: u256) -> bool;
    fn withdraw(ref self: TContractState, token_address: ContractAddress, model_id: u64, amount: u256) -> bool;
    fn authorize_model(ref self: TContractState, model_id: u64, user_address: ContractAddress) -> bool;
    fn deauthorize_model(ref self: TContractState, model_id: u64, user_address: ContractAddress) -> bool;
    fn is_authorized_model(ref self: TContractState, model_id: u64, user_address: ContractAddress) -> bool;
    fn get_user_balance(self: @TContractState, model_id: u64, user_address: ContractAddress) -> u256;
    fn calculate_model_fees(ref self: TContractState, model_id: u64, asset_id: ContractAddress) -> u128;
    fn trigger_swap(ref self: TContractState, model_id: u64, asset_id: ContractAddress, amount: u256) -> bool;
}