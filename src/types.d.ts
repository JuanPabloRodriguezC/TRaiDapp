interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: Array<any> }) => Promise<any>;
      on: (eventName: string, callback: any) => void;
    };
    starknet?: {
        isBraavos?: boolean;
        enable: () => Promise<string[]>;
        account: {
          address: string;
          // Other Braavos specific properties
        };
        on: (eventName: string, callback: any) => void;
      };
  }