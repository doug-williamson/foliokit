import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <section class="hero">
      <h1>Stark Industries Lab Notes</h1>
      <p class="subtitle">Engineering journal. Arc reactor specs. Suit telemetry.</p>
      <a mat-flat-button routerLink="/blog" class="cta-btn">Read the latest</a>
    </section>
  `,
  styles: [`
    .hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 60vh;
      padding: 48px 24px;
    }
    h1 {
      font-family: var(--font-display);
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 16px;
    }
    .subtitle {
      font-size: 1.15rem;
      color: var(--text-secondary);
      margin: 0 0 32px;
      max-width: 480px;
    }
    .cta-btn {
      background: var(--btn-primary-bg) !important;
      color: var(--btn-primary-text) !important;
      border-radius: var(--r-2xl);
      padding: 8px 32px;
      font-weight: 600;
      text-decoration: none;
    }
    .cta-btn:hover {
      background: var(--btn-primary-hover) !important;
    }
  `],
})
export class HomeComponent {}
