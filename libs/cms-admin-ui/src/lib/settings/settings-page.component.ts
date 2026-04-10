import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsProTabComponent } from './settings-pro-tab.component';

@Component({
  selector: 'folio-settings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SettingsProTabComponent],
  template: `<folio-settings-pro-tab />`,
})
export class SettingsPageComponent {}
