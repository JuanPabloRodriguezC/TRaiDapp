#[starknet::contract]
pub mod MockIERC20 {
   use crate::interfaces::IERC20::{IERC20};
   use starknet::ContractAddress;
    #[storage]
    struct Storage {
        name: felt252,
        symbol: felt252,
        decimals: u8,
    }

    #[abi(embed_v0)]
    impl MockIERC20Impl of IERC20<ContractState> {
        fn transfer_from(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            true
        }

        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            true
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            true
        }

        fn total_supply(self: @ContractState) -> u256 {
            1000_u256
        }
        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            1000_u256
        }
        fn allowance(self: @ContractState, owner: ContractAddress, spender: ContractAddress) -> u256 {
            1000_u256
        }
    }
}