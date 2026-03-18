import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { SiteConfigService } from '@foliokit/cms-core';
import { AppShellComponent, SHELL_CONFIG, ShellConfig } from '@foliokit/cms-ui';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AppShellComponent,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
  ],
  providers: [
    {
      provide: SHELL_CONFIG,
      useFactory: (): ShellConfig => ({
        appName: 'FolioKit Blog',
        showAuth: false,
      }),
    },
  ],
})
export class App {
  private readonly siteConfigService = inject(SiteConfigService);

  protected readonly siteConfig = toSignal(
    this.siteConfigService.getDefaultSiteConfig(),
  );

  protected readonly navItems = computed(
    () => this.siteConfig()?.nav ?? [],
  );
}
