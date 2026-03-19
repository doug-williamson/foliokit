import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PostEditorStore } from '@foliokit/cms-admin-ui';

const SITE_URL = 'https://yoursite.com';

@Component({
  selector: 'folio-seo-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        color: #006621;
        line-height: 1.3;
      }
      .snippet-title {
        font-size: 18px;
        color: #1a0dab;
        line-height: 1.3;
        cursor: pointer;
        text-decoration: none;
      }
      .snippet-title:hover {
        text-decoration: underline;
      }
      .snippet-description {
        font-size: 13px;
        color: #545454;
        line-height: 1.58;
        margin-top: 2px;
      }
    `,
  ],
  template: `
    <div class="p-6">
      <p class="text-xs font-medium opacity-40 uppercase tracking-widest mb-4">
        SEO Preview
      </p>

      @if (store.post(); as post) {
        <div class="snippet">
          <div class="snippet-url">{{ siteUrl }}/blog/{{ post.slug || 'your-post-slug' }}</div>
          <a class="snippet-title block">
            {{ post.seo.title || post.title || 'Post title' }}
          </a>
          <p class="snippet-description">
            {{ post.seo.description || post.excerpt || 'No description provided. Add a meta description or excerpt to improve how this post appears in search results.' }}
          </p>
        </div>

        <!-- Character count hints -->
        <div class="mt-6 flex flex-col gap-2">
          <div class="text-xs opacity-50">
            <span
              [class.text-red-500]="(post.seo.title || post.title).length > 60"
            >
              Title: {{ (post.seo.title || post.title || '').length }} / 60 chars
            </span>
          </div>
          <div class="text-xs opacity-50">
            <span
              [class.text-red-500]="
                (post.seo.description || post.excerpt || '').length > 160
              "
            >
              Description:
              {{ (post.seo.description || post.excerpt || '').length }} / 160
              chars
            </span>
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
}
