"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ngAdd = ngAdd;
const dependencies_1 = require("@schematics/angular/utility/dependencies");
// ── Helpers ───────────────────────────────────────────────────────────────────
function getSourceRoot(tree, project) {
    if (!tree.exists('angular.json')) {
        return 'src';
    }
    const workspace = JSON.parse(tree.read('angular.json').toString('utf-8'));
    const projectName = project || workspace.defaultProject || Object.keys(workspace.projects)[0];
    const proj = workspace.projects[projectName];
    if (!proj) {
        return 'src';
    }
    return proj.sourceRoot || `${proj.root}/src` || 'src';
}
function getProjectName(tree, project) {
    if (!tree.exists('angular.json')) {
        return 'my-app';
    }
    const workspace = JSON.parse(tree.read('angular.json').toString('utf-8'));
    return project || workspace.defaultProject || Object.keys(workspace.projects)[0] || 'my-app';
}
function getOwnVersion() {
    // Read version from the published package.json (two levels up from ng-add/index.js)
    try {
        const pkg = require('../../package.json');
        return pkg.version || '0.0.0';
    }
    catch {
        return '0.0.0';
    }
}
// ── File templates ────────────────────────────────────────────────────────────
const ENVIRONMENT_TS = `export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: '<YOUR_API_KEY>',
    authDomain: '<YOUR_PROJECT_ID>.firebaseapp.com',
    projectId: '<YOUR_PROJECT_ID>',
    storageBucket: '<YOUR_PROJECT_ID>.appspot.com',
    messagingSenderId: '<YOUR_MESSAGING_SENDER_ID>',
    appId: '<YOUR_APP_ID>',
  },
};
`;
function appRoutsTs() {
    return `import { Routes } from '@angular/router';
import { FOLIO_BLOG_ROUTES } from '@foliokit/cms-core';

export const routes: Routes = [
  { path: '', children: [...FOLIO_BLOG_ROUTES] },
  { path: '**', redirectTo: '' },
];
`;
}
function appConfigTs(tenantId, appName) {
    return `import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { providesFolioKit } from '@foliokit/cms-core';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    providesFolioKit({
      firebase: environment.firebaseConfig,
      tenantId: '${tenantId}',
      shell: {
        appName: '${appName}',
        nav: [
          { label: 'Home', route: '/' },
          { label: 'About', route: '/about' },
          { label: 'Links', route: '/links' },
        ],
      },
    }),
  ],
};
`;
}
function firebaseJson(projectName) {
    return JSON.stringify({
        hosting: [
            {
                target: 'blog',
                public: `dist/${projectName}/browser`,
                ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
                rewrites: [{ source: '**', destination: '/index.html' }],
            },
        ],
    }, null, 2) + '\n';
}
function firebaseRc(firebaseProject) {
    const id = firebaseProject || '<YOUR_FIREBASE_PROJECT_ID>';
    return JSON.stringify({
        projects: {
            default: id,
        },
        targets: {
            [id]: {
                hosting: {
                    blog: [id],
                },
            },
        },
    }, null, 2) + '\n';
}
// ── Setup checklist ───────────────────────────────────────────────────────────
function printSummary(context, generated, skipped) {
    context.logger.info('');
    context.logger.info('╔══════════════════════════════════════════════════════════╗');
    context.logger.info('║           FolioKit CMS — Setup Complete                 ║');
    context.logger.info('╚══════════════════════════════════════════════════════════╝');
    context.logger.info('');
    if (generated.length) {
        context.logger.info('  Generated:');
        for (const f of generated) {
            context.logger.info(`    ✔  ${f}`);
        }
    }
    if (skipped.length) {
        context.logger.info('  Skipped (already exists):');
        for (const f of skipped) {
            context.logger.info(`    ·  ${f}`);
        }
    }
    context.logger.info('');
    context.logger.info('  Next steps:');
    context.logger.info('  1. Fill in environment.ts with your Firebase credentials.');
    context.logger.info('  2. Update firebase.json public path if using SSR (change to /functions).');
    context.logger.info('  3. Run: firebase use <project-id>');
    context.logger.info('  4. Run: ng serve');
    context.logger.info('');
}
// ── Rule factory ──────────────────────────────────────────────────────────────
function ngAdd(options) {
    return (tree, context) => {
        const sourceRoot = getSourceRoot(tree, options.project);
        const projectName = getProjectName(tree, options.project);
        const tenantId = options.tenantId || 'default';
        const appName = options.appName || 'My Blog';
        const firebaseProject = options.firebaseProject || '';
        const generated = [];
        const skipped = [];
        // ── Step 1: environment.ts ──────────────────────────────────────────────
        const envPath = `${sourceRoot}/environments/environment.ts`;
        if (tree.exists(envPath)) {
            skipped.push(envPath);
            context.logger.warn(`⚠  ${envPath} already exists — skipped.`);
        }
        else {
            tree.create(envPath, ENVIRONMENT_TS);
            generated.push(envPath);
            context.logger.warn('⚠  Replace placeholder values in environment.ts with your Firebase project credentials before running the app.');
        }
        // ── Step 2: app.routes.ts ───────────────────────────────────────────────
        const routesPath = `${sourceRoot}/app/app.routes.ts`;
        if (tree.exists(routesPath)) {
            skipped.push(routesPath);
            context.logger.warn(`⚠  ${routesPath} already exists — overwriting with FolioKit routes.`);
            tree.overwrite(routesPath, appRoutsTs());
            generated.push(routesPath);
        }
        else {
            tree.create(routesPath, appRoutsTs());
            generated.push(routesPath);
        }
        // ── Step 3: app.config.ts ───────────────────────────────────────────────
        const configPath = `${sourceRoot}/app/app.config.ts`;
        if (tree.exists(configPath)) {
            skipped.push(configPath);
            context.logger.warn(`⚠  ${configPath} already exists — overwriting with FolioKit config.`);
            tree.overwrite(configPath, appConfigTs(tenantId, appName));
            generated.push(configPath);
        }
        else {
            tree.create(configPath, appConfigTs(tenantId, appName));
            generated.push(configPath);
        }
        // ── Step 4: firebase.json ───────────────────────────────────────────────
        const firebaseJsonPath = 'firebase.json';
        if (tree.exists(firebaseJsonPath)) {
            skipped.push(firebaseJsonPath);
            context.logger.warn(`⚠  ${firebaseJsonPath} already exists — skipped.`);
        }
        else {
            tree.create(firebaseJsonPath, firebaseJson(projectName));
            generated.push(firebaseJsonPath);
        }
        // ── Step 5: .firebaserc ─────────────────────────────────────────────────
        const firebaseRcPath = '.firebaserc';
        if (tree.exists(firebaseRcPath)) {
            skipped.push(firebaseRcPath);
            context.logger.warn(`⚠  ${firebaseRcPath} already exists — skipped.`);
        }
        else {
            tree.create(firebaseRcPath, firebaseRc(firebaseProject));
            generated.push(firebaseRcPath);
            if (!firebaseProject) {
                context.logger.warn('⚠  .firebaserc was generated with placeholder values. Update with your Firebase project ID.');
            }
        }
        // ── Step 6: Add package dependency ──────────────────────────────────────
        (0, dependencies_1.addPackageJsonDependency)(tree, {
            type: dependencies_1.NodeDependencyType.Default,
            name: '@foliokit/cms-core',
            version: `^${getOwnVersion()}`,
        });
        // ── Step 7: Print summary ───────────────────────────────────────────────
        printSummary(context, generated, skipped);
        return tree;
    };
}
//# sourceMappingURL=index.js.map