// token-config.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { TokenConfigService } from './token-config.service';

describe('TokenConfigService', () => {
  let service: TokenConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTokenInfo', () => {
    it('should return ETH token info for ETH address', () => {
      const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const token = service.getTokenInfo(ethAddress);
      
      expect(token).toBeDefined();
      expect(token?.symbol).toBe('ETH');
      expect(token?.decimals).toBe(18);
    });

    it('should return STRK token info for STRK address', () => {
      const strkAddress = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
      const token = service.getTokenInfo(strkAddress);
      
      expect(token).toBeDefined();
      expect(token?.symbol).toBe('STRK');
      expect(token?.decimals).toBe(18);
    });

    it('should return undefined for unknown address', () => {
      const unknownAddress = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const token = service.getTokenInfo(unknownAddress);
      
      expect(token).toBeUndefined();
    });

    it('should handle case-insensitive address matching', () => {
      const ethAddressLower = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'.toLowerCase();
      const token = service.getTokenInfo(ethAddressLower);
      
      expect(token).toBeDefined();
      expect(token?.symbol).toBe('ETH');
    });
  });

  describe('getTokenSymbol', () => {
    it('should return symbol for known token', () => {
      const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      expect(service.getTokenSymbol(ethAddress)).toBe('ETH');
    });

    it('should return truncated address for unknown token', () => {
      const unknownAddress = '0x1234567890123456789012345678901234567890';
      const result = service.getTokenSymbol(unknownAddress);
      
      expect(result).toContain('0x1234');
      expect(result).toContain('...');
    });
  });

  describe('formatBalance', () => {
    it('should format ETH balance correctly (18 decimals)', () => {
      const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      
      // 1.5 ETH = 1500000000000000000 wei
      const rawBalance = '1500000000000000000';
      const formatted = service.formatBalance(rawBalance, ethAddress);
      
      expect(formatted).toBe('1.5');
    });

    it('should format whole number balance', () => {
      const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      
      // 5 ETH = 5000000000000000000 wei
      const rawBalance = '5000000000000000000';
      const formatted = service.formatBalance(rawBalance, ethAddress);
      
      expect(formatted).toBe('5');
    });

    it('should handle zero balance', () => {
      const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const formatted = service.formatBalance('0', ethAddress);
      
      expect(formatted).toBe('0');
    });

    it('should format small balance correctly', () => {
      const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      
      // 0.000000000000000001 ETH = 1 wei
      const rawBalance = '1';
      const formatted = service.formatBalance(rawBalance, ethAddress);
      
      expect(formatted).toBe('0.000000000000000001');
    });
  });

  describe('formatBalanceWithDecimals', () => {
    it('should format with 6 decimals (like USDC)', () => {
      // 100.5 USDC = 100500000 (6 decimals)
      const rawBalance = '100500000';
      const formatted = service.formatBalanceWithDecimals(rawBalance, 6);
      
      expect(formatted).toBe('100.5');
    });

    it('should format with 8 decimals (like WBTC)', () => {
      // 0.5 WBTC = 50000000 (8 decimals)
      const rawBalance = '50000000';
      const formatted = service.formatBalanceWithDecimals(rawBalance, 8);
      
      expect(formatted).toBe('0.5');
    });

    it('should remove trailing zeros', () => {
      const rawBalance = '1500000000000000000'; // 1.5 with 18 decimals
      const formatted = service.formatBalanceWithDecimals(rawBalance, 18);
      
      expect(formatted).toBe('1.5');
      expect(formatted).not.toContain('1.500000000000000000');
    });
  });

  describe('parseBalance', () => {
    it('should parse ETH amount correctly', () => {
      const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      
      const parsed = service.parseBalance('1.5', ethAddress);
      expect(parsed).toBe('1500000000000000000');
    });

    it('should parse whole number', () => {
      const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      
      const parsed = service.parseBalance('5', ethAddress);
      expect(parsed).toBe('5000000000000000000');
    });

    it('should handle string input', () => {
      const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      
      const parsed = service.parseBalance('2.5', ethAddress);
      expect(parsed).toBe('2500000000000000000');
    });
  });

  describe('parseBalanceWithDecimals', () => {
    it('should parse with 6 decimals', () => {
      const parsed = service.parseBalanceWithDecimals('100.5', 6);
      expect(parsed).toBe('100500000');
    });

    it('should handle more decimals than specified (truncate)', () => {
      const parsed = service.parseBalanceWithDecimals('1.123456789', 6);
      expect(parsed).toBe('1123456'); // Truncated to 6 decimals
    });
  });

  describe('getAllTokens', () => {
    it('should return array of all tokens', () => {
      const tokens = service.getAllTokens();
      
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.some(t => t.symbol === 'ETH')).toBe(true);
      expect(tokens.some(t => t.symbol === 'STRK')).toBe(true);
    });
  });

  describe('isTokenSupported', () => {
    it('should return true for supported token', () => {
      const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      expect(service.isTokenSupported(ethAddress)).toBe(true);
    });

    it('should return false for unsupported token', () => {
      const unknownAddress = '0x0000000000000000000000000000000000000000000000000000000000000000';
      expect(service.isTokenSupported(unknownAddress)).toBe(false);
    });
  });

  describe('roundtrip parsing and formatting', () => {
    it('should maintain value through parse and format cycle', () => {
      const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const originalAmount = '1.5';
      
      const parsed = service.parseBalance(originalAmount, ethAddress);
      const formatted = service.formatBalance(parsed, ethAddress);
      
      expect(formatted).toBe(originalAmount);
    });
  });
});