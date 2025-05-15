use pragma_lib::types::{DataType, PragmaPricesResponse};

#[starknet::interface]
pub trait IMockPragma<TContractState> {
    fn get_data_median(self: @TContractState, data_type: DataType) -> PragmaPricesResponse;
}