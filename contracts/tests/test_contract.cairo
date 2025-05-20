use starknet::ContractAddress;
use starknet::{ contract_address_const };
use snforge_std::{declare, DeclareResultTrait, ContractClassTrait};
use snforge_std::{
    start_cheat_caller_address_global, stop_cheat_caller_address_global,
    spy_events, EventSpyAssertionsTrait,
};
use contracts::interfaces::ITraidingModels::{ITraidingModelsMetricsDispatcher, ITraidingModelsMetricsDispatcherTrait};
use contracts::interfaces::ITraidingModels::{ITraidingModelsOrdersDispatcher, ITraidingModelsOrdersDispatcherTrait};
use contracts::TraidingModels::TraidingModels;
use contracts::utils::events;


fn setup() -> ContractAddress {
    let mock_pragma_contract = declare("MockPragma").unwrap().contract_class();
    let (mock_pragma_address, _) = mock_pragma_contract.deploy(@array![]).unwrap();

    let mock_jedi_contract = declare("MockJedi").unwrap().contract_class();
    let (mock_jedi_address, _) = mock_jedi_contract.deploy(@array![]).unwrap();

    let traid_contract = declare("TraidingModels").unwrap().contract_class();
    let mut calldata = array![];
    Serde::serialize(@mock_pragma_address, ref calldata);
    Serde::serialize(@mock_jedi_address, ref calldata);
    let (traid_address, _) = traid_contract.deploy(@calldata).unwrap();

    traid_address
}

fn setup_token() -> ContractAddress {
    let token_contract = declare("MockIERC20").unwrap().contract_class();
    let (token_address, _) = token_contract.deploy(@array![]).unwrap();
    token_address
}

#[test]
fn test_pragma_response(){
    let address = setup();    
    let dispatcher = ITraidingModelsOrdersDispatcher { contract_address: address };

    let price: u128 = dispatcher.get_asset_price(19514442401534788);
    let expected_price: u128 = 1900_00000000_u128;
    assert(price == expected_price, 'Consumer did not get');
}

#[test]
fn add_users_test(){
    let address: ContractAddress = setup();
    let order_dispatcher = ITraidingModelsOrdersDispatcher { contract_address: address };
    let metrics_dispatcher = ITraidingModelsMetricsDispatcher { contract_address: address };

    let user_address = contract_address_const::<0x1234567890abcdef>();
    let token_address = setup_token();
    let target_token_address = contract_address_const::<0xababa1234567890>();

    let num_model: u64 = metrics_dispatcher.add_model('model1', token_address, target_token_address, address);

    start_cheat_caller_address_global(user_address);
    let mut spy = spy_events();
    order_dispatcher.deposit(token_address, 0, 100_00000000, 200, 5);

    spy.assert_emitted(
        @array![
            (
                address,
                TraidingModels::Event::FundsDeposited(
                    events::FundsDeposited { 
                        model_id: 0 ,
                        user_address: user_address,
                        amount: 100_00000000,
                    }
                ),
            ),
        ],
    );
    
    let balance: u256 = order_dispatcher.get_user_balance(0, user_address, token_address);

    assert(balance == 100_00000000, 'User data mismatch');
    assert(num_model == 0, 'User count mismatch');

    stop_cheat_caller_address_global();
}

#[test]
fn add_multiple_models_test(){
    let address: ContractAddress = setup();
    let order_dispatcher = ITraidingModelsOrdersDispatcher { contract_address: address };
    let metrics_dispatcher = ITraidingModelsMetricsDispatcher { contract_address: address };

    let user_address_1 = contract_address_const::<0x1234567890abcdef>();
    let user_address_2 = contract_address_const::<0xabcdef1234567890>();

    let token_address = setup_token();
    let target_token_address = contract_address_const::<0xababa1234567890>();

    metrics_dispatcher.add_model('model1', token_address, target_token_address, address);
    let last_model: u64 = metrics_dispatcher.add_model('model2', token_address, target_token_address, address);

    start_cheat_caller_address_global(user_address_1);
    order_dispatcher.deposit(token_address, 0, 100_00000000, 200, 5);
    
    start_cheat_caller_address_global(user_address_2);
    order_dispatcher.deposit(token_address, 1, 200_00000000, 200, 5);

    let balance_1: u256 = order_dispatcher.get_user_balance(0, user_address_1, token_address);
    let balance_2: u256 = order_dispatcher.get_user_balance(1, user_address_2, token_address);

    assert(balance_1 == 100_00000000, 'User 1 data mismatch');
    assert(balance_2 == 200_00000000, 'User 2 data mismatch');
    assert(last_model == 1, 'User count mismatch');

    stop_cheat_caller_address_global();
}

#[test]
fn multiple_deposits(){
    let address: ContractAddress = setup();
    let order_dispatcher = ITraidingModelsOrdersDispatcher { contract_address: address };
    let metrics_dispatcher = ITraidingModelsMetricsDispatcher { contract_address: address };

    let user_address = contract_address_const::<0x1234567890abcdef>();
    let token_address = setup_token();
    let target_token_address = contract_address_const::<0xababa1234567890>();

    metrics_dispatcher.add_model('model1', token_address, target_token_address, address);

    start_cheat_caller_address_global(user_address);
    order_dispatcher.deposit(token_address, 0, 100_00000000, 200, 5);
    order_dispatcher.deposit(token_address, 0, 200_00000000, 200, 5);

    let balance = order_dispatcher.get_user_balance(0, user_address, token_address);
    assert(balance == 300_00000000, 'Incorrect balance');
}

#[test]
fn withdraw_test(){
    let address: ContractAddress = setup();
    let order_dispatcher = ITraidingModelsOrdersDispatcher { contract_address: address };
    let metrics_dispatcher = ITraidingModelsMetricsDispatcher { contract_address: address };

    let user_address = contract_address_const::<0x1234567890abcdef>();
    let token_address = setup_token();
    let target_token_address = contract_address_const::<0xababa1234567890>();

    metrics_dispatcher.add_model('model1', token_address, target_token_address, address);

    start_cheat_caller_address_global(user_address);
    
    order_dispatcher.deposit(token_address, 0, 100_00000000, 200, 5);
    

    let mut spy = spy_events();
    order_dispatcher.withdraw(token_address, 0, 10_00000000);
    
    spy.assert_emitted(
        @array![
            (
                address,
                TraidingModels::Event::FundsWithdrawn(
                    events::FundsWithdrawn { 
                        model_id: 0 ,
                        user_address: user_address,
                        amount: 10_00000000,
                    }
                ),
            ),
        ],
    );
    let balance: u256 = order_dispatcher.get_user_balance(0, user_address, token_address);

    assert(balance == 90_00000000, 'User data mismatch');

    stop_cheat_caller_address_global();
}

#[test]
#[should_panic(expected:'Insufficient balance')]
fn withdraw_insufficient_balance_test(){
    let address: ContractAddress = setup();
    let order_dispatcher = ITraidingModelsOrdersDispatcher { contract_address: address };
    let metrics_dispatcher = ITraidingModelsMetricsDispatcher { contract_address: address };

    let user_address = contract_address_const::<0x1234567890abcdef>();
    let token_address = setup_token();
    let target_token_address = contract_address_const::<0xababa1234567890>();

    metrics_dispatcher.add_model('model1', token_address, target_token_address, address);

    start_cheat_caller_address_global(user_address);
    order_dispatcher.withdraw(token_address, 1, 100_00000000);
    
    stop_cheat_caller_address_global();
}

#[test]
fn update_trading_parameters_test(){
    let address: ContractAddress = setup();
    let order_dispatcher = ITraidingModelsOrdersDispatcher { contract_address: address };
    let metrics_dispatcher = ITraidingModelsMetricsDispatcher { contract_address: address };

    let user_address = contract_address_const::<0x1234567890abcdef>();
    let token_address = setup_token();
    let target_token_address = contract_address_const::<0xababa1234567890>();

    metrics_dispatcher.add_model('model1', token_address, target_token_address, address);

    start_cheat_caller_address_global(user_address);
    order_dispatcher.deposit(token_address, 0, 100_00000000, 200, 5);

    let mut spy = spy_events();

    order_dispatcher.update_trading_parameters(0, 100, 10);
    spy.assert_emitted(
        @array![
            (
                address,
                TraidingModels::Event::TradingParametersSet(
                    events::TradingParametersSet { 
                        model_id: 0 ,
                        user: user_address,
                        threshold_percentage: 100,
                        expiration_timestamp: 10 * 86400,
                    }
                ),
            ),
        ],
    );
    
    stop_cheat_caller_address_global();
}

#[test]
fn execute_trade_test(){
    let address: ContractAddress = setup();
    let order_dispatcher = ITraidingModelsOrdersDispatcher { contract_address: address };
    let metrics_dispatcher = ITraidingModelsMetricsDispatcher { contract_address: address };

    let user_address = contract_address_const::<0x1234567890abcdef>();
    let token_address = setup_token();
    let target_token_address = contract_address_const::<0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48>();

    metrics_dispatcher.add_model('model1', token_address, target_token_address, address);

    start_cheat_caller_address_global(user_address);
    order_dispatcher.deposit(token_address, 0, 10, 5_00000000, 5);
    stop_cheat_caller_address_global();

    let mut spy = spy_events();
    let current_price: u128 = order_dispatcher.get_asset_price(19514442401534788);

    order_dispatcher.process_users_recursively(0, 0, 1, current_price, 1000_00000000, token_address);
    
    spy.assert_emitted(
        @array![
            (
                address,
                TraidingModels::Event::TradeExecuted(
                    events::TradeExecuted { 
                        model_id: 0 ,
                        user: user_address,
                        token_in: token_address,
                        token_out: target_token_address,
                        amount_in: 10,
                    }
                ),
            ),
        ],
    );

    let balance: u256 = order_dispatcher.get_user_balance(0, user_address, target_token_address);
    assert(balance == 900, 'Incorrect target balance');
}