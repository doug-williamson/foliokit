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
    .social-proof {
      padding: 48px 1.5rem;
      background-color: var(--mat-sys-surface-container);
      text-align: center;
    }
    .social-proof-inner {
      max-width: 600px;
      margin: 0 auto;
    }
    .placeholder-image {
      width: 100%;
      height: 200px;
      background-color: var(--mat-sys-primary);
      border-radius: 12px 12px 0 0;
    }
    .browser-mockup {
      max-width: 720px;
      width: 100%;
      margin: 4rem auto 0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--mat-sys-level2);
      border: 1px solid var(--mat-sys-outline-variant);
      text-align: left;
    }
    .browser-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 1rem;
      background: var(--mat-sys-surface-container-high);
    }
    .traffic-lights {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .tl {
      display: block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .tl.red    { background: #FF5F56; }
    .tl.yellow { background: #FFBD2E; }
    .tl.green  { background: #27C93F; }
    .url-bar {
      flex: 1;
      background: var(--mat-sys-surface-container-highest);
      border-radius: 999px;
      padding: 0.2rem 0.85rem;
      font-size: 0.72rem;
      color: var(--mat-sys-on-surface-variant);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-family: monospace;
    }
    .editor-layout {
      display: flex;
      height: 260px;
    }
    .editor-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .markdown-panel {
      background: var(--mat-sys-inverse-surface);
      color: var(--mat-sys-inverse-on-surface);
      border-right: 1px solid var(--mat-sys-outline-variant);
    }
    .preview-panel {
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
    }
    .panel-label {
      padding: 0.35rem 0.75rem;
      font-size: 0.7rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      opacity: 0.6;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .markdown-panel .panel-label {
      background: color-mix(in srgb, var(--mat-sys-inverse-surface) 90%, transparent);
    }
    .preview-panel .panel-label {
      background: var(--mat-sys-surface-container-low);
    }
    .panel-content {
      flex: 1;
      padding: 1rem 0.875rem;
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow: hidden;
    }
    .code-line {
      height: 9px;
      border-radius: 3px;
      background: var(--mat-sys-inverse-on-surface);
      opacity: 0.25;
    }
    .code-line.short { width: 0; height: 16px; opacity: 0; }
    .preview-heading {
      height: 14px;
      width: 50%;
      border-radius: 3px;
      background: var(--mat-sys-on-surface);
      opacity: 0.55;
      margin-bottom: 4px;
    }
    .preview-subheading {
      height: 11px;
      width: 38%;
      border-radius: 3px;
      background: var(--mat-sys-on-surface);
      opacity: 0.4;
      margin-top: 4px;
      margin-bottom: 2px;
    }
    .preview-line {
      height: 9px;
      border-radius: 3px;
      background: var(--mat-sys-on-surface);
      opacity: 0.18;
    }
    .preview-line.short { width: 0; height: 10px; opacity: 0; }
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

      <div class="browser-mockup hidden md:block">
        <div class="browser-bar">
          <div class="traffic-lights">
            <span class="tl red"></span>
            <span class="tl yellow"></span>
            <span class="tl green"></span>
          </div>
          <div class="url-bar">admin.foliokitcms.com/editor</div>
        </div>
        <div class="editor-layout">
          <div class="editor-panel markdown-panel">
            <div class="panel-label">Markdown</div>
            <div class="panel-content">
              <div class="code-line" style="width: 55%"></div>
              <div class="code-line" style="width: 80%"></div>
              <div class="code-line" style="width: 40%"></div>
              <div class="code-line short"></div>
              <div class="code-line" style="width: 70%"></div>
              <div class="code-line" style="width: 50%"></div>
              <div class="code-line short"></div>
              <div class="code-line" style="width: 65%"></div>
              <div class="code-line" style="width: 85%"></div>
              <div class="code-line" style="width: 45%"></div>
              <div class="code-line short"></div>
              <div class="code-line" style="width: 60%"></div>
            </div>
          </div>
          <div class="editor-panel preview-panel">
            <div class="panel-label">Preview</div>
            <div class="panel-content">
              <div class="preview-heading"></div>
              <div class="preview-line" style="width: 90%"></div>
              <div class="preview-line" style="width: 75%"></div>
              <div class="preview-line" style="width: 82%"></div>
              <div class="preview-line short"></div>
              <div class="preview-subheading"></div>
              <div class="preview-line" style="width: 88%"></div>
              <div class="preview-line" style="width: 70%"></div>
              <div class="preview-line short"></div>
              <div class="preview-line" style="width: 78%"></div>
              <div class="preview-line" style="width: 55%"></div>
            </div>
          </div>
        </div>
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

    <section class="social-proof">
      <h2 class="mat-headline-small m-0 mb-8">Built with FolioKit</h2>
      <div class="social-proof-inner">
        <mat-card>
          <div class="placeholder-image" mat-card-image></div>
          <mat-card-header>
            <mat-card-title>blog.foliokitcms.com</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="text-sm leading-relaxed m-0" style="color: var(--mat-sys-on-surface-variant)">
              A fully SSR Angular blog built with @foliokit/cms-ui, Firebase, and Angular Material 3.
            </p>
          </mat-card-content>
          <mat-card-actions>
            <a
              mat-stroked-button
              href="https://blog.foliokitcms.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit Site
            </a>
          </mat-card-actions>
        </mat-card>
      </div>
    </section>
  `,
})
export class LandingPageComponent {}
