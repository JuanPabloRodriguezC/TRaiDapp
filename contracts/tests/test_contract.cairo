use starknet::ContractAddress;
use starknet::{ contract_address_const };
use snforge_std::{declare, DeclareResultTrait, ContractClassTrait};
use snforge_std::{
    start_cheat_caller_address_global, stop_cheat_caller_address_global,
    spy_events, EventSpyAssertionsTrait,
};
use contracts::interfaces::IAgents::{IAgentDispatcher, IAgentDispatcherTrait};


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