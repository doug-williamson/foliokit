import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { AboutPageEditorComponent } from '../page-editor/about-page-editor.component';
import { LinksPageEditorComponent } from '../page-editor/links-page-editor.component';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';

@Component({
  selector: 'cms-pages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, AboutPageEditorComponent, LinksPageEditorComponent],
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    .tab-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  `],
  template: `
    <div class="tab-strip">
      <button
        mat-button
        class="tab-btn"
        [class.active]="activeTab() === 'about'"
        (click)="setTab('about')"
      >About</button>
      <button
        mat-button
        class="tab-btn"
        [class.active]="activeTab() === 'links'"
        (click)="setTab('links')"
      >Links</button>
    </div>

    <div class="tab-content">
      @if (activeTab() === 'about') {
        <folio-about-page-editor />
      }
      @if (activeTab() === 'links') {
        <folio-links-page-editor />
      }
    </div>
  `,
})
export class PagesComponent {
  /** Exposed for unsavedChangesGuard (HasDirtyStore interface). */
  readonly store = inject(SiteConfigEditorStore);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly activeTab = signal<'about' | 'links'>('about');

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      const tab = params['tab'];
      if (tab === 'about' || tab === 'links') {
        this.activeTab.set(tab);
      }
    });
  }

  setTab(tab: 'about' | 'links'): void {
    this.activeTab.set(tab);
    this.router.navigate([], {
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
