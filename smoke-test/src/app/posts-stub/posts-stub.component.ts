import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import type { BlogPost } from '@foliokit/cms-core';
import { MarkdownComponent } from '@foliokit/cms-markdown';

const STUB_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'hello-foliokit',
    title: 'Hello FolioKit',
    subtitle: 'Getting started with the CMS',
    status: 'published',
    content: '## Welcome\n\nThis post is rendered by **@foliokit/cms-markdown**.\n\n- Zero Firestore required\n- Offline-friendly\n- Tokens resolved at runtime',
    excerpt: 'A smoke-test post exercising the FolioKit publishing stack.',
    tags: ['meta', 'smoke-test'],
    embeddedMedia: {},
    seo: { title: 'Hello FolioKit', description: 'Smoke test post.' },
    publishedAt: 1700000000000,
    updatedAt: 1700000000000,
    createdAt: 1700000000000,
  },
  {
    id: '2',
    slug: 'design-tokens',
    title: 'Design Token Contract',
    status: 'published',
    content: 'The `--bg`, `--surface-*`, `--text-*`, `--btn-*` and `--logo-*` CSS custom properties are shipped via `@foliokit/cms-ui/src/styles/tokens.css`.',
    tags: ['design-system'],
    embeddedMedia: {},
    seo: {},
    publishedAt: 1700100000000,
    updatedAt: 1700100000000,
    createdAt: 1700100000000,
  },
  {
    id: '3',
    slug: 'peer-dependencies',
    title: 'Peer Dependency Hygiene',
    status: 'draft',
    content: 'All four published libraries now declare complete `peerDependencies` matching Angular 21.2.x.',
    tags: ['packaging'],
    embeddedMedia: {},
    seo: {},
    publishedAt: 0,
    updatedAt: 1700200000000,
    createdAt: 1700200000000,
  },
];

@Component({
  selector: 'app-posts-stub',
  standalone: true,
  imports: [NgFor, MarkdownComponent],
  template: `
    <div class="posts-container">
      <h1>Posts Stub <small>(static, no Firestore)</small></h1>

      <div class="post-card" *ngFor="let post of posts">
        <div class="post-header">
          <span class="post-status" [attr.data-status]="post.status">{{ post.status }}</span>
          <h2>{{ post.title }}</h2>
          @if (post.subtitle) {
            <p class="subtitle">{{ post.subtitle }}</p>
          }
          <div class="tags">
            @for (tag of post.tags; track tag) {
              <span class="tag">{{ tag }}</span>
            }
          </div>
        </div>
        <div class="post-body">
          <folio-markdown [content]="post.content" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .posts-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { color: var(--text-primary); margin-bottom: 32px; }
    h1 small { font-size: 0.55em; color: var(--text-muted); }
    .post-card {
      background: var(--surface-0);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: 20px 24px;
      margin-bottom: 20px;
      box-shadow: var(--shadow-sm);
    }
    h2 { color: var(--text-primary); margin: 4px 0; }
    .subtitle { color: var(--text-secondary); margin: 0 0 8px; }
    .post-status {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: var(--r-sm);
      background: var(--surface-2);
      color: var(--text-muted);
    }
    .post-status[data-status="published"] {
      background: var(--green-100);
      color: var(--green-700);
    }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
    .tag {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: var(--r-2xl);
      background: var(--surface-2);
      color: var(--text-secondary);
    }
    .post-body { margin-top: 16px; border-top: 1px solid var(--border); padding-top: 16px; }
  `],
})
export class PostsStubComponent {
  readonly posts = STUB_POSTS;
}
