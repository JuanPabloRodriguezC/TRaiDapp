use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};
use starknet::{ContractAddress, contract_address_const};

use app::interfaces::IPragmaDataFetcher::{IPragmaDataFetcherDispatcher, IPragmaDataFetcherDispatcherTrait};

fn deploy_pragma_data_fetcher(pragma_oracle_address: ContractAddress) -> ContractAddress {
    let contract = declare("PragmaDataFetcher").unwrap().contract_class();

    let mut calldata = array![];
    pragma_oracle_address.serialize(ref calldata);

    let (contract_address, _) = contract.deploy(@calldata).unwrap();

    contract_address
}

#[test]
fn test_deployment() {
    // We'll use a mock contract address for testing deployment
    let mock_pragma_address = contract_address_const::<1>();
    let contract_address = deploy_pragma_data_fetcher(mock_pragma_address);
    
    // Just check that deployment works
    let dispatcher = IPragmaDataFetcherDispatcher{contract_address};
    assert(dispatcher.contract_address != contract_address_const::<0>(), 'Contract not deployed');
}

#[test]
#[ignore]
fn test_get_asset_price_on_fork() {
    // This test requires a fork environment to run properly
    // Use: snforge test test_get_asset_price_on_fork --fork-at-block MAINNET_FORK=latest
    
    // Mainnet Pragma Oracle Address
    let pragma_address = contract_address_const::<0x36031daa264c24520b11d93af622c848b2499b66b41d611bac95e13cfca131a>();
    let contract_address = deploy_pragma_data_fetcher(pragma_address);
    
    let dispatcher = IPragmaDataFetcherDispatcher{contract_address};
    
    // Using the ETH_USD constant from PragmaDataFetcher module
    let asset_id: felt252 = 19514442401534788; // ETH_USD
    
    // Call the actual price fetch function - needs forked environment
    let price: u128 = dispatcher.get_asset_price(asset_id);
    
    // Price should be non-zero for ETH
    assert(price > 0_u128, 'ETH price should be > 0');
    
    // For a real-world price, ETH is usually > $1000
    // The price might have decimals, but we're checking for a reasonable minimum
    assert(price > 1000_u128, 'ETH price seems too low');
}
