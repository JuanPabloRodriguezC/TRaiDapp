interface Window {
  starknet?: {
    isBraavos?: boolean;
    isArgent?: boolean;
    enable: () => Promise<string[]>;
    account: {
      address: string;
      provider: any;
    };
    on: (eventName: string, callback: any) => void;
    off: (eventName: string, callback: any) => void;
    request?: (request: { type: string; params?: any }) => Promise<any>;
    selectedAddress?: string;
  };
}

interface WalletEventHandlers {
  accountsChanged: (accounts: string[]) => void;
  networkChanged: (network: any) => void;
  [key: string]: any; // Allow for additional event handlers if needed
}