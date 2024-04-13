import { DatePipe } from '@angular/common';
import { AppDatePipe } from './app-date.pipe';

describe('AppDatePipe', () => {
  it('create an instance', () => {
    const datePipe = new DatePipe('en-US');
    const pipe = new AppDatePipe(datePipe);
    expect(pipe).toBeTruthy();
  });
});
