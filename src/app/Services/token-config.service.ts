// services/token-config.service.ts
import { Injectable } from '@angular/core';
import { Token } from '../interfaces/token';

/**
 * Static token metadata configuration
 * This data is fetched from blockchain and doesn't change frequently
 */
const TOKEN_METADATA: Record<string, Token> = {
  // Ethereum
  '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7': {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    decimals: 18,
    icon: 'pi pi-ethereum'
  },
  // Starknet Token
  '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d': {
    symbol: 'STRK',
    name: 'Starknet Token',
    address: '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    decimals: 18,
    icon: 'pi pi-star'
  },
};

@Injectable({
  providedIn: 'root'
})
export class TokenConfigService {

  /**
   * Get token metadata by address
   * @param address Token contract address
   * @returns Token metadata or undefined if not found
   */
  getTokenInfo(address: string): Token | undefined {
    const normalizedAddress = address.toLowerCase();
    
    const entry = Object.entries(TOKEN_METADATA).find(
      ([key]) => key.toLowerCase() === normalizedAddress
    );

    return entry ? entry[1] : undefined;
  }

  getTokenSymbol(address: string): string {
    const token = this.getTokenInfo(address);
    return token?.symbol || this.truncateAddress(address);
  }

  getTokenName(address: string): string {
    const token = this.getTokenInfo(address);
    return token?.name || 'Unknown Token';
  }

  /**
   * Format raw balance string accounting for token decimals
   * @param balance Raw balance as string (e.g., from blockchain)
   * @param address Token address to get decimals
   * @returns Formatted balance as string
   */
  formatBalance(balance: string | number, address: string): string {
    const token = this.getTokenInfo(address);
    const decimals = token?.decimals || 18;
    
    return this.formatBalanceWithDecimals(balance, decimals);
  }

  /**
   * Format raw balance with explicit decimals
   * @param balance Raw balance as string or number
   * @param decimals Number of decimal places
   * @returns Formatted balance as string
   */
  formatBalanceWithDecimals(balance: string | number, decimals: number): string {
    try {
      const balanceBigInt = BigInt(balance);
      const divisor = BigInt(10 ** decimals);
      
      // Get whole and fractional parts
      const wholePart = balanceBigInt / divisor;
      const fractionalPart = balanceBigInt % divisor;
      
      if (fractionalPart === BigInt(0)) {
        return wholePart.toString();
      }
      
      // Format fractional part with leading zeros
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      // Remove trailing zeros
      const trimmedFractional = fractionalStr.replace(/0+$/, '');
      
      return `${wholePart}.${trimmedFractional}`;
    } catch (error) {
      console.error('Error formatting balance:', error);
      return '0';
    }
  }

  /**
   * Parse a human-readable balance to raw balance
   * @param amount Human-readable amount (e.g., "1.5")
   * @param address Token address to get decimals
   * @returns Raw balance as string
   */
  parseBalance(amount: string | number, address: string): string {
    const token = this.getTokenInfo(address);
    const decimals = token?.decimals || 18;
    
    return this.parseBalanceWithDecimals(amount, decimals);
  }

  /**
   * Parse a human-readable balance with explicit decimals
   * @param amount Human-readable amount
   * @param decimals Number of decimal places
   * @returns Raw balance as string
   */
  parseBalanceWithDecimals(amount: string | number, decimals: number): string {
    try {
      const amountStr = amount.toString();
      const [wholePart, fractionalPart = ''] = amountStr.split('.');
      
      // Pad or trim fractional part to match decimals
      const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
      
      const rawBalance = BigInt(wholePart + paddedFractional);
      return rawBalance.toString();
    } catch (error) {
      console.error('Error parsing balance:', error);
      return '0';
    }
  }

  /**
   * Get all available tokens
   * @returns Array of all token metadata
   */
  getAllTokens(): Token[] {
    return Object.values(TOKEN_METADATA);
  }

  /**
   * Check if a token address is supported
   * @param address Token contract address
   * @returns True if token is in metadata
   */
  isTokenSupported(address: string): boolean {
    return this.getTokenInfo(address) !== undefined;
  }

  /**
   * Truncate address for display
   * @param address Full address
   * @returns Truncated address (0x1234...5678)
   */
  private truncateAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
}