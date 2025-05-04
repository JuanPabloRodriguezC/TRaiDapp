use starknet::ContractAddress;

#[event]
#[derive(Drop, starknet::Event)]
pub enum Event {
    TradeExecuted: TradeExecuted,
    BotAuthorized: BotAuthorized,
    FundsDeposited: FundsDeposited,
    FundsWithdrawn: FundsWithdrawn,
    ModelUpdated: ModelUpdated,
    ModelMetricsUpdated: ModelMetricsUpdated,
}

#[derive(Drop, starknet::Event)]
pub struct TradeExecuted {
    pub model_id: u64,
    pub asset_id: felt252,
    pub prediction: felt252,
    pub error: felt252,
    pub roi: felt252,
    pub sharpe_ratio: felt252,
    pub max_drawdown: felt252,
    pub winning_ratio: u8,
}

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
pub struct ModelUpdated {
    pub model_id: u64,
    pub prediction: u256,
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