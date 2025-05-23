use starknet::ContractAddress;
use crate::utils::types::{TokenBalance};

#[starknet::interface]
pub trait ITraidingModelsMetrics<TContractState> {
    fn add_model(ref self: TContractState, model_name:felt252, token_1: ContractAddress, token_2: ContractAddress, owner: ContractAddress) -> u64;
    fn remove_model(ref self: TContractState, model_id: u64) -> ();
    fn update_model_predictions(ref self: TContractState, model_id: u64, prediction: u128) -> ();
    fn get_user_portfolio(self: @TContractState, user_address: ContractAddress) -> Array<TokenBalance>;
    fn get_model_error(self: @TContractState, model_id: u64) -> (u128, u128);
    fn get_model_roi(self: @TContractState, model_id: u64) -> (u128, bool);
    fn get_model_max_drawdown(self: @TContractState, model_id: u64) -> u128;
    fn get_model_winning_ratio(self: @TContractState, model_id: u64) -> u128;
    fn calculate_model_fees(ref self: TContractState, model_id: u64, asset_id: ContractAddress) -> u128;
}

#[starknet::interface]
pub trait ITraidingModelsOrders<TContractState> {
    fn get_asset_price(self: @TContractState, asset_id: felt252) -> u128;
    fn only_admin(self: @TContractState) -> ();
    
    fn deposit(ref self: TContractState, token_address: ContractAddress, model_id: u64, amount: u256, threshold_percentage: u128, expiration: u64, max_slippage: u128) -> bool;
    fn withdraw(ref self: TContractState, token_address: ContractAddress, model_id: u64, amount: u256) -> bool;
    fn update_trading_parameters(ref self: TContractState, model_id: u64, threshold_percentage: u128, expiration: u64, max_slippage: u128) -> ();
    fn get_user_balance(self: @TContractState, model_id: u64, user_address: ContractAddress, token_address:ContractAddress) -> u256;
    fn authorize_user(ref self: TContractState, model_id: u64, user_address: ContractAddress) -> ();
    fn deauthorize_user(ref self: TContractState, model_id: u64, user_address: ContractAddress) -> ();
    fn find_user_index(self: @TContractState, model_id: u64, user_address: ContractAddress) -> u32;
    
    fn check_user_trade_condition(ref self: TContractState, model_id: u64, user_address: ContractAddress, predicted_price: u128) -> ();
    fn execute_user_trade(ref self: TContractState, model_id: u64, user_address: ContractAddress, source_token: ContractAddress, target_token: ContractAddress, amount: u256, min_amount_out: u256) -> ();
    fn calculate_expected_output(self: @TContractState, model_id: u64, amount_in: u256, source_token: ContractAddress, target_token: ContractAddress, current_price: u128) -> u256;
    fn withdraw_expired(ref self: TContractState, model_id: u64, user_address: ContractAddress, timestamp: u64) -> ();
}