#[derive(Drop, Serde, starknet::Store)]
pub struct Metrics{
    pub prediction: felt252,
    pub error: felt252,
    pub roi: felt252,
    pub sharpe_ratio: felt252,
    pub max_drawdown: felt252,
    pub winning_ratio: u8,
}