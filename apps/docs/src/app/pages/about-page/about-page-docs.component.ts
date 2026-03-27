import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DocsPageHeaderComponent,
  DocsCalloutComponent,
  DocsCodeBlockComponent,
  DocsApiTableComponent,
  ApiTableRow,
} from '@foliokit/docs-ui';

const configRows: ApiTableRow[] = [
  { name: 'enabled', type: 'boolean', description: 'Whether the about page is active', required: true },
  { name: 'headline', type: 'string', description: 'Main heading (e.g. author name)', required: true },
  { name: 'subheadline', type: 'string', description: 'Subtitle or tagline', required: false },
  { name: 'bio', type: 'string', description: 'Markdown content rendered via ngx-markdown', required: true },
  { name: 'photoUrl', type: 'string', description: 'Avatar image URL (Firebase Storage)', required: false },
  { name: 'photoUrlDark', type: 'string', description: 'Dark-mode avatar variant', required: false },
  { name: 'photoAlt', type: 'string', description: 'Alt text for the avatar', required: false },
  { name: 'socialLinks', type: 'SocialLink[]', description: 'Array of social platform links', required: false },
  { name: 'seo', type: 'SeoMeta', description: 'Page-level SEO metadata', required: false },
];

const routeExample = `// app.routes.ts
import { aboutResolver } from './resolvers/about.resolver';

{
  path: 'about',
  resolve: { about: aboutResolver },
  loadComponent: () =>
    import('@foliokit/cms-ui').then(m => m.AboutPageComponent),
}`;

const resolverExample = `// resolvers/about.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { SITE_CONFIG_SERVICE } from '@foliokit/cms-core';
import type { AboutPageConfig } from '@foliokit/cms-core';
import { map } from 'rxjs';

export const aboutResolver: ResolveFn<AboutPageConfig | null> = () =>
  inject(SITE_CONFIG_SERVICE).getConfig().pipe(
    map(config => config.pages?.about ?? null),
  );`;

const staticExample = `// For static sites without Firestore:
import { of } from 'rxjs';

export const aboutResolver: ResolveFn<AboutPageConfig> = () => of({
  enabled: true,
  headline: 'Tony Stark',
  subheadline: 'Genius, billionaire, playboy, philanthropist.',
  bio: '## Background\\n\\nMIT graduate at 17...',
  socialLinks: [
    { platform: 'github', url: 'https://github.com/stark-industries' },
    { platform: 'twitter', url: 'https://x.com/tonystark' },
  ],
});`;

@Component({
  selector: 'docs-about-page-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DocsPageHeaderComponent,
    DocsCalloutComponent,
    DocsCodeBlockComponent,
    DocsApiTableComponent,
  ],
  template: `
    <docs-page-header />

    <section>
      <h2 id="overview" class="mat-headline-small">Overview</h2>
      <p class="mat-body-medium">
        <code>AboutPageComponent</code> renders an author profile page with avatar,
        headline, markdown bio, and social links. It reads its data from Angular Router
        resolved data using the key <code>'about'</code>.
      </p>
      <p class="mat-body-medium mt-2">
        Selector: <code>cms-about-page</code> &middot;
        Package: <code>&#64;foliokit/cms-ui</code> &middot;
        Standalone: yes
      </p>
    </section>

    <section class="mt-8">
      <h2 id="api" class="mat-headline-small">AboutPageConfig</h2>
      <docs-api-table [rows]="configRows" />
    </section>

    <section class="mt-8">
      <h2 id="route-setup" class="mat-headline-small">Route Setup</h2>
      <p class="mat-body-medium">
        The component is loaded via a route with a resolver that provides the
        <code>AboutPageConfig</code> as route data under the <code>'about'</code> key:
      </p>
      <docs-code-block [code]="routeExample" language="typescript" />
    </section>

    <section class="mt-8">
      <h2 id="resolver" class="mat-headline-small">Resolver Example</h2>
      <p class="mat-body-medium">
        With a live Firestore backend, fetch the about config from <code>SiteConfigService</code>:
      </p>
      <docs-code-block [code]="resolverExample" language="typescript" />
      <p class="mat-body-medium mt-4">
        For static sites or demos (no Firestore), return the data directly:
      </p>
      <docs-code-block [code]="staticExample" language="typescript" />
    </section>

    <section class="mt-8">
      <h2 id="dark-mode" class="mat-headline-small">Dark Mode Avatar</h2>
      <p class="mat-body-medium">
        When <code>photoUrlDark</code> is set, the component automatically switches
        to the dark variant when the user toggles dark mode via <code>ThemeService</code>.
      </p>
    </section>

    <section class="mt-8">
      <h2 id="seo" class="mat-headline-small">SEO</h2>
      <p class="mat-body-medium">
        The component sets the page <code>&lt;title&gt;</code>, meta description,
        <code>og:image</code>, canonical URL, and <code>robots</code> tag from the
        <code>seo</code> field. If <code>seo</code> is not provided, the
        <code>headline</code> is used as the page title.
      </p>
    </section>
  `,
})
export class AboutPageDocsComponent {
  protected readonly configRows = configRows;
  protected readonly routeExample = routeExample;
  protected readonly resolverExample = resolverExample;
  protected readonly staticExample = staticExample;
}
