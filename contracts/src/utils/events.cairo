use starknet::ContractAddress;

#[derive(Drop, starknet::Event)]
pub struct AgentSubscribed {
    pub user: ContractAddress,
    pub agent_id: felt252,
    pub automation_level: u8,
}

#[derive(Drop, starknet::Event)]
pub struct AgentDecision {
    pub decision_id: u32,
    pub agent_id: felt252,
    pub user: ContractAddress,
    pub action: felt252,
    pub amount: u256,
    pub confidence: u32,
}

#[derive(Drop, starknet::Event)]
pub struct TradeExecuted {
    pub decision_id: u32,
    pub user: ContractAddress,
    pub success: bool,
    pub actual_amount: u256,
}

#[derive(Drop, starknet::Event)]
pub struct BalanceUpdated {
    pub user: ContractAddress,
    pub token_address: ContractAddress,
    pub new_total_balance: u256,
    pub new_available_balance: u256,
}

#[derive(Drop, starknet::Event)]
pub struct AuthorizationChanged {
    pub user: ContractAddress,
    pub agent_id: felt252,
    pub authorized: bool,
}

#[derive(Drop, starknet::Event)]
pub struct ReservationMade {
    pub user: ContractAddress,
    pub agent_id: felt252,
    pub token_address: ContractAddress,
    pub amount: u256,
}

#[derive(Drop, starknet::Event)]
pub struct ReservationReleased {
    pub user: ContractAddress,
    pub agent_id: felt252,
    pub token_address: ContractAddress,
    pub amount: u256,
}

#[derive(Drop, starknet::Event)]
pub struct TradeSettled {
    pub user: ContractAddress,
    pub agent_id: felt252,
    pub from_token: ContractAddress,
    pub to_token: ContractAddress,
    pub from_amount: u256,
    pub to_amount: u256,
}