import { Pipe, PipeTransform } from '@angular/core';
import { AppDateFormat, formatAppDate } from '../utils/app-date-format';

@Pipe({
  name: 'appDate',
  standalone: true,
})
export class AppDatePipe implements PipeTransform {
  transform(date: string, format: AppDateFormat = 'month'): string {
    return formatAppDate(date, format);
  }
}
