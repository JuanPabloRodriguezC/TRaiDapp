#[derive(Drop, Serde, starknet::Store)]
pub struct Metrics{
    pub prediction: u128,
    pub portfolio_value: u128,
    pub error: ErrorMetrics,
    pub roi: ROIMetrics,
    pub sharpe_ratio: felt252,
    pub max_drawdown: DrawdownMetrics,
    pub winning_ratio: WinningRatioMetrics,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct ErrorMetrics{
    pub mae: u128,
    pub mse: u128,
    pub prediction_count: u64,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct ROIMetrics{
    pub value: u128,
    pub initial: u128,
    pub is_negative: bool,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct DrawdownMetrics{
    pub historical_peak: u128,       // Highest portfolio value seen so far
    pub current_value: u128,         // Current portfolio value
    pub max_drawdown: u128,            
}

#[derive(Drop, Serde, starknet::Store)]
pub struct WinningRatioMetrics{
    pub wins: u128,
    pub losses: u128,
    pub ratio: u128,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct TradingParameters{
    pub threshold_percentage: u128,
    pub expiration_timestamp: u64,
    pub max_slippage: u128,
}