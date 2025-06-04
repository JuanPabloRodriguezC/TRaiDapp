use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store)]
pub struct AgentConfig {
    pub name: felt252,
    pub strategy: felt252, // 'conservative', 'aggressive', 'swing', 'scalping'
    pub max_automation_level: u8, // 0=manual, 1=alert_only, 2=semi_auto, 3=full_auto
    pub max_trades_per_day: u32,
    pub max_api_cost_per_day: u256, // in wei
    pub max_risk_tolerance: u32, // 0-100
    pub max_position_size: u256, // in wei
    pub min_stop_loss_threshold: u32, // percentage * 100 (e.g., 500 = 5%)
    pub is_active: bool,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct UserConfig {
    pub automation_level: u8,
    pub max_trades_per_day: u32,
    pub max_api_cost_per_day: u256, // User's daily API cost limit 
    pub risk_tolerance: u32, // User's risk tolerance (0-100)
    pub max_position_size: u256, // User's max position size (≤ agent's limit)
    pub stop_loss_threshold: u32, // User's stop loss preference
}

#[derive(Drop, Serde, starknet::Store)]
pub struct UserSubscription {
    pub agent_id: felt252,
    pub user: ContractAddress,
    pub user_config: UserConfig,
    pub daily_api_cost: u256,
    pub daily_trades: u32,
    pub last_reset_day: u64,
    pub subscribed_at: u64,
    pub is_authorized: bool, // User authorization for agent to trade
}



#[derive(Drop, Serde, starknet::Store)]
pub struct TradeDecision {
    pub agent_id: felt252,
    pub user: ContractAddress,
    pub token_address: ContractAddress,
    pub action: felt252, // 'BUY', 'SELL', 'HOLD'
    pub amount: u256,
    pub confidence: u32, // 0-100
    pub reasoning_hash: felt252, // Hash of reasoning text (stored off-chain)
    pub timestamp: u64,
    pub executed: bool,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct AgentPerformance {
    pub agent_id: felt252,
    pub total_decisions: u32,
    pub successful_trades: u32,
    pub total_pnl: i128, // Can be negative
    pub avg_confidence: u32,
    pub last_updated: u64,
}

#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct UserBalance {
    pub user: ContractAddress,
    pub token_address: ContractAddress,
    pub total_balance: u256, // Total tokens in the contract for this user
    pub available_balance: u256, // Available for new trades (total - reserved)
    pub last_updated: u64,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct AgentReservation {
    pub user: ContractAddress,
    pub agent_id: felt252,
    pub token_address: ContractAddress,
    pub reserved_amount: u256,
    pub created_at: u64,
}