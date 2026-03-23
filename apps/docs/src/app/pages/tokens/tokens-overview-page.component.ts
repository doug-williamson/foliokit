import { ChangeDetectionStrategy, Component, Directive, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DocsPageHeaderComponent } from '@foliokit/docs-ui';

@Directive({
  selector: '[matTypography]',
  standalone: true,
  host: { '[class]': '"mat-" + matTypography' },
})
export class MatTypographyDirective {
  @Input() matTypography = '';
}

@Component({
  selector: 'docs-tokens-overview-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatIconModule, DocsPageHeaderComponent, MatTypographyDirective],
  styles: [`
    .token-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    .token-card-grid a {
      min-width: 0;
    }
    .token-card-icon {
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .token-card-body {
      overflow-wrap: break-word;
      word-break: break-word;
    }
  `],
  template: `
    <docs-page-header />

    <p class="mat-body-medium mb-8 leading-relaxed" style="color: var(--mat-sys-on-surface-variant)">
      FolioKit exposes its configuration surface through Angular injection tokens and TypeScript
      interfaces. These form the stable public API — your app talks to FolioKit through
      tokens, not component inputs.
    </p>

    <div class="token-card-grid">
      <a
        routerLink="/docs/tokens/shell-config"
        class="no-underline"
        style="color: inherit"
      >
        <mat-card class="h-full cursor-pointer hover:shadow-md transition-shadow">
          <mat-card-content class="flex flex-col gap-3 p-5">
            <div class="token-card-icon">
              <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: var(--mat-sys-primary)">token</mat-icon>
            </div>
            <h3 matTypography="title-medium" class="m-0">SHELL_CONFIG</h3>
            <p matTypography="body-small" class="m-0 token-card-body" style="color: var(--mat-sys-on-surface-variant)">
              Configure <code>AppShellComponent</code> — app name, logo, navigation, and auth visibility.
            </p>
          </mat-card-content>
        </mat-card>
      </a>

      <a
        routerLink="/docs/tokens/seo-meta"
        class="no-underline"
        style="color: inherit"
      >
        <mat-card class="h-full cursor-pointer hover:shadow-md transition-shadow">
          <mat-card-content class="flex flex-col gap-3 p-5">
            <div class="token-card-icon">
              <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: var(--mat-sys-primary)">manage_search</mat-icon>
            </div>
            <h3 matTypography="title-medium" class="m-0">SeoMeta</h3>
            <p matTypography="body-small" class="m-0 token-card-body" style="color: var(--mat-sys-on-surface-variant)">
              TypeScript interface for page-level SEO metadata — title, description, og:image, canonical URL.
            </p>
          </mat-card-content>
        </mat-card>
      </a>

      <a
        routerLink="/docs/tokens/embedded-media"
        class="no-underline"
        style="color: inherit"
      >
        <mat-card class="h-full cursor-pointer hover:shadow-md transition-shadow">
          <mat-card-content class="flex flex-col gap-3 p-5">
            <div class="token-card-icon">
              <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: var(--mat-sys-primary)">image</mat-icon>
            </div>
            <h3 matTypography="title-medium" class="m-0">EmbeddedMediaEntry</h3>
            <p matTypography="body-small" class="m-0 token-card-body" style="color: var(--mat-sys-on-surface-variant)">
              Describes a Firebase Storage media file for inline rendering inside Markdown content.
            </p>
          </mat-card-content>
        </mat-card>
      </a>
    </div>

    <section class="mt-8">
      <h2 id="shell-config" class="mat-headline-small">SHELL_CONFIG</h2>
      <p class="mat-body-medium">
        An <code>InjectionToken&lt;ShellConfig&gt;</code> that drives <code>AppShellComponent</code>.
        Provide it in your root providers or in any component tree.
        See <a routerLink="/docs/tokens/shell-config">SHELL_CONFIG reference</a>.
      </p>
    </section>

    <section class="mt-4">
      <h2 id="seo-meta" class="mat-headline-small">SeoMeta</h2>
      <p class="mat-body-medium">
        A flat TypeScript interface for page-level SEO data. Used internally by
        <code>LinksPageComponent</code> and intended for use in route resolvers.
        See <a routerLink="/docs/tokens/seo-meta">SeoMeta reference</a>.
      </p>
    </section>

    <section class="mt-4">
      <h2 id="embedded-media" class="mat-headline-small">EmbeddedMediaEntry</h2>
      <p class="mat-body-medium">
        Represents a single media file from Firebase Storage. Passed to
        <code>MarkdownComponent</code> via the <code>embeddedMedia</code> record input.
        See <a routerLink="/docs/tokens/embedded-media">EmbeddedMediaEntry reference</a>.
      </p>
    </section>
  `,
})
export class TokensOverviewPageComponent {}
