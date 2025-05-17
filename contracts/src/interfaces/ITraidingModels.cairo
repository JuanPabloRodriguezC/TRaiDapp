use starknet::ContractAddress;

#[starknet::interface]
pub trait ITraidingModelsMetrics<TContractState> {
    fn add_model(ref self: TContractState, model_name:felt252, token_1: ContractAddress, token_2: ContractAddress) -> u64;
    fn update_model_predictions(ref self: TContractState, model_id: u64, prediction: u128) -> ();
    fn get_bot_portfolio_value(self: @TContractState, model_id: u64) -> u128;
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
    
    fn deposit(ref self: TContractState, token_address: ContractAddress, model_id: u64, amount: u256, threshold_percentage: u128, expiration_days: u64) -> bool;
    fn withdraw(ref self: TContractState, token_address: ContractAddress, model_id: u64, amount: u256, expiration_days: u64) -> bool;
    fn update_trading_parameters(ref self: TContractState, model_id: u64, threshold_percentage: u128, expiration_days: u64) -> ();
    fn get_user_balance(self: @TContractState, model_id: u64, user_address: ContractAddress) -> u256;
    fn authorize_user(ref self: TContractState, model_id: u64, user_address: ContractAddress) -> ();
    fn deauthorize_user(ref self: TContractState, model_id: u64, user_address: ContractAddress) -> ();
    fn find_user_index(self: @TContractState, model_id: u64, user_address: ContractAddress) -> u32;
    fn process_users_recursively(ref self: TContractState, model_id: u64, current_index: u32, user_count: u32,current_price: u128, predicted_price: u128, token_address: ContractAddress) -> ();

    fn execute_batch_trades(ref self: TContractState, model_id: u64, predicted_price: u128) -> ();
    fn execute_user_trade(ref self: TContractState, model_id: u64, user_address: ContractAddress, token_address: ContractAddress, amount: u256) -> ();
    fn process_expirations_recursively(ref self: TContractState, model_id: u64) -> ();
    fn withdraw_expired(ref self: TContractState, model_id: u64, token_address: ContractAddress) -> ();
}