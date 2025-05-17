use starknet::ContractAddress;
use starknet::{ contract_address_const };
use snforge_std::{declare, DeclareResultTrait, ContractClassTrait};
use snforge_std::{
    start_cheat_caller_address_global, stop_cheat_caller_address_global
};
use contracts::interfaces::ITraidingModels::{ITraidingModelsMetricsDispatcher, ITraidingModelsMetricsDispatcherTrait};
use contracts::interfaces::ITraidingModels::{ITraidingModelsOrdersDispatcher, ITraidingModelsOrdersDispatcherTrait};


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

    metrics_dispatcher.add_model('model1', token_address, target_token_address);

    start_cheat_caller_address_global(user_address);
    order_dispatcher.deposit(token_address, 0, 100_00000000, 200, 5);
    
    let balance: u256 = order_dispatcher.get_user_balance(0, user_address);

    assert(balance == 100_00000000, 'User data mismatch');

    stop_cheat_caller_address_global();
}