// interfaces/token.ts
export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon?: string;
  logoUrl?: string;
}