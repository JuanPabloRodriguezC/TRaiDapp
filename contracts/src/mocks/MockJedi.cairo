#[starknet::contract]
pub mod MockJedi {
    use crate::interfaces::IJediSwap::{IJediSwapV2SwapRouter, ExactInputSingleParams,  ExactInputParams, ExactOutputSingleParams, ExactOutputParams, i256};
    use starknet::ContractAddress;
    #[storage]
    struct Storage {
    }
    #[abi(embed_v0)]
    impl MockJediImpl of IJediSwapV2SwapRouter<ContractState> {
        fn get_factory(self: @ContractState) -> ContractAddress {
            'factory_address'.try_into().unwrap()
        }
        fn exact_input_single(ref self: ContractState, params: ExactInputSingleParams) -> u256 {
            return 900_u256;
        }
        fn exact_input(ref self: ContractState, params: ExactInputParams) -> u256 {
            return 1000_u256;
        }
        fn exact_output_single(ref self: ContractState, params: ExactOutputSingleParams) -> u256 {
            return 1000_u256;
        }
        fn exact_output(ref self: ContractState, params: ExactOutputParams) -> u256 {
            return 1000_u256;
        }
        fn jediswap_v2_swap_callback(ref self: ContractState, amount0_delta: i256, amount1_delta: i256, callback_data_span: Span<felt252>) {
            return ();
        }
    }
}