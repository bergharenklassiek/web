import { TestBed } from '@angular/core/testing';

import { ReservationLinkService } from './reservation-link.service';

describe('ReservationLinkService', () => {
  let service: ReservationLinkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReservationLinkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
