import { TestBed } from '@angular/core/testing';

import { BlockchainApiService } from './blockchain-api.service';

describe('BlockchainApiService', () => {
  let service: BlockchainApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BlockchainApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
