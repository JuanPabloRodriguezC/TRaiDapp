import { TestBed } from '@angular/core/testing';

import { WalletConnectionService } from './wallet-connection.service';

describe('WalletConnectionService', () => {
  let service: WalletConnectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WalletConnectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
