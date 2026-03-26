import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { PostEditorStore } from '@foliokit/cms-admin-ui';

const SITE_URL = 'https://blog.foliokitcms.com';
const DISPLAY_DOMAIN = 'foliokitcms.com';

@Component({
  selector: 'folio-seo-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SlicePipe],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
      }
      .snippet {
        font-family: arial, sans-serif;
        max-width: 600px;
      }
      .snippet-url {
        font-size: 12px;
        color: #1a6e39;
        line-height: 1.3;
      }
      .snippet-title {
        font-size: 20px;
        color: #1a0dab;
        line-height: 1.3;
        cursor: pointer;
        text-decoration: none;
      }
      .snippet-title:hover {
        text-decoration: underline;
      }
      .snippet-description {
        font-size: 14px;
        color: #3c4043;
        line-height: 1.58;
        margin-top: 2px;
      }
      .og-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
        max-width: 500px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .og-card-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        display: block;
      }
      .og-card-placeholder {
        width: 100%;
        height: 200px;
        background: #f1f3f4;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .og-card-body {
        padding: 12px;
        background: #fff;
      }
      .og-card-domain {
        font-size: 11px;
        color: #8a8a8a;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .og-card-title {
        font-size: 15px;
        font-weight: 600;
        color: #1c1e21;
        margin-top: 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .og-card-description {
        font-size: 13px;
        color: #606770;
        margin-top: 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
  template: `
    <div class="p-6">
      @if (store.post(); as post) {

        <!-- A: Google SERP Snippet -->
        <p class="text-xs font-medium opacity-40 uppercase tracking-widest mb-4">
          Search Result Preview
        </p>
        <div class="snippet">
          <div class="snippet-url">
            {{ displayDomain }} › posts › {{ post.slug || 'your-post-slug' }}
          </div>
          <a class="snippet-title block">
            {{ post.seo.title || post.title || 'Post title' }}
          </a>
          <p class="snippet-description">
            {{ (post.seo.description || post.excerpt || 'No description provided. Add a meta description or excerpt to improve how this post appears in search results.') | slice: 0 : 155 }}
          </p>
        </div>

        <!-- Character count hints -->
        <div class="mt-4 flex flex-col gap-1">
          <div class="text-xs opacity-50">
            <span [class.text-red-500]="(post.seo.title || post.title || '').length > 60">
              Title: {{ (post.seo.title || post.title || '').length }} / 60 chars
            </span>
          </div>
          <div class="text-xs opacity-50">
            <span
              [class.text-red-500]="(post.seo.description || post.excerpt || '').length > 160"
            >
              Description: {{ (post.seo.description || post.excerpt || '').length }} / 160 chars
            </span>
          </div>
        </div>

        <!-- B: Social Share / OG Card -->
        <p class="text-xs font-medium opacity-40 uppercase tracking-widest mt-10 mb-4">
          Social Share Preview
        </p>
        <div class="og-card">
          @if (post.seo.ogImage || post.thumbnailUrl) {
            <img
              class="og-card-image"
              [src]="post.seo.ogImage || post.thumbnailUrl"
              alt=""
            />
          } @else {
            <div class="og-card-placeholder">
              <span class="text-xs" style="color: #8a8a8a">No image — set a thumbnail or OG Image Override</span>
            </div>
          }
          <div class="og-card-body">
            <p class="og-card-domain">{{ displayDomain }}</p>
            <p class="og-card-title">{{ post.seo.title || post.title || 'Post title' }}</p>
            @if (post.seo.description || post.excerpt) {
              <p class="og-card-description">{{ post.seo.description || post.excerpt }}</p>
            }
          </div>
        </div>

      } @else {
        <p class="opacity-40 text-sm">No post loaded.</p>
      }
    </div>
  `,
})
export class SeoPreviewComponent {
  readonly store = inject(PostEditorStore);
  readonly siteUrl = SITE_URL;
  readonly displayDomain = DISPLAY_DOMAIN;
}
