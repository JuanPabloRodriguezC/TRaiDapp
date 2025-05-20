use starknet::ContractAddress;

#[derive(Drop, starknet::Event)]
pub struct BotAuthorized {
    pub model_id: u64,
    pub user_address: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct FundsDeposited {
    pub model_id: u64,
    pub user_address: ContractAddress,
    pub amount: u256,
}

#[derive(Drop, starknet::Event)]
pub struct FundsWithdrawn {
    pub model_id: u64,
    pub user_address: ContractAddress,
    pub amount: u256,
}

#[derive(Drop, starknet::Event)]
pub struct ExpiredFundsWithdrawn {
    pub model_id: u64,
    pub user_address: ContractAddress,
    pub amount: u256,
    pub expiration_timestamp: u64,
}

#[derive(Drop, starknet::Event)]
pub struct ModelUpdated {
    pub model_id: u64,
    pub prediction: u128,
}

#[derive(Drop, starknet::Event)]
pub struct ModelMetricsUpdated {
    pub model_id: u64,
    pub error: u256,
    pub roi: u256,
    pub sharpe_ratio: felt252,
    pub max_drawdown: u256,
    pub winning_ratio: u8,
}

#[derive(Drop, starknet::Event)]
pub struct TradingParametersSet{
    pub model_id: u64,
    pub user: ContractAddress,
    pub threshold_percentage: u128,
    pub expiration_timestamp: u64,
}

#[derive(Drop, starknet::Event)]
pub struct TradeExecuted {
    pub model_id: u64,
    pub user: ContractAddress,
    pub token_in: ContractAddress,
    pub token_out: ContractAddress,
    pub amount_in: u256,
}