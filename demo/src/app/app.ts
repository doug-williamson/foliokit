import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { AppShellComponent } from '@foliokit/cms-ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AppShellComponent,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatListModule,
  ],
  template: `
    <folio-app-shell>
      <nav shellNav>
        <mat-nav-list>
          @for (item of navItems; track item.url) {
            <a mat-list-item [routerLink]="item.url" routerLinkActive="active-link"
               [routerLinkActiveOptions]="{ exact: item.url === '/' }">
              {{ item.label }}
            </a>
          }
        </mat-nav-list>
      </nav>
      <router-outlet />
    </folio-app-shell>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .active-link { background: var(--nav-active-bg); color: var(--nav-active-color); }
  `],
})
export class App {
  readonly navItems = [
    { label: 'Home', url: '/' },
    { label: 'Lab Notes', url: '/blog' },
    { label: 'About', url: '/about' },
    { label: 'Links', url: '/links' },
  ];
}
