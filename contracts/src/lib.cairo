#[starknet::interface]
trait ITraidBots<TContractState> {
    fn get_bot_details(ref self: TContractState,id: u32) -> bool;
    fn calculate_bot_commission(self: @TContractState) -> u32;
    fn distribute_earnings(ref self: TContractState);

    
}

#[starknet::contract]
mod subscription_contract {
    use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use core::starknet::ContractAddress;

    #[storage]
    struct Storage {
        subscription_id: u8,
        price: u32,
        bot_id: u32,
        user_address: ContractAddress,
        token_address: ContractAddress
    }


    
}