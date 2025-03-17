use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, spy_events, EventSpyAssertionsTrait};
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
#[available_gas(200000000)]
fn read_price(){
    let pragma_oracle_address: ContractAddress = contract_address_const::<0x36031daa264c24520b11d93af622c848b2499b66b41d611bac95e13cfca131a>();
    let pdf: ContractAddress = deploy_pragma_data_fetcher(pragma_oracle_address);
    let dispatcher = IPragmaDataFetcherDispatcher { contract_address: pdf };
    let result = dispatcher.get_current_median();

}