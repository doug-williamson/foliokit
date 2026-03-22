import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'docs-landing-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  styles: [`
    :host {
      display: block;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      padding: 4rem 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
    }
    @media (max-width: 768px) {
      .features {
        grid-template-columns: 1fr;
      }
    }
    .banner {
      padding: 2rem 1.5rem;
      text-align: center;
      background-color: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
  `],
  template: `
    <section
      class="flex flex-col items-center justify-center text-center min-h-[80vh] px-6 py-16"
      style="background: linear-gradient(160deg, var(--mat-sys-surface-container-lowest) 0%, var(--mat-sys-surface-container) 100%)"
    >
      <h1 class="text-6xl font-bold tracking-tight mb-4" style="color: var(--mat-sys-primary)">
        FolioKit
      </h1>
      <p class="text-xl max-w-2xl mb-10 leading-relaxed" style="color: var(--mat-sys-on-surface-variant)">
        A headless Angular CMS toolkit built on Firebase, Material 3, and Nx
      </p>
      <div class="flex flex-wrap gap-4 justify-center">
        <a mat-flat-button routerLink="/docs/getting-started" class="!text-base !px-6 !py-3">
          Get Started
        </a>
        <a
          mat-stroked-button
          href="https://blog.foliokitcms.com"
          target="_blank"
          rel="noopener noreferrer"
          class="!text-base !px-6 !py-3"
        >
          View Live Demo
        </a>
      </div>
    </section>

    <section class="features">
      <mat-card class="overflow-visible">
        <mat-card-content class="flex flex-col gap-3 pt-6 px-6 pb-6">
          <mat-icon class="text-4xl mb-3 text-[var(--mat-sys-primary)]">web</mat-icon>
          <h3 class="text-lg font-semibold m-0">Angular 21 + SSR</h3>
          <p class="text-sm m-0 leading-relaxed" style="color: var(--mat-sys-on-surface-variant)">
            Standalone components, signals, and full SSR prerendering out of the box.
          </p>
        </mat-card-content>
      </mat-card>

      <mat-card class="overflow-visible">
        <mat-card-content class="flex flex-col gap-3 pt-6 px-6 pb-6">
          <mat-icon class="text-4xl mb-3 text-[var(--mat-sys-primary)]">local_fire_department</mat-icon>
          <h3 class="text-lg font-semibold m-0">Firebase Native</h3>
          <p class="text-sm m-0 leading-relaxed" style="color: var(--mat-sys-on-surface-variant)">
            Firestore, Firebase Auth, and Firebase Hosting — deeply integrated, zero boilerplate.
          </p>
        </mat-card-content>
      </mat-card>

      <mat-card class="overflow-visible">
        <mat-card-content class="flex flex-col gap-3 pt-6 px-6 pb-6">
          <mat-icon class="text-4xl mb-3 text-[var(--mat-sys-primary)]">palette</mat-icon>
          <h3 class="text-lg font-semibold m-0">Material 3 + Tailwind</h3>
          <p class="text-sm m-0 leading-relaxed" style="color: var(--mat-sys-on-surface-variant)">
            M3 design tokens with automatic light/dark theming and Tailwind utility classes.
          </p>
        </mat-card-content>
      </mat-card>
    </section>

    <section class="banner">
      <p class="text-base m-0">
        See it in action —
        <a
          href="https://blog.foliokitcms.com"
          target="_blank"
          rel="noopener noreferrer"
          style="color: var(--mat-sys-on-secondary-container); font-weight: 500;"
        >
          blog.foliokitcms.com
        </a>
        is built entirely with FolioKit.
      </p>
    </section>
  `,
})
export class LandingPageComponent {}
