import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DocsPageHeaderComponent,
  DocsCalloutComponent,
  DocsCodeBlockComponent,
} from '@foliokit/docs-ui';

const firestoreSchema = `// Firestore collections used by FolioKit

// Collection: site-config
// Document ID: your siteId (default: 'default')
{
  id: string;
  siteName: string;
  siteUrl: string;
  description?: string;
  nav: [
    { label: 'Home', url: '/', order: 1 },
    { label: 'Blog', url: '/posts', order: 2 },
  ],
  pages: {
    home: { enabled: true, heroHeadline: '...', ... },
    about: { enabled: true, headline: '...', bio: '...', ... },
    links: { enabled: true, links: [...], ... },
  },
  updatedAt: Timestamp,
}

// Collection: posts
{
  id: string;
  slug: string;
  title: string;
  status: 'published' | 'draft' | 'scheduled' | 'archived';
  content: string;        // Markdown
  tags: string[];
  authorId: string;
  embeddedMedia: {
    [token]: { token, storagePath, downloadUrl, alt, mimeType }
  },
  seo: { title, description, ogImage, ... },
  publishedAt: Timestamp;
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

// Collection: authors
{
  id: string;
  displayName: string;
  bio?: string;
  photoUrl?: string;
  email?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}`;

const securityRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Site config — public read, authenticated admin write
    match /site-config/{siteId} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.token.email == 'your-admin@example.com';
    }

    // Posts — public read for published, admin write
    match /posts/{postId} {
      allow read: if resource.data.status == 'published'
                  || request.auth != null;
      allow write: if request.auth != null;
    }

    // Authors — public read, admin write
    match /authors/{authorId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`;

const environmentCode = `// src/environments/environment.ts
export const environment = {
  firebase: {
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:0000000000000000',
  },
};`;

const providerCode = `// app.config.ts
import { provideFolioKit } from '@foliokit/cms-core';
import { environment } from '../environments/environment';

provideFolioKit({
  firebaseConfig: environment.firebase,
  siteId: 'default',     // matches the site-config document ID
  useEmulator: false,    // set true for local development
})`;

@Component({
  selector: 'docs-firebase-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DocsPageHeaderComponent,
    DocsCalloutComponent,
    DocsCodeBlockComponent,
  ],
  template: `
    <docs-page-header />

    <section>
      <h2 id="project-setup" class="mat-headline-small">Firebase Project Setup</h2>
      <p class="mat-body-medium">
        FolioKit uses the Firebase JS SDK directly (not <code>&#64;angular/fire</code>). You need:
      </p>
      <ul class="mat-body-medium mt-2 list-disc pl-6 space-y-1">
        <li><strong>Firestore</strong> — stores posts, site config, and authors</li>
        <li><strong>Firebase Storage</strong> — stores uploaded images and media</li>
        <li><strong>Firebase Auth</strong> — admin authentication (email/password or Google)</li>
        <li><strong>Firebase Hosting</strong> — optional, for deploying your site</li>
      </ul>
      <docs-callout variant="info">
        Create a project at
        <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">
          console.firebase.google.com</a>.
        Enable Firestore, Storage, and Authentication in the console before proceeding.
      </docs-callout>
    </section>

    <section class="mt-8">
      <h2 id="environment" class="mat-headline-small">Environment Configuration</h2>
      <p class="mat-body-medium">
        Copy your Firebase config from the console (Project Settings → Your apps → SDK setup)
        into an environment file:
      </p>
      <docs-code-block [code]="environmentCode" language="typescript" />
      <p class="mat-body-medium mt-4">
        Wire it into <code>provideFolioKit()</code>:
      </p>
      <docs-code-block [code]="providerCode" language="typescript" />
    </section>

    <section class="mt-8">
      <h2 id="firestore-schema" class="mat-headline-small">Firestore Schema</h2>
      <p class="mat-body-medium">
        FolioKit reads from three Firestore collections. Create them manually in the
        console or let the admin UI create documents on first use:
      </p>
      <docs-code-block [code]="firestoreSchema" language="typescript" />
    </section>

    <section class="mt-8">
      <h2 id="security-rules" class="mat-headline-small">Security Rules Starter</h2>
      <p class="mat-body-medium">
        Copy these rules into <code>firestore.rules</code> and deploy with
        <code>firebase deploy --only firestore:rules</code>. Replace
        <code>your-admin&#64;example.com</code> with your actual admin email:
      </p>
      <docs-code-block [code]="securityRules" language="typescript" />
      <docs-callout variant="warning">
        These rules are a starting point. For production, implement proper role-based
        access control — do not rely on email-matching alone.
      </docs-callout>
    </section>

    <section class="mt-8">
      <h2 id="emulator" class="mat-headline-small">Local Emulator</h2>
      <p class="mat-body-medium">
        For local development, set <code>useEmulator: true</code> in your
        <code>FolioKitConfig</code>. This connects to the Firebase emulator suite:
      </p>
      <ul class="mat-body-medium mt-2 list-disc pl-6 space-y-1">
        <li>Firestore → <code>127.0.0.1:8080</code></li>
        <li>Storage → <code>127.0.0.1:9199</code></li>
        <li>Auth → <code>http://127.0.0.1:9099</code></li>
      </ul>
    </section>
  `,
})
export class FirebasePageComponent {
  protected readonly firestoreSchema = firestoreSchema;
  protected readonly securityRules = securityRules;
  protected readonly environmentCode = environmentCode;
  protected readonly providerCode = providerCode;
}
