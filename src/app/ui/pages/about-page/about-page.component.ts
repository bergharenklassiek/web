import { Component, OnInit } from '@angular/core';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { select, Store } from '@ngrx/store';
import { loadAboutPage } from '../../../core/store/content.actions';
import { selectAboutPage } from '../../../core/store/content.selectors';
import { Observable } from 'rxjs';
import { AboutPage } from '../../../core/models/about-page';
import { Story } from '../../../core/models/story';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-about-page',
    standalone: true,
    imports: [RichTextComponent, AsyncPipe],
    templateUrl: './about-page.component.html',
    styleUrl: './about-page.component.scss'
})
export class AboutPageComponent implements OnInit {
  aboutPage$: Observable<Story<AboutPage> | undefined> = this.store.pipe(select(selectAboutPage));

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.dispatch(loadAboutPage());
  }
}
