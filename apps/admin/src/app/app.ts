import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  host: { class: 'folio-admin' },
  template: `<router-outlet />`,
})
export class App {}
