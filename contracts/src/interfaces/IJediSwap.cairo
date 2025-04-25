use starknet::ContractAddress;
//sign true for negative numbers
#[derive(Drop, Serde)]
struct i256 {
    mag: u256,
    sign: bool,
}

#[derive(Drop, Serde)]
struct ExactInputSingleParams {
    token_in: ContractAddress,
    token_out: ContractAddress,
    fee: u32,
    recipient: ContractAddress,
    deadline: u64,
    amount_in: u256,
    amount_out_minimum: u256,
    sqrt_price_limit_X96: u256
}

#[derive(Drop, Serde)]
struct ExactInputParams {
    path: Array<felt252>,
    recipient: ContractAddress,
    deadline: u64,
    amount_in: u256,
    amount_out_minimum: u256
}

#[derive(Drop, Serde)]
struct ExactOutputSingleParams {
    token_in: ContractAddress,
    token_out: ContractAddress,
    fee: u32,
    recipient: ContractAddress,
    deadline: u64,
    amount_out: u256,
    amount_in_maximum: u256,
    sqrt_price_limit_X96: u256
}

#[derive(Drop, Serde)]
struct ExactOutputParams {
    path: Array::<felt252>,
    recipient: ContractAddress,
    deadline: u64,
    amount_out: u256,
    amount_in_maximum: u256
}

#[starknet::interface]
pub trait IJediSwapV2SwapRouter<TContractState> {
    fn get_factory(self: @TContractState) -> ContractAddress;
    fn exact_input_single(ref self: TContractState, params: ExactInputSingleParams) -> u256;
    fn exact_input(ref self: TContractState, params: ExactInputParams) -> u256;
    fn exact_output_single(ref self: TContractState, params: ExactOutputSingleParams) -> u256;
    fn exact_output(ref self: TContractState, params: ExactOutputParams) -> u256;
    fn jediswap_v2_swap_callback(ref self: TContractState, amount0_delta: i256, amount1_delta: i256, callback_data_span: Span<felt252>);
}