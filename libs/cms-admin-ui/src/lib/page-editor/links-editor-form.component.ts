import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import type { LinksLink, LinksPageConfig } from '@foliokit/cms-core';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';

const PLATFORM_OPTIONS: LinksLink['platform'][] = [
  'twitter',
  'instagram',
  'github',
  'linkedin',
  'youtube',
  'tiktok',
  'facebook',
  'email',
  'website',
];

@Component({
  selector: 'admin-links-editor-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    DragDropModule,
  ],
  styles: [
    `
      :host {
        display: block;
      }
      .drag-handle {
        cursor: grab;
        touch-action: none;
      }
      .drag-handle:active { cursor: grabbing; }
      .cdk-drag-preview {
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        border-radius: 8px;
        opacity: 0.95;
      }
      .cdk-drag-placeholder { opacity: 0.3; }
      .cdk-drag-animating { transition: transform 250ms cubic-bezier(0,0,0.2,1); }
      .drop-zone { border: 2px dashed color-mix(in srgb, currentColor 25%, transparent); border-radius: 8px; }
      .drop-zone.drag-over {
        border-color: var(--mat-sys-primary);
        background: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
      }
    `,
  ],
  template: `
    @if (linksConfig(); as cfg) {
      <div class="flex flex-col gap-6">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Title</mat-label>
          <input
            matInput
            [value]="cfg.title ?? ''"
            (input)="updateField('title', $any($event.target).value)"
            placeholder="Links"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Headline</mat-label>
          <input
            matInput
            [value]="cfg.headline ?? ''"
            (input)="updateField('headline', $any($event.target).value)"
            placeholder="Your name or tagline"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Bio</mat-label>
          <textarea
            matInput
            rows="4"
            [value]="cfg.bio ?? ''"
            (input)="updateField('bio', $any($event.target).value)"
            placeholder="Short bio shown below your headline"
          ></textarea>
        </mat-form-field>

        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold">Links</span>
            <button mat-stroked-button (click)="addLink(cfg.links ?? [])">
              <mat-icon svgIcon="add" />
              Add Link
            </button>
          </div>

          <div
            cdkDropList
            (cdkDropListDropped)="onDrop($event, cfg.links ?? [])"
            class="flex flex-col gap-2"
          >
            @for (link of cfg.links ?? []; track link.id) {
              <div
                cdkDrag
                class="flex flex-col gap-3 p-3 rounded-lg"
                style="background: color-mix(in srgb, currentColor 5%, transparent); border: 1px solid color-mix(in srgb, currentColor 10%, transparent)"
              >
                <div class="flex items-center gap-2">
                  <mat-icon cdkDragHandle class="drag-handle opacity-40 shrink-0" style="font-size: 1.25rem; width: 1.25rem; height: 1.25rem" svgIcon="drag_indicator" />
                  <span class="flex-1 text-sm font-medium truncate">{{ link.label || '(untitled)' }}</span>
                  <mat-slide-toggle
                    [checked]="!!link.highlighted"
                    (change)="updateLink(cfg.links ?? [], link.id, 'highlighted', $event.checked)"
                    class="shrink-0"
                    matTooltip="Highlighted"
                  />
                  <button mat-icon-button (click)="deleteLink(cfg.links ?? [], link.id)" title="Delete link">
                    <mat-icon svgIcon="delete" />
                  </button>
                </div>

                <div class="flex gap-3">
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Label</mat-label>
                    <input
                      matInput
                      [value]="link.label"
                      (input)="updateLink(cfg.links ?? [], link.id, 'label', $any($event.target).value)"
                      placeholder="My Website"
                    />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>URL</mat-label>
                    <input
                      matInput
                      type="url"
                      [value]="link.url"
                      (input)="updateLink(cfg.links ?? [], link.id, 'url', $any($event.target).value)"
                      placeholder="https://example.com"
                    />
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Platform</mat-label>
                  <mat-select
                    [value]="link.platform ?? null"
                    (selectionChange)="updateLink(cfg.links ?? [], link.id, 'platform', $event.value)"
                  >
                    <mat-option [value]="null">— none —</mat-option>
                    @for (p of platformOptions; track p) {
                      <mat-option [value]="p">{{ p }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            }

            @if (!(cfg.links ?? []).length) {
              <div class="flex items-center justify-center py-8 opacity-40 text-sm">
                No links yet. Add one above.
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class LinksEditorFormComponent {
  readonly store = inject(SiteConfigEditorStore);

  readonly platformOptions = PLATFORM_OPTIONS;

  readonly linksConfig = () => this.store.config()?.pages?.links;

  private flush(partial: Partial<Omit<LinksPageConfig, 'enabled'>>): void {
    const current = this.store.config()?.pages?.links;
    if (!current) return;
    this.store.updateLinks({ ...current, ...partial });
  }

  updateField(field: keyof Omit<LinksPageConfig, 'enabled' | 'links'>, value: string | undefined): void {
    this.flush({ [field]: value || undefined });
  }

  addLink(links: LinksLink[]): void {
    const newLink: LinksLink = {
      id: crypto.randomUUID(),
      label: '',
      url: '',
      order: links.length,
    };
    this.flush({ links: [...links, newLink] });
  }

  deleteLink(links: LinksLink[], id: string): void {
    const updated = links
      .filter((l) => l.id !== id)
      .map((l, i) => ({ ...l, order: i }));
    this.flush({ links: updated });
  }

  updateLink<K extends keyof LinksLink>(
    links: LinksLink[],
    id: string,
    field: K,
    value: LinksLink[K],
  ): void {
    const updated = links.map((l) =>
      l.id === id ? { ...l, [field]: value } : l,
    );
    this.flush({ links: updated });
  }

  onDrop(event: CdkDragDrop<LinksLink[]>, links: LinksLink[]): void {
    const reordered = [...links];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    const withOrder = reordered.map((l, i) => ({ ...l, order: i }));
    this.flush({ links: withOrder });
  }
}
