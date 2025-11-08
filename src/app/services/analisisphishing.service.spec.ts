import { TestBed } from '@angular/core/testing';

import { AnalisisphishingService } from './analisisphishing.service';

describe('AnalisisphishingService', () => {
  let service: AnalisisphishingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalisisphishingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
