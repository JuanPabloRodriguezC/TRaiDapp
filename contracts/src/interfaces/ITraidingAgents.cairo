use starknet::ContractAddress;
use crate::utils::types::{ UserConfig, UserBalance, UserSubscription, AgentPerformance };

#[starknet::interface]
pub trait IAgentManager<TContractState> {
    // Agent Management
    fn create_agent_config(
        ref self: TContractState,
        agent_id: felt252,
        name: felt252,
        strategy: felt252,
        max_automation_level: u8,
        max_trades_per_day: u32,
        max_api_cost_per_day: u256,
        max_risk_tolerance: u32,
        max_position_size: u256,
        min_stop_loss_threshold: u32
    );
    
    fn subscribe_to_agent(
        ref self: TContractState,
        agent_id: felt252,
        user_config: UserConfig
    );

    fn unsubscribe_from_agent(
        ref self: TContractState,
        agent_id: felt252
    );
    
    fn update_subscription(
        ref self: TContractState,
        agent_id: felt252,
        user_config: UserConfig
    );
    
    fn authorize_agent_trading(
        ref self: TContractState,
        agent_id: felt252,
        authorized: bool
    );
    
    // Balance Management - Now handles actual token transfers
    fn deposit_for_trading(
        ref self: TContractState,
        token_address: ContractAddress,
        amount: u256
    );
    
    fn withdraw_from_trading(
        ref self: TContractState,
        token_address: ContractAddress,
        amount: u256
    );
    
    // Agent-specific reservations
    fn reserve_for_agent_trade(
        ref self: TContractState,
        user: ContractAddress,
        agent_id: felt252,
        token_address: ContractAddress,
        amount: u256
    ) -> bool;
    
    fn release_agent_reservation(
        ref self: TContractState,
        user: ContractAddress,
        agent_id: felt252,
        token_address: ContractAddress,
        amount: u256
    );
    
    fn execute_trade_settlement(
        ref self: TContractState,
        user: ContractAddress,
        agent_id: felt252,
        from_token: ContractAddress,
        to_token: ContractAddress,
        from_amount: u256,
        to_amount: u256
    );
    
    // Decision Recording
    fn record_agent_decision(
        ref self: TContractState,
        agent_id: felt252,
        user: ContractAddress,
        token_address: ContractAddress,
        action: felt252,
        amount: u256,
        confidence: u32,
        reasoning_hash: felt252
    );
    
    fn mark_decision_executed(
        ref self: TContractState,
        decision_id: u32,
        success: bool,
        actual_amount: u256
    );

    fn authorize_decision_recorder(
        ref self: TContractState,
        recorder: ContractAddress,
        authorized: bool
    );
    
    // Performance Tracking
    fn update_agent_performance(
        ref self: TContractState,
        agent_id: felt252,
        pnl_change: i128,
        was_successful: bool,
        confidence: u32
    );
    
    // Query Functions
    fn get_user_subscription(
        self: @TContractState,
        user: ContractAddress,
        agent_id: felt252
    ) -> UserSubscription;
    
    fn get_user_balance(
        self: @TContractState,
        user: ContractAddress,
        token_address: ContractAddress
    ) -> UserBalance;
    
    fn get_agent_performance(
        self: @TContractState,
        agent_id: felt252
    ) -> AgentPerformance;
    
    fn can_agent_trade(
        self: @TContractState,
        user: ContractAddress,
        agent_id: felt252,
        token_address: ContractAddress,
        amount: u256
    ) -> bool;
    
    fn get_available_balance_for_agent(
        self: @TContractState,
        user: ContractAddress,
        agent_id: felt252,
        token_address: ContractAddress
    ) -> u256;
    
    fn get_daily_limits_remaining(
        self: @TContractState,
        user: ContractAddress,
        agent_id: felt252
    ) -> (u32, u256);

    fn settle_trade_with_fees(
            ref self: TContractState,
            user: ContractAddress,
            agent_id: felt252,
            profit_amount: u256,
            token_address: ContractAddress
    )-> ();

    fn withdraw_platform_fees(
        ref self: TContractState,
        token_address: ContractAddress,
        amount: u256
    ) -> ();
}