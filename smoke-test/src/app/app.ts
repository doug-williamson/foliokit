import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShellComponent } from '@foliokit/cms-ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShellComponent, RouterOutlet],
  template: `
    <folio-app-shell>
      <router-outlet />
    </folio-app-shell>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
  `],
})
export class App {}
