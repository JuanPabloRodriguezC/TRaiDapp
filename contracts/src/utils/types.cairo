#[derive(Drop, Serde, starknet::Store)]
pub struct Metrics{
    pub prediction: u128,
    pub error: ErrorMetrics,
    pub roi: felt252,
    pub sharpe_ratio: felt252,
    pub max_drawdown: felt252,
    pub winning_ratio: u8,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct ErrorMetrics{
    pub mae: u128,
    pub mse: u128,
    pub prediction_count: u64,
    pub precision: u128,
}