import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { clienGuard } from './clien-guard';

describe('clienGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => clienGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
