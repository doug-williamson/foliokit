import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthorService, FIREBASE_STORAGE, NavItem, SocialPlatform } from '@foliokit/cms-core';
import { ThemeService } from '@foliokit/cms-ui';
import type { Author } from '@foliokit/cms-core';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';

type StepId = 'site' | 'author' | 'nav' | 'home' | 'about' | 'links';

interface StepDef {
  id: StepId;
  label: string;
  icon: string;
  description: string;
}

const STEPS: StepDef[] = [
  { id: 'site',   label: 'Site Basics',  icon: 'language',    description: 'Name, URL, and description' },
  { id: 'author', label: 'Author',       icon: 'person',       description: 'Create your author profile' },
  { id: 'nav',    label: 'Navigation',   icon: 'menu',         description: 'Header nav links' },
  { id: 'home',   label: 'Home Page',    icon: 'home',         description: 'Hero headline and CTA' },
  { id: 'about',  label: 'About Page',   icon: 'info',         description: 'Optional — your bio page' },
  { id: 'links',  label: 'Links Page',   icon: 'link',         description: 'Optional — your link-in-bio page' },
];

const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'twitter',   label: 'Twitter / X' },
  { value: 'bluesky',   label: 'Bluesky' },
  { value: 'github',    label: 'GitHub' },
  { value: 'linkedin',  label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube',   label: 'YouTube' },
  { value: 'email',     label: 'Email' },
  { value: 'website',   label: 'Website' },
];

@Component({
  selector: 'folio-admin-setup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DragDropModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .setup-top-header {
      min-height: 48px;
    }
    /* svgIcon + icon button: flex-center the glyph in the touch target */
    .setup-theme-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .setup-theme-toggle mat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      margin: 0;
    }
    .setup-theme-toggle mat-icon svg {
      display: block;
      width: 24px;
      height: 24px;
    }
    .step-item { transition: background 120ms ease; }
    .step-item.active { background: color-mix(in srgb, var(--mat-sys-primary) 10%, transparent); }
    .step-item:hover:not(.active) { background: color-mix(in srgb, currentColor 5%, transparent); }
    .done-icon { color: #22c55e; }
    .incomplete-icon { opacity: 0.3; }
  `],
  template: `
    <!-- Top header -->
    <div class="setup-top-header flex items-center px-4 py-2 border-b shrink-0"
         style="border-color: color-mix(in srgb, currentColor 10%, transparent)">
      <span class="flex-1 text-sm font-semibold leading-none">FolioKit Setup</span>
      <button
        mat-icon-button
        class="setup-theme-toggle"
        (click)="theme.toggle()"
        [attr.aria-label]="theme.scheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <mat-icon [svgIcon]="theme.scheme() === 'dark' ? 'light_mode' : 'dark_mode'" />
      </button>
    </div>

    <div class="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

      <!-- ── Left rail (desktop only) ── -->
      <aside class="hidden md:flex w-56 shrink-0 flex-col border-r overflow-y-auto"
             style="border-color: color-mix(in srgb, currentColor 10%, transparent)">

        <div class="px-4 pt-6 pb-4 shrink-0">
          <h2 class="text-sm font-semibold uppercase tracking-wider opacity-50">FolioKit Setup</h2>
          <div class="mt-3 mb-1">
            <mat-progress-bar mode="determinate" [value]="progressPct()" />
          </div>
          <p class="text-xs opacity-40 mt-1">{{ completedCount() }} of {{ steps.length }} complete</p>
        </div>

        <nav class="flex flex-col gap-0.5 px-2 pb-4">
          @for (step of steps; track step.id) {
            <button
              type="button"
              class="step-item flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left"
              [class.active]="activeStep() === step.id"
              (click)="goTo(step.id)"
            >
              <mat-icon class="shrink-0 text-[18px]"
                [class.done-icon]="isComplete(step.id)"
                [class.incomplete-icon]="!isComplete(step.id)"
                [svgIcon]="isComplete(step.id) ? 'check_circle' : 'radio_button_unchecked'" />
              <span class="text-sm leading-snug">{{ step.label }}</span>
            </button>
          }
        </nav>

      </aside>

      <!-- ── Mobile header (below md) ── -->
      <div class="flex md:hidden items-center gap-2 px-4 py-3 border-b shrink-0"
           style="border-color: color-mix(in srgb, currentColor 10%, transparent)">
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wider opacity-50">
            Step {{ activeStepIndex() + 1 }} of {{ steps.length }}
          </p>
          <p class="text-sm font-medium truncate">{{ activeStepDef()?.label }}</p>
        </div>
        <div class="flex gap-1.5">
          @for (step of steps; track step.id) {
            <button type="button"
                    class="w-2.5 h-2.5 rounded-full transition-colors"
                    [style.background]="isComplete(step.id) ? '#22c55e' : activeStep() === step.id ? 'var(--mat-sys-primary)' : 'color-mix(in srgb, currentColor 20%, transparent)'"
                    (click)="goTo(step.id)"
                    [attr.aria-label]="step.label"></button>
          }
        </div>
      </div>

      <!-- ── Main content ── -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden">

        @if (!store.config()) {
          <div class="flex items-center justify-center flex-1">
            <mat-spinner diameter="40" />
          </div>
        } @else {

          <!-- Step header (desktop only — mobile uses the compact header above) -->
          <div class="hidden md:flex items-center gap-3 px-6 py-4 border-b shrink-0"
               style="border-color: color-mix(in srgb, currentColor 12%, transparent)">
            <mat-icon class="opacity-60" [svgIcon]="activeStepDef()?.icon ?? ''" />
            <div class="flex-1">
              <h1 class="text-lg font-semibold">{{ activeStepDef()?.label }}</h1>
              <p class="text-xs opacity-50">{{ activeStepDef()?.description }}</p>
            </div>
            @if (store.isSaving()) {
              <span class="text-xs opacity-40">Saving…</span>
            } @else if (store.saveError()) {
              <span class="text-xs text-red-500">{{ store.saveError() }}</span>
            } @else if (stepSaveSuccess()) {
              <span class="text-xs" style="color: #22c55e">Saved ✓</span>
            }
          </div>

          <!-- Step body -->
          <div class="flex-1 overflow-y-auto min-w-0">
            <div class="max-w-xl mx-auto px-4 py-5 sm:px-6 sm:py-8 min-w-0">

              <!-- ══ Step 1: Site Basics ══ -->
              @if (activeStep() === 'site') {
                <form [formGroup]="siteForm" class="flex flex-col gap-5 min-w-0">
                  <mat-form-field appearance="outline">
                    <mat-label>Site Name</mat-label>
                    <input matInput formControlName="siteName" placeholder="Doug's Blog" />
                    @if (siteForm.get('siteName')?.hasError('required') && siteForm.get('siteName')?.touched) {
                      <mat-error>Site name is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Site URL</mat-label>
                    <input matInput formControlName="siteUrl" placeholder="https://yourdomain.com" />
                    <mat-hint>Used for canonical URLs and SEO</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Description</mat-label>
                    <textarea matInput formControlName="description" rows="3"
                              placeholder="A short description of your site…"></textarea>
                    <mat-hint>Used as the default meta description</mat-hint>
                  </mat-form-field>
                </form>
              }

              <!-- ══ Step 2: Author ══ -->
              @if (activeStep() === 'author') {
                <div class="flex flex-col gap-5">

                  @if (authors().length) {
                    <div class="p-4 rounded-lg border flex items-start gap-3"
                         style="border-color: color-mix(in srgb, var(--mat-sys-primary) 30%, transparent); background: color-mix(in srgb, var(--mat-sys-primary) 6%, transparent)">
                      <mat-icon class="shrink-0 opacity-60" style="color: #22c55e" svgIcon="check_circle" />
                      <div>
                        <p class="text-sm font-medium">
                          {{ authors().length === 1 ? 'Author created' : authors().length + ' authors exist' }}
                        </p>
                        <ul class="text-sm opacity-60 mt-1 list-none">
                          @for (a of authors(); track a.id) {
                            <li>{{ a.displayName }}</li>
                          }
                        </ul>
                        <a mat-button routerLink="/authors" class="mt-2 px-0 text-xs">
                          Manage Authors →
                        </a>
                      </div>
                    </div>
                  }

                  @if (!authors().length) {
                    <p class="text-sm opacity-60">
                      Create your author profile. It will be linked to your posts and displayed in the blog.
                    </p>

                    <!-- Photo upload (light + dark) -->
                    <div class="flex flex-col gap-2">
                      <span class="text-sm font-semibold">Profile Photo</span>
                      <div class="grid grid-cols-2 gap-6 justify-items-center items-start">
                        <!-- Light -->
                        <div class="flex flex-col items-center gap-1">
                          @if (authorPhotoUrl(); as url) {
                            <div class="relative w-20 h-20 shrink-0 rounded-full overflow-hidden group">
                              <img [src]="url" alt="Author photo (light)" class="w-full h-full object-cover" />
                              <div class="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                   style="background: rgba(0,0,0,0.5)">
                                <button mat-icon-button style="color:white" title="Replace" (click)="isBrowser && setupPhotoInput.click()">
                                  <mat-icon class="text-[18px]" svgIcon="swap_horiz" />
                                </button>
                                <button mat-icon-button style="color:white" title="Remove" (click)="authorPhotoUrl.set(null)">
                                  <mat-icon class="text-[18px]" svgIcon="delete" />
                                </button>
                              </div>
                            </div>
                          } @else {
                            <div class="w-20 h-20 shrink-0 rounded-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed gap-1"
                                 style="border-color: color-mix(in srgb, currentColor 25%, transparent)"
                                 role="button" tabindex="0"
                                 (click)="isBrowser && setupPhotoInput.click()"
                                 (keydown.enter)="isBrowser && setupPhotoInput.click()">
                              <mat-icon class="opacity-40 text-[20px]" svgIcon="upload" />
                            </div>
                          }
                          <span class="text-xs opacity-50 leading-none">Light</span>
                        </div>
                        <!-- Dark -->
                        <div class="flex flex-col items-center gap-1">
                          @if (authorPhotoDarkUrl(); as url) {
                            <div class="relative w-20 h-20 shrink-0 rounded-full overflow-hidden group" style="background: #1a1a1a">
                              <img [src]="url" alt="Author photo (dark)" class="w-full h-full object-cover" />
                              <div class="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                   style="background: rgba(0,0,0,0.5)">
                                <button mat-icon-button style="color:white" title="Replace" (click)="isBrowser && setupPhotoDarkInput.click()">
                                  <mat-icon class="text-[18px]" svgIcon="swap_horiz" />
                                </button>
                                <button mat-icon-button style="color:white" title="Remove" (click)="authorPhotoDarkUrl.set(null)">
                                  <mat-icon class="text-[18px]" svgIcon="delete" />
                                </button>
                              </div>
                            </div>
                          } @else {
                            <div class="w-20 h-20 shrink-0 rounded-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed gap-1"
                                 style="border-color: color-mix(in srgb, currentColor 25%, transparent)"
                                 role="button" tabindex="0"
                                 (click)="isBrowser && setupPhotoDarkInput.click()"
                                 (keydown.enter)="isBrowser && setupPhotoDarkInput.click()">
                              <mat-icon class="opacity-40 text-[20px]" svgIcon="upload" />
                            </div>
                          }
                          <span class="text-xs opacity-50 leading-none">Dark</span>
                        </div>
                      </div>
                      <input #setupPhotoInput type="file" accept="image/*" class="hidden"
                             (change)="onAuthorPhotoSelected($any($event.target).files, 'light')" />
                      <input #setupPhotoDarkInput type="file" accept="image/*" class="hidden"
                             (change)="onAuthorPhotoSelected($any($event.target).files, 'dark')" />
                      @if (authorPhotoUploading()) {
                        <mat-progress-bar mode="determinate" [value]="authorPhotoProgress()" class="max-w-[11rem]" />
                      }
                      @if (authorPhotoError()) {
                        <p class="text-xs text-red-500">{{ authorPhotoError() }}</p>
                      }
                    </div>

                    <form [formGroup]="authorForm" class="flex flex-col gap-5">
                      <mat-form-field appearance="outline">
                        <mat-label>Display Name</mat-label>
                        <input matInput formControlName="displayName" placeholder="Jane Doe" />
                        @if (authorForm.get('displayName')?.hasError('required') && authorForm.get('displayName')?.touched) {
                          <mat-error>Display name is required</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Bio</mat-label>
                        <textarea matInput formControlName="bio" rows="4"
                                  placeholder="A short bio…"></textarea>
                        <mat-hint>Supports Markdown</mat-hint>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Email (optional)</mat-label>
                        <input matInput formControlName="email" placeholder="you@example.com" />
                      </mat-form-field>
                    </form>
                  }

                  @if (authorSaveError()) {
                    <p class="text-sm text-red-500">{{ authorSaveError() }}</p>
                  }
                </div>
              }

              <!-- ══ Step 3: Navigation ══ -->
              @if (activeStep() === 'nav') {
                <div class="flex flex-col gap-5">
                  <p class="text-sm opacity-60">
                    Configure your site's header navigation. Drag to reorder.
                  </p>

                  <div cdkDropList (cdkDropListDropped)="onNavDrop($event)" class="flex flex-col gap-2">
                    @for (ctrl of navItemsArray.controls; track $index) {
                      <div cdkDrag [formGroup]="$any(ctrl)"
                           class="flex flex-col gap-2 p-3 rounded-lg border"
                           style="border-color: color-mix(in srgb, currentColor 12%, transparent)">
                        <div class="flex items-center gap-2">
                          <mat-icon cdkDragHandle class="shrink-0 cursor-grab opacity-40 text-[18px]" svgIcon="drag_indicator" />
                          <mat-form-field appearance="outline" class="flex-1" subscriptSizing="dynamic">
                            <mat-label>Label</mat-label>
                            <input matInput formControlName="label" placeholder="Home" />
                          </mat-form-field>
                          <button mat-icon-button type="button" matTooltip="Remove" (click)="removeNavItem($index)">
                            <mat-icon svgIcon="delete" />
                          </button>
                        </div>
                        <mat-form-field appearance="outline" subscriptSizing="dynamic">
                          <mat-label>URL</mat-label>
                          <input matInput formControlName="url" placeholder="/" />
                        </mat-form-field>
                      </div>
                    }
                  </div>

                  <button mat-stroked-button type="button" (click)="addNavItem()">
                    <mat-icon svgIcon="add" />
                    Add nav item
                  </button>

                  @if (!navItemsArray.length) {
                    <p class="text-xs opacity-40 text-center -mt-2">
                      Tip: typical nav includes Home (/), Blog (/posts), About (/about), Links (/links).
                    </p>
                  }
                </div>
              }

              <!-- ══ Step 4: Home Page ══ -->
              @if (activeStep() === 'home') {
                <div class="flex flex-col gap-5">
                  <p class="text-sm opacity-60">
                    Configure the hero section that visitors see on your home page.
                  </p>

                  <form [formGroup]="homeForm" class="flex flex-col gap-5">
                    <mat-form-field appearance="outline">
                      <mat-label>Hero Headline</mat-label>
                      <input matInput formControlName="heroHeadline" placeholder="Hey, I'm Jane" />
                      @if (homeForm.get('heroHeadline')?.hasError('required') && homeForm.get('heroHeadline')?.touched) {
                        <mat-error>Headline is required</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Subheadline</mat-label>
                      <input matInput formControlName="heroSubheadline"
                             placeholder="Thoughts on building products and writing software." />
                    </mat-form-field>

                    <div class="flex flex-col sm:flex-row gap-4">
                      <mat-form-field appearance="outline" class="flex-1">
                        <mat-label>CTA Button Label</mat-label>
                        <input matInput formControlName="ctaLabel" placeholder="Read Posts" />
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="flex-1">
                        <mat-label>CTA URL</mat-label>
                        <input matInput formControlName="ctaUrl" placeholder="/posts" />
                      </mat-form-field>
                    </div>
                  </form>
                </div>
              }

              <!-- ══ Step 5: About Page ══ -->
              @if (activeStep() === 'about') {
                <div class="flex flex-col gap-5">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium">Enable About page</p>
                      <p class="text-xs opacity-50">Adds /about to your blog and navigation</p>
                    </div>
                    <mat-slide-toggle
                      [checked]="aboutEnabled()"
                      (change)="onAboutEnabledChange($event.checked)"
                    />
                  </div>

                  @if (aboutEnabled()) {
                    <form [formGroup]="aboutForm" class="flex flex-col gap-5">
                      <mat-form-field appearance="outline">
                        <mat-label>Headline</mat-label>
                        <input matInput formControlName="headline" placeholder="Hi, I'm Jane" />
                        @if (aboutForm.get('headline')?.hasError('required') && aboutForm.get('headline')?.touched) {
                          <mat-error>Headline is required</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Subheadline</mat-label>
                        <input matInput formControlName="subheadline" placeholder="Software engineer & writer" />
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Bio</mat-label>
                        <textarea matInput formControlName="bio" rows="6"
                                  placeholder="Write your bio in Markdown…"></textarea>
                        <mat-hint>Supports Markdown — edit full details in About Page editor</mat-hint>
                      </mat-form-field>
                    </form>

                    <p class="text-xs opacity-40">
                      Photos and social links can be added in the
                      <a routerLink="/pages/about" class="underline">About Page editor</a>.
                    </p>
                  }
                </div>
              }

              <!-- ══ Step 6: Links Page ══ -->
              @if (activeStep() === 'links') {
                <div class="flex flex-col gap-5">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium">Enable Links page</p>
                      <p class="text-xs opacity-50">Adds /links — a link-in-bio style page</p>
                    </div>
                    <mat-slide-toggle
                      [checked]="linksEnabled()"
                      (change)="onLinksEnabledChange($event.checked)"
                    />
                  </div>

                  @if (linksEnabled()) {
                    <form [formGroup]="linksMetaForm" class="flex flex-col gap-5">
                      <mat-form-field appearance="outline">
                        <mat-label>Headline</mat-label>
                        <input matInput formControlName="headline" placeholder="Jane Doe" />
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Tagline</mat-label>
                        <input matInput formControlName="bio" placeholder="Engineer · Writer · Creator" />
                      </mat-form-field>
                    </form>

                    <!-- Links list -->
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium">Links</span>
                      <button mat-stroked-button type="button" (click)="addLink()">
                        <mat-icon svgIcon="add" />
                        Add link
                      </button>
                    </div>

                    <div class="flex flex-col gap-3">
                      @for (ctrl of linksArray.controls; track $index) {
                        <div [formGroup]="$any(ctrl)"
                             class="flex flex-col gap-2 p-3 rounded-lg border"
                             style="border-color: color-mix(in srgb, currentColor 12%, transparent)">
                          <div class="flex items-start gap-2">
                            <mat-form-field appearance="outline" class="flex-1" subscriptSizing="dynamic">
                              <mat-label>Platform</mat-label>
                              <mat-select formControlName="platform">
                                @for (p of platforms; track p.value) {
                                  <mat-option [value]="p.value">{{ p.label }}</mat-option>
                                }
                              </mat-select>
                            </mat-form-field>
                            <button mat-icon-button type="button" matTooltip="Remove" class="shrink-0 mt-1"
                                    (click)="removeLink($index)">
                              <mat-icon svgIcon="delete" />
                            </button>
                          </div>
                          <div class="flex flex-col sm:flex-row gap-2">
                            <mat-form-field appearance="outline" class="flex-1" subscriptSizing="dynamic">
                              <mat-label>Label</mat-label>
                              <input matInput formControlName="label" placeholder="My Blog" />
                            </mat-form-field>
                            <mat-form-field appearance="outline" class="flex-1" subscriptSizing="dynamic">
                              <mat-label>URL</mat-label>
                              <input matInput formControlName="url" placeholder="https://…" />
                            </mat-form-field>
                          </div>
                        </div>
                      }
                      @if (!linksArray.length) {
                        <p class="text-sm opacity-40 text-center py-4">No links yet. Add your first link above.</p>
                      }
                    </div>

                    <p class="text-xs opacity-40">
                      Avatar and full link management available in the
                      <a routerLink="/pages/links" class="underline">Links Page editor</a>.
                    </p>
                  }
                </div>
              }

            </div>
          </div>

          <!-- ── Sticky footer ── -->
          <div class="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 border-t shrink-0"
               style="border-color: color-mix(in srgb, currentColor 12%, transparent); background: var(--mat-sys-surface)">
            <span class="hidden sm:inline flex-1 text-sm opacity-50">
              @if (isLastStep() && allStepsComplete()) { All steps complete — click Finish Setup to continue. }
              @else { Step {{ activeStepIndex() + 1 }} of {{ steps.length }} }
            </span>
            <div class="flex flex-col sm:flex-row flex-1 sm:flex-none gap-2 sm:gap-3">
              <button mat-stroked-button class="flex-1 sm:flex-initial" [disabled]="store.isSaving()" (click)="onSaveStep()">
                Save
              </button>
              @if (!isLastStep()) {
                <button mat-flat-button class="flex-1 sm:flex-initial" [disabled]="store.isSaving() || isStepFormInvalid()" (click)="onSaveAndContinue()">
                  Save &amp; Continue
                </button>
              } @else {
                <button mat-flat-button class="flex-1 sm:flex-initial" [disabled]="!allStepsComplete() || store.isSaving()" (click)="onFinishSetup()">
                  Finish Setup
                </button>
              }
            </div>
          </div>

        }
      </main>
    </div>
  `,
})
export class SetupComponent implements OnInit {
  readonly store = inject(SiteConfigEditorStore);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly authorService = inject(AuthorService);
  private readonly fb = inject(FormBuilder);
  private readonly storage = inject(FIREBASE_STORAGE);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly steps = STEPS;
  readonly platforms = SOCIAL_PLATFORMS;

  readonly activeStep = signal<StepId>('site');
  readonly authors = signal<Author[]>([]);
  readonly authorSaveError = signal<string | null>(null);
  readonly stepSaveSuccess = signal(false);

  // ── Author photo upload ─────────────────────────────────────────────────
  readonly authorPhotoUrl = signal<string | null>(null);
  readonly authorPhotoDarkUrl = signal<string | null>(null);
  readonly authorPhotoUploading = signal(false);
  readonly authorPhotoProgress = signal(0);
  readonly authorPhotoError = signal<string | null>(null);
  private authorTempId = crypto.randomUUID();

  @ViewChild('setupPhotoInput') setupPhotoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('setupPhotoDarkInput') setupPhotoDarkInput!: ElementRef<HTMLInputElement>;

  // ── Site form ──────────────────────────────────────────────────────────────
  readonly siteForm: FormGroup = this.fb.group({
    siteName:    ['', Validators.required],
    siteUrl:     [''],
    description: [''],
  });

  // ── Author form ────────────────────────────────────────────────────────────
  readonly authorForm: FormGroup = this.fb.group({
    displayName: ['', Validators.required],
    bio:         [''],
    email:       [''],
  });

  // ── Nav form ───────────────────────────────────────────────────────────────
  readonly navForm: FormGroup = this.fb.group({ items: this.fb.array([]) });
  get navItemsArray(): FormArray { return this.navForm.get('items') as FormArray; }

  // ── Home form ──────────────────────────────────────────────────────────────
  readonly homeForm: FormGroup = this.fb.group({
    heroHeadline:    ['', Validators.required],
    heroSubheadline: [''],
    ctaLabel:        ['Read Posts'],
    ctaUrl:          ['/posts'],
  });

  // ── About form ─────────────────────────────────────────────────────────────
  readonly aboutForm: FormGroup = this.fb.group({
    headline:    ['', Validators.required],
    subheadline: [''],
    bio:         ['', Validators.required],
  });

  // ── Links forms ────────────────────────────────────────────────────────────
  readonly linksMetaForm: FormGroup = this.fb.group({
    headline: [''],
    bio:      [''],
  });
  readonly linksForm: FormGroup = this.fb.group({ links: this.fb.array([]) });
  get linksArray(): FormArray { return this.linksForm.get('links') as FormArray; }

  // ── Computed completion ────────────────────────────────────────────────────
  readonly aboutEnabled = computed(() => this.store.config()?.pages?.about?.enabled ?? false);
  readonly linksEnabled = computed(() => this.store.config()?.pages?.links?.enabled ?? false);

  readonly completedCount = computed(() =>
    STEPS.filter((s) => this.isComplete(s.id)).length,
  );
  readonly allStepsComplete = computed(() => this.completedCount() === STEPS.length);
  readonly progressPct = computed(() => (this.completedCount() / STEPS.length) * 100);

  readonly activeStepDef = computed(() => STEPS.find((s) => s.id === this.activeStep()));
  readonly activeStepIndex = computed(() => STEPS.findIndex((s) => s.id === this.activeStep()));
  readonly isLastStep = computed(() => this.activeStepIndex() === STEPS.length - 1);

  ngOnInit(): void {
    this.store.load();
    this.authorService.getAll().subscribe((list) => this.authors.set(list));

    // Wait for config to load then populate forms
    const poll = setInterval(() => {
      const config = this.store.config();
      if (!config) return;
      clearInterval(poll);
      this.populateForms();
    }, 50);
  }

  isComplete(stepId: StepId): boolean {
    const config = this.store.config();
    if (!config) return false;
    const acked = config.setupAcknowledgedSteps ?? [];
    switch (stepId) {
      case 'site':   return !!config.siteName?.trim();
      case 'author': return this.authors().length > 0;
      case 'nav':    return (config.nav?.length ?? 0) > 0;
      case 'home':   return !!config.pages?.home?.heroHeadline?.trim();
      case 'about':  return acked.includes('about');
      case 'links':  return acked.includes('links');
    }
  }

  isStepFormInvalid(): boolean {
    switch (this.activeStep()) {
      case 'site':   return this.siteForm.invalid;
      case 'author': return this.authors().length === 0 && this.authorForm.invalid;
      case 'nav':    return this.navItemsArray.length === 0;
      case 'home':   return this.homeForm.invalid;
      case 'about':  return this.aboutEnabled() && this.aboutForm.invalid;
      case 'links':  return false;
    }
  }

  goTo(step: StepId): void {
    this.stepSaveSuccess.set(false);
    this.activeStep.set(step);
  }

  onSaveAndContinue(): void {
    this.saveCurrentStep(() => {
      const nextIndex = this.activeStepIndex() + 1;
      if (nextIndex < STEPS.length) {
        this.activeStep.set(STEPS[nextIndex].id);
        this.stepSaveSuccess.set(false);
      }
    });
  }

  onSaveStep(): void {
    this.saveCurrentStep();
  }

  onFinishSetup(): void {
    this.store.completeSetup();
    this.router.navigate(['/posts']);
  }

  // ── Nav drag-drop ──────────────────────────────────────────────────────────
  onNavDrop(event: CdkDragDrop<FormGroup[]>): void {
    const arr = this.navItemsArray;
    const ctrl = arr.at(event.previousIndex);
    arr.removeAt(event.previousIndex);
    arr.insert(event.currentIndex, ctrl);
  }

  addNavItem(): void {
    this.navItemsArray.push(this.fb.group({ label: [''], url: [''] }));
  }

  removeNavItem(i: number): void { this.navItemsArray.removeAt(i); }

  // ── Links ──────────────────────────────────────────────────────────────────
  addLink(): void {
    this.linksArray.push(this.fb.group({
      platform: ['website'],
      label:    [''],
      url:      [''],
    }));
  }

  removeLink(i: number): void { this.linksArray.removeAt(i); }

  onAuthorPhotoSelected(files: FileList | null, target: 'light' | 'dark'): void {
    if (!files?.length) return;
    this.uploadAuthorPhoto(files[0], target);
    const inputRef = target === 'light' ? this.setupPhotoInput : this.setupPhotoDarkInput;
    if (inputRef?.nativeElement) {
      inputRef.nativeElement.value = '';
    }
  }

  onAboutEnabledChange(value: boolean): void {
    this.store.togglePageEnabled('about', value);
  }

  onLinksEnabledChange(value: boolean): void {
    this.store.togglePageEnabled('links', value);
  }

  // ── Private helpers ────────────────────────────────────────────────────────
  private uploadAuthorPhoto(file: File, target: 'light' | 'dark'): void {
    if (!this.storage) return;
    const folder = target === 'dark' ? 'photo-dark' : 'photo';
    const path = `authors/${this.authorTempId}/${folder}/${file.name}`;

    this.authorPhotoUploading.set(true);
    this.authorPhotoProgress.set(0);
    this.authorPhotoError.set(null);

    const fileRef = ref(this.storage, path);
    const task = uploadBytesResumable(fileRef, file);

    task.on(
      'state_changed',
      (snapshot) => {
        this.authorPhotoProgress.set(
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        );
      },
      (error) => {
        this.authorPhotoUploading.set(false);
        this.authorPhotoError.set(error.message);
      },
      () => {
        getDownloadURL(task.snapshot.ref).then((downloadUrl) => {
          if (target === 'light') {
            this.authorPhotoUrl.set(downloadUrl);
          } else {
            this.authorPhotoDarkUrl.set(downloadUrl);
          }
          this.authorPhotoUploading.set(false);
        });
      },
    );
  }

  private populateForms(): void {
    const config = this.store.config();
    if (!config) return;

    this.siteForm.patchValue({
      siteName:    config.siteName ?? '',
      siteUrl:     config.siteUrl ?? '',
      description: config.description ?? '',
    }, { emitEvent: false });

    // Nav
    this.navItemsArray.clear({ emitEvent: false });
    for (const item of config.nav ?? []) {
      this.navItemsArray.push(
        this.fb.group({ label: [item.label], url: [item.url] }),
        { emitEvent: false },
      );
    }
    // Pre-fill nav smart defaults if empty
    if (!this.navItemsArray.length) {
      [
        { label: 'Home', url: '/' },
        { label: 'Blog', url: '/posts' },
      ].forEach((item) => this.navItemsArray.push(this.fb.group(item)));
    }

    const home = config.pages?.home;
    this.homeForm.patchValue({
      heroHeadline:    home?.heroHeadline ?? '',
      heroSubheadline: home?.heroSubheadline ?? '',
      ctaLabel:        home?.ctaLabel ?? 'Read Posts',
      ctaUrl:          home?.ctaUrl ?? '/posts',
    }, { emitEvent: false });

    const about = config.pages?.about;
    this.aboutForm.patchValue({
      headline:    about?.headline ?? '',
      subheadline: about?.subheadline ?? '',
      bio:         about?.bio ?? '',
    }, { emitEvent: false });

    const links = config.pages?.links;
    this.linksMetaForm.patchValue({
      headline: links?.headline ?? '',
      bio:      links?.bio ?? '',
    }, { emitEvent: false });
    this.linksArray.clear({ emitEvent: false });
    for (const link of links?.links ?? []) {
      this.linksArray.push(this.fb.group({
        platform: [link.platform ?? 'website'],
        label:    [link.label],
        url:      [link.url],
      }), { emitEvent: false });
    }
  }

  private saveCurrentStep(onSuccess?: () => void): void {
    switch (this.activeStep()) {
      case 'site':   this.saveSiteStep(onSuccess);   break;
      case 'author': this.saveAuthorStep(onSuccess); break;
      case 'nav':    this.saveNavStep(onSuccess);    break;
      case 'home':   this.saveHomeStep(onSuccess);   break;
      case 'about':  this.saveAboutStep(onSuccess);  break;
      case 'links':  this.saveLinksStep(onSuccess);  break;
    }
  }

  private saveSiteStep(onSuccess?: () => void): void {
    const v = this.siteForm.value as { siteName: string; siteUrl: string; description: string };
    this.store.updateField('siteName', v.siteName);
    this.store.updateField('siteUrl', v.siteUrl);
    this.store.updateField('description', v.description || undefined);
    this.store.save();
    this.stepSaveSuccess.set(true);
    onSuccess?.();
  }

  private saveAuthorStep(onSuccess?: () => void): void {
    if (this.authors().length > 0) { onSuccess?.(); return; }
    if (this.authorForm.invalid) { this.authorForm.markAllAsTouched(); return; }
    const v = this.authorForm.value as { displayName: string; bio: string; email: string };
    this.authorSaveError.set(null);
    this.authorService
      .create({
        displayName: v.displayName,
        bio: v.bio || undefined,
        email: v.email || undefined,
        photoUrl: this.authorPhotoUrl() || undefined,
        photoUrlDark: this.authorPhotoDarkUrl() || undefined,
      })
      .subscribe({
        next: (author) => {
          this.authors.set([author]);
          // Set as default author in site config
          this.store.updateField('defaultAuthorId', author.id);
          this.store.save();
          this.stepSaveSuccess.set(true);
          onSuccess?.();
        },
        error: (err: unknown) => {
          this.authorSaveError.set(err instanceof Error ? err.message : 'Failed to create author');
        },
      });
  }

  private saveNavStep(onSuccess?: () => void): void {
    const items: NavItem[] = this.navItemsArray.value.map(
      (v: { label: string; url: string }, i: number) => ({ label: v.label, url: v.url, order: i }),
    );
    this.store.updateNav(items);
    this.store.save();
    this.stepSaveSuccess.set(true);
    onSuccess?.();
  }

  private saveHomeStep(onSuccess?: () => void): void {
    if (this.homeForm.invalid) { this.homeForm.markAllAsTouched(); return; }
    const v = this.homeForm.value as {
      heroHeadline: string; heroSubheadline: string; ctaLabel: string; ctaUrl: string;
    };
    this.store.updateHome({
      heroHeadline:    v.heroHeadline,
      heroSubheadline: v.heroSubheadline || undefined,
      ctaLabel:        v.ctaLabel || 'Read Posts',
      ctaUrl:          v.ctaUrl || '/posts',
    });
    this.store.save();
    this.stepSaveSuccess.set(true);
    onSuccess?.();
  }

  private saveAboutStep(onSuccess?: () => void): void {
    if (this.aboutEnabled() && this.aboutForm.invalid) {
      this.aboutForm.markAllAsTouched();
      return;
    }
    if (this.aboutEnabled()) {
      const v = this.aboutForm.value as { headline: string; subheadline: string; bio: string };
      this.store.updateAbout({
        headline:    v.headline,
        subheadline: v.subheadline || undefined,
        bio:         v.bio,
      });
    }
    this.store.acknowledgeStep('about');
    this.store.save();
    this.stepSaveSuccess.set(true);
    onSuccess?.();
  }

  private saveLinksStep(onSuccess?: () => void): void {
    if (this.linksEnabled()) {
      const meta = this.linksMetaForm.value as { headline: string; bio: string };
      const links = this.linksArray.value.map(
        (v: { platform: string; label: string; url: string }, i: number) => ({
          id:       `link-${i}`,
          label:    v.label,
          url:      v.url,
          platform: v.platform,
          order:    i,
        }),
      );
      this.store.updateLinks({ headline: meta.headline || undefined, bio: meta.bio || undefined, links });
    }
    this.store.acknowledgeStep('links');
    this.store.save();
    this.stepSaveSuccess.set(true);
    onSuccess?.();
  }
}
