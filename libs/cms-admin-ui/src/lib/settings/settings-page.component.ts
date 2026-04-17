import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsProTabComponent } from './settings-pro-tab.component';

@Component({
  selector: 'folio-settings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SettingsProTabComponent],
  template: `
    <div class="page-header">
      <div class="page-header-title">
        <h1 class="page-heading">Settings</h1>
      </div>
    </div>
    <folio-settings-pro-tab />
  `,
})
export class SettingsPageComponent {}
