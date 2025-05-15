use snforge_std::{declare, DeclareResultTrait, ContractClassTrait};
// Ensure the MyPriceConsumer module is imported correctly
use contracts::interfaces::ITraidingModels::{ITraidingModelsMetricsDispatcher, ITraidingModelsMetricsDispatcherTrait};

#[test]
fn test_get_eth_price_uses_pragma() {
    // 1. Declare the Mock Pragma contract class
    let mock_pragma_contract = declare("MockPragma").unwrap().contract_class();

    // 2. Deploy the Mock Pragma contract
    let (mock_pragma_address, _) = mock_pragma_contract.deploy(@array![]).unwrap();

    // 3. Declare the user's contract (MyPriceConsumer) class
    let my_consumer_contract = declare("TraidingModels").unwrap().contract_class();

    // 4. Prepare constructor arguments for the user's contract: the mock Pragma address
    let mut consumer_constructor_args = array![];
    Serde::serialize(@mock_pragma_address, ref consumer_constructor_args);

    // 5. Deploy the user's contract
    let (my_consumer_address, _) = my_consumer_contract
        .deploy(@consumer_constructor_args)
        .unwrap();

    // 6. Create a dispatcher for the user's contract to interact with it
    let my_consumer_dispatcher = ITraidingModelsMetricsDispatcher { contract_address: my_consumer_address };

    // 7. Call the function in the user's contract that calls Pragma
    let eth_price_from_consumer = my_consumer_dispatcher.get_asset_price(19514442401534788);
   

    // 8. Assert the result. It should be the fixed price returned by the Mock Pragma contract.
    // Expected price from MockPragma is 1900_00000000_u128
    let expected_price = 1900_00000000_u128;
    assert(eth_price_from_consumer == expected_price, 'Consumer did not get');
}