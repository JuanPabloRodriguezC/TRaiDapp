use starknet::ContractAddress;

#[starknet::interface]
pub trait ITraidingModelsMetrics<TContractState> {
    fn get_asset_price(self: @TContractState, asset_id: felt252) -> u128;
    fn update_model_predictions(ref self: TContractState, model_id: u64, asset_id: felt252, prediction: u128) -> bool;
    fn get_model_error(ref self: TContractState, model_id: u64, asset_id: felt252) -> (u128, u128);
    fn get_model_roi(ref self: TContractState, model_id: u64, asset_id: felt252) -> (u128, bool);
    fn get_model_sharpe_ratio(ref self: TContractState, model_id: u64, asset_id: felt252) -> felt252;
    fn get_model_max_drawdown(ref self: TContractState, model_id: u64, asset_id: felt252) -> felt252;
    fn get_model_winning_ratio(ref self: TContractState, model_id: u64, asset_id: felt252) -> u8;
}

#[starknet::interface]
pub trait ITraidingModelsOrders<TContractState> {
    fn deposit(ref self: TContractState, asset_id: ContractAddress, amount: u256) -> bool;
    fn withdraw(ref self: TContractState, asset_id: ContractAddress, amount: u256) -> bool;
    fn authorize_model(ref self: TContractState, model_id: u64, user_address: ContractAddress) -> bool;
    fn deauthorize_model(ref self: TContractState, model_id: u64, user_address: ContractAddress) -> bool;
    fn is_authorized_model(ref self: TContractState, model_id: u64, user_address: ContractAddress) -> bool;
    fn get_user_balance(ref self: TContractState, user_address: ContractAddress) -> u128;
    fn calculate_model_fees(ref self: TContractState, model_id: u64, asset_id: ContractAddress) -> u128;
}