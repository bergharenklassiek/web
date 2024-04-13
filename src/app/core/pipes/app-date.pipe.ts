import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appDate',
  standalone: true,
})
export class AppDatePipe implements PipeTransform {
  constructor(private datePipe: DatePipe) {}

  transform(date: string): string | null {
    return this.datePipe.transform(
      date,
      date.split('-')[0] === new Date().getFullYear().toString() 
        ? 'EE d MMMM HH:mm'
        : 'EE d MMMM y HH:mm'
    )
  }
}
