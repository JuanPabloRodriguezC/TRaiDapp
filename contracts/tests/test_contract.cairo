use starknet::ContractAddress;
use starknet::{ contract_address_const };
use snforge_std::{declare, DeclareResultTrait, ContractClassTrait};
use snforge_std::{
    start_cheat_caller_address_global, stop_cheat_caller_address_global,
    spy_events, EventSpyAssertionsTrait,
};
use contracts::interfaces::ITraidingAgents::{ IAgentManagerDispatcher, IAgentManagerDispatcherTrait };
use contracts::TraidingAgents::TraidingAgents;
use contracts::utils::types:: {UserConfig, UserBalance};
use contracts::utils::events;

// Test addresses
const ADMIN: felt252 = 0x1234567890abcdef;
const USER1: felt252 = 0x2222222222abcdef;
const USER2: felt252 = 0x3333333333abcdef;
const TOKEN_ETH: felt252 = 0x4444444444abcdef;
const TOKEN_USDC: felt252 = 0x5555555555abcdef;

fn setup(admin: ContractAddress) -> ContractAddress {
    let traid_contract = declare("TraidingAgents").unwrap().contract_class();
    let mut calldata = array![];
    Serde::serialize(@admin, ref calldata);
    let (traid_address, _) = traid_contract.deploy(@calldata).unwrap();
    traid_address
}

fn setup_token() -> ContractAddress {
    let token_contract = declare("MockIERC20").unwrap().contract_class();
    let (token_address, _) = token_contract.deploy(@array![]).unwrap();
    token_address
}

// Helper function to create a standard agent config
fn create_standard_agent(dispatcher: IAgentManagerDispatcher, agent_id: felt252) {
    dispatcher.create_agent_config(
        agent_id, 
        'Test Agent', 
        'conservative', 
        3,           // max_automation_level
        50,          // max_trades_per_day
        1000000000000000000_u256,  // max_api_cost_per_day (1 ETH)
        100,         // max_risk_tolerance
        10000000000000000000_u256, // max_position_size (10 ETH)
        100          // min_stop_loss_threshold (1%)
    );
}

// Helper function to create a standard user config within agent limits
fn get_standard_user_config() -> UserConfig {
    UserConfig {
        automation_level: 2,
        max_trades_per_day: 20,
        max_api_cost_per_day: 500000000000000000_u256, // 0.5 ETH
        risk_tolerance: 80,
        max_position_size: 5000000000000000000_u256,   // 5 ETH
        stop_loss_threshold: 200         // 2%
    }
}

// Helper function to subscribe user to agent
fn subscribe_user_to_agent(
    dispatcher: IAgentManagerDispatcher, 
    user: ContractAddress, 
    agent_id: felt252,
    user_config: UserConfig
) {
    start_cheat_caller_address_global(user);
    dispatcher.subscribe_to_agent(agent_id, user_config);
    stop_cheat_caller_address_global();
}

#[test]
fn test_valid_subscription_config(){
    let admin: ContractAddress = contract_address_const::<ADMIN>();
    let address: ContractAddress = setup(admin);  
    let dispatcher = IAgentManagerDispatcher { contract_address: address };

    // Admin creates agent
    start_cheat_caller_address_global(admin);  
    create_standard_agent(dispatcher, 1);
    stop_cheat_caller_address_global();

    // User subscribes
    let user_address = contract_address_const::<USER1>();
    let user_config = get_standard_user_config();
    
    start_cheat_caller_address_global(user_address);
    let mut spy = spy_events();
    dispatcher.subscribe_to_agent(1, user_config);

    spy.assert_emitted(
        @array![
            (
                address,
                TraidingAgents::Event::AgentSubscribed(
                    events::AgentSubscribed { 
                        user: user_address,
                        agent_id: 1,
                        automation_level: 2,
                    }
                ),
            ),
        ],
    );
    stop_cheat_caller_address_global();
}

#[test]
#[should_panic(expected: ('Exceeds agent trade limit',))]
fn test_subscription_exceeds_agent_limits(){
    let admin: ContractAddress = contract_address_const::<ADMIN>();
    let address: ContractAddress = setup(admin);  
    let dispatcher = IAgentManagerDispatcher { contract_address: address };

    // Admin creates agent with low limits
    start_cheat_caller_address_global(admin);  
    dispatcher.create_agent_config(1, 'Limited Agent', 'conservative', 1, 10, 100000, 50, 1000000, 500);
    stop_cheat_caller_address_global();

    // User tries to subscribe with higher limits than agent allows
    let user_address = contract_address_const::<USER1>();
    let invalid_config = UserConfig {
        automation_level: 1,
        max_trades_per_day: 20,  // Exceeds agent's 10
        max_api_cost_per_day: 50000,
        risk_tolerance: 30,
        max_position_size: 500000,
        stop_loss_threshold: 600
    };
    
    start_cheat_caller_address_global(user_address);
    dispatcher.subscribe_to_agent(1, invalid_config); // Should panic
    stop_cheat_caller_address_global();
}

#[test]
fn test_agent_authorization(){
    let admin: ContractAddress = contract_address_const::<ADMIN>();
    let address: ContractAddress = setup(admin);  
    let dispatcher = IAgentManagerDispatcher { contract_address: address };

    // Setup agent and user subscription
    start_cheat_caller_address_global(admin);
    create_standard_agent(dispatcher, 1);
    stop_cheat_caller_address_global();

    let user_address = contract_address_const::<USER1>();
    subscribe_user_to_agent(dispatcher, user_address, 1, get_standard_user_config());

    // Test authorization
    start_cheat_caller_address_global(user_address);
    let mut spy = spy_events();
    
    dispatcher.authorize_agent_trading(1, true);
    
    spy.assert_emitted(
        @array![
            (
                address,
                TraidingAgents::Event::AuthorizationChanged(
                    events::AuthorizationChanged { 
                        user: user_address,
                        agent_id: 1,
                        authorized: true,
                    }
                ),
            ),
        ],
    );

    // Verify authorization status
    let subscription = dispatcher.get_user_subscription(user_address, 1);
    assert!(subscription.is_authorized, "User should be authorized");
    
    stop_cheat_caller_address_global();
}

#[test]
fn test_deposit_and_balance_tracking(){
    let admin: ContractAddress = contract_address_const::<ADMIN>();
    let address: ContractAddress = setup(admin);  
    let dispatcher = IAgentManagerDispatcher { contract_address: address };
    
    let user_address = contract_address_const::<USER1>();
    let token_address = setup_token();
    let deposit_amount = 1000000000000000000_u256; // 1 ETH

    start_cheat_caller_address_global(user_address);
    let mut spy = spy_events();
    
    // Note: In a real test, you'd need to setup token approvals first
    dispatcher.deposit_for_trading(token_address, deposit_amount);
    
    spy.assert_emitted(
        @array![
            (
                address,
                TraidingAgents::Event::BalanceUpdated(
                    events::BalanceUpdated { 
                        user: user_address,
                        token_address: token_address,
                        new_total_balance: deposit_amount,
                        new_available_balance: deposit_amount,
                    }
                ),
            ),
        ],
    );

    // Verify balance
    let balance: UserBalance = dispatcher.get_user_balance(user_address, token_address);
    assert!(balance.total_balance == deposit_amount, "Total balance should match deposit");
    assert!(balance.available_balance == deposit_amount, "Available balance should match deposit");
    
    stop_cheat_caller_address_global();
}

#[test]
fn test_agent_reservation_system(){
    let admin: ContractAddress = contract_address_const::<ADMIN>();
    let address: ContractAddress = setup(admin);  
    let dispatcher = IAgentManagerDispatcher { contract_address: address };

    // Setup
    start_cheat_caller_address_global(admin);
    create_standard_agent(dispatcher, 1);
    stop_cheat_caller_address_global();

    let user_address = contract_address_const::<USER1>();
    let token_address = setup_token();
    let deposit_amount = 1000000000000000000_u256; // 1 ETH
    let reserve_amount = 500000000000000000_u256;  // 0.5 ETH

    subscribe_user_to_agent(dispatcher, user_address, 1, get_standard_user_config());

    start_cheat_caller_address_global(user_address);
    
    // Deposit tokens
    dispatcher.deposit_for_trading(token_address, deposit_amount);
    
    // Test reservation
    let mut spy = spy_events();
    let success = dispatcher.reserve_for_agent_trade(user_address, 1, token_address, reserve_amount);
    assert!(success, "Reservation should succeed");
    
    spy.assert_emitted(
        @array![
            (
                address,
                TraidingAgents::Event::ReservationMade(
                    events::ReservationMade { 
                        user: user_address,
                        agent_id: 1,
                        token_address: token_address,
                        amount: reserve_amount,
                    }
                ),
            ),
        ],
    );

    // Verify balance changes
    let balance = dispatcher.get_user_balance(user_address, token_address);
    assert!(balance.total_balance == deposit_amount, "Total balance should remain the same");
    assert!(balance.available_balance == deposit_amount - reserve_amount, "Available balance should be reduced");
    
    stop_cheat_caller_address_global();
}

#[test]
fn test_insufficient_balance_reservation(){
    let admin: ContractAddress = contract_address_const::<ADMIN>();
    let address: ContractAddress = setup(admin);  
    let dispatcher = IAgentManagerDispatcher { contract_address: address };

    // Setup
    start_cheat_caller_address_global(admin);
    create_standard_agent(dispatcher, 1);
    stop_cheat_caller_address_global();

    let user_address = contract_address_const::<USER1>();
    let token_address = setup_token();
    let deposit_amount = 500000000000000000_u256;  // 0.5 ETH
    let reserve_amount = 1000000000000000000_u256; // 1 ETH (more than available)

    subscribe_user_to_agent(dispatcher, user_address, 1, get_standard_user_config());

    start_cheat_caller_address_global(user_address);
    
    // Deposit tokens
    dispatcher.deposit_for_trading(token_address, deposit_amount);
    
    // Try to reserve more than available
    let success = dispatcher.reserve_for_agent_trade(user_address, 1, token_address, reserve_amount);
    assert!(!success, "Reservation should fail when insufficient balance");
    
    stop_cheat_caller_address_global();
}

#[test]
fn test_multi_agent_reservation_conflict(){
    let admin: ContractAddress = contract_address_const::<ADMIN>();
    let address: ContractAddress = setup(admin);  
    let dispatcher = IAgentManagerDispatcher { contract_address: address };

    // Setup two agents
    start_cheat_caller_address_global(admin);
    create_standard_agent(dispatcher, 1);
    create_standard_agent(dispatcher, 2);
    stop_cheat_caller_address_global();

    let user_address = contract_address_const::<USER1>();
    let token_address = setup_token();
    let deposit_amount = 1000000000000000000_u256; // 1 ETH
    let reserve_amount = 600000000000000000_u256;  // 0.6 ETH each

    // Subscribe to both agents
    subscribe_user_to_agent(dispatcher, user_address, 1, get_standard_user_config());
    subscribe_user_to_agent(dispatcher, user_address, 2, get_standard_user_config());

    start_cheat_caller_address_global(user_address);
    
    // Deposit tokens
    dispatcher.deposit_for_trading(token_address, deposit_amount);
    
    // Agent 1 reserves successfully
    let success1 = dispatcher.reserve_for_agent_trade(user_address, 1, token_address, reserve_amount);
    assert!(success1, "First reservation should succeed");
    
    // Agent 2 should fail to reserve (only 0.4 ETH remaining)
    let success2 = dispatcher.reserve_for_agent_trade(user_address, 2, token_address, reserve_amount);
    assert!(!success2, "Second reservation should fail due to insufficient available balance");
    
    stop_cheat_caller_address_global();
}

#[test]
fn test_can_agent_trade_validation(){
    let admin: ContractAddress = contract_address_const::<ADMIN>();
    let address: ContractAddress = setup(admin);  
    let dispatcher = IAgentManagerDispatcher { contract_address: address };

    // Setup
    start_cheat_caller_address_global(admin);
    create_standard_agent(dispatcher, 1);
    stop_cheat_caller_address_global();

    let user_address = contract_address_const::<USER1>();
    let token_address = setup_token();
    let deposit_amount = 1000000000000000000_u256; // 1 ETH
    let trade_amount = 500000000000000000_u256;    // 0.5 ETH

    subscribe_user_to_agent(dispatcher, user_address, 1, get_standard_user_config());

    start_cheat_caller_address_global(user_address);
    dispatcher.deposit_for_trading(token_address, deposit_amount);
    
    // Should fail - not authorized yet
    let can_trade = dispatcher.can_agent_trade(user_address, 1, token_address, trade_amount);
    assert!(!can_trade, "Should not be able to trade without authorization");
    
    // Authorize agent
    dispatcher.authorize_agent_trading(1, true); 
    
    // Should succeed now
    let can_trade = dispatcher.can_agent_trade(user_address, 1, token_address, trade_amount);
    assert!(can_trade, "Should be able to trade after authorization");
    
    stop_cheat_caller_address_global();
}

#[test]
fn test_trade_settlement_flow(){
    let admin: ContractAddress = contract_address_const::<ADMIN>();
    let address: ContractAddress = setup(admin);  
    let dispatcher = IAgentManagerDispatcher { contract_address: address };

    // Setup
    start_cheat_caller_address_global(admin);
    create_standard_agent(dispatcher, 1);
    dispatcher.authorize_decision_recorder(contract_address_const::<USER2>(), true);
    stop_cheat_caller_address_global();

    let user_address = contract_address_const::<USER1>();
    let eth_address = setup_token();
    let usdc_address = setup_token();
    let eth_amount = 1000000000000000000_u256; // 1 ETH
    let trade_amount = 500000000000000000_u256; // 0.5 ETH
    let usdc_received = 1000000000_u256; // 1000 USDC (assuming 6 decimals)

    subscribe_user_to_agent(dispatcher, user_address, 1, get_standard_user_config());

    start_cheat_caller_address_global(user_address);
    
    // Setup initial balances
    dispatcher.deposit_for_trading(eth_address, eth_amount);
    dispatcher.authorize_agent_trading(1, true);
    stop_cheat_caller_address_global();


    start_cheat_caller_address_global(contract_address_const::<USER2>());
    // Reserve for trade
    dispatcher.reserve_for_agent_trade(user_address, 1, eth_address, trade_amount);
    
    // Simulate trade settlement
    let mut spy = spy_events();
    dispatcher.execute_trade_settlement(
        user_address, 
        1, 
        eth_address, 
        usdc_address, 
        trade_amount, 
        usdc_received
    );
    
    spy.assert_emitted(
        @array![
            (
                address,
                TraidingAgents::Event::TradeSettled(
                    events::TradeSettled { 
                        user: user_address,
                        agent_id: 1,
                        from_token: eth_address,
                        to_token: usdc_address,
                        from_amount: trade_amount,
                        to_amount: usdc_received,
                    }
                ),
            ),
        ],
    );

    // Verify final balances
    let eth_balance = dispatcher.get_user_balance(user_address, eth_address);
    let usdc_balance = dispatcher.get_user_balance(user_address, usdc_address);
    
    assert!(eth_balance.total_balance == eth_amount - trade_amount, "ETH balance should be reduced");
    assert!(usdc_balance.total_balance == usdc_received, "Should have received USDC");
    assert!(usdc_balance.available_balance == usdc_received, "USDC should be available");
    
    stop_cheat_caller_address_global();
}

#[test]
fn test_decision_recording(){
    let admin: ContractAddress = contract_address_const::<ADMIN>();
    let address: ContractAddress = setup(admin);  
    let dispatcher = IAgentManagerDispatcher { contract_address: address };

    // Setup
    start_cheat_caller_address_global(admin);
    create_standard_agent(dispatcher, 1);
    dispatcher.authorize_decision_recorder(contract_address_const::<USER2>(), true);
    stop_cheat_caller_address_global();

    let user_address = contract_address_const::<USER1>();
    let token_address = setup_token();
    let decision_amount = 500000000000000000_u256; // 0.5 ETH

    subscribe_user_to_agent(dispatcher, user_address, 1, get_standard_user_config());

    start_cheat_caller_address_global(contract_address_const::<USER2>());
    
    // Record agent decision
    let mut spy = spy_events();
    dispatcher.record_agent_decision(
        1,                    // agent_id
        user_address,         // user
        token_address,        // token_address
        'BUY',               // action
        decision_amount,      // amount
        85,                  // confidence (85%)
        12345678             // reasoning_hash
    );
    
    spy.assert_emitted(
        @array![
            (
                address,
                TraidingAgents::Event::AgentDecision(
                    events::AgentDecision { 
                        decision_id: 1,
                        agent_id: 1,
                        user: user_address,
                        action: 'BUY',
                        amount: decision_amount,
                        confidence: 85,
                    }
                ),
            ),
        ],
    );
    
    stop_cheat_caller_address_global();
}

#[test]
#[should_panic(expected: ('Insufficient available balance',))]
fn test_withdraw_insufficient_balance(){
    let admin: ContractAddress = contract_address_const::<ADMIN>();
    let address: ContractAddress = setup(admin);  
    let dispatcher = IAgentManagerDispatcher { contract_address: address };

    let user_address = contract_address_const::<USER1>();
    let token_address = setup_token();
    let deposit_amount = 500000000000000000_u256;  // 0.5 ETH
    let withdraw_amount = 1000000000000000000_u256; // 1 ETH (more than available)

    start_cheat_caller_address_global(user_address);
    
    // Deposit some tokens
    dispatcher.deposit_for_trading(token_address, deposit_amount);
    
    // Try to withdraw more than available
    dispatcher.withdraw_from_trading(token_address, withdraw_amount); // Should panic
    
    stop_cheat_caller_address_global();
}