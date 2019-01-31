import { TestBed } from '@angular/core/testing';

import { TestnetService } from './testnet.service';

describe('TestnetService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TestnetService = TestBed.get(TestnetService);
    expect(service).toBeTruthy();
  });
});
