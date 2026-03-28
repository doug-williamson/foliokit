"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ngAdd = ngAdd;
// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Insert a line into a TypeScript source file's providers array.
 * Finds `providers: [` and inserts `line` before the closing `]`.
 * Returns the modified source, or null if the pattern was not found.
 */
function insertIntoProviders(source, line) {
    // Match `providers: [` with optional whitespace/newlines, capture until `]`
    const match = source.match(/providers\s*:\s*\[([^\]]*)\]/s);
    if (!match)
        return null;
    const existing = match[1];
    const trimmed = existing.trimEnd();
    const hasTrailingComma = trimmed.endsWith(',');
    const prefix = hasTrailingComma ? '' : ',';
    const replacement = `providers: [${trimmed}${prefix}\n    ${line},\n  ]`;
    return source.replace(/providers\s*:\s*\[([^\]]*)\]/s, replacement);
}
/**
 * Add an import statement to the top of a TypeScript file.
 * If the named symbol is already imported from the same specifier, skip.
 */
function addImport(source, symbols, from) {
    if (source.includes(`from '${from}'`) || source.includes(`from "${from}"`)) {
        // Specifier already imported — merge symbols (simplistic: just check presence)
        for (const sym of symbols.split(',').map((s) => s.trim())) {
            if (!source.includes(sym)) {
                // Symbol missing from existing import — patch it in
                source = source.replace(new RegExp(`(from ['"]${from.replace('/', '\\/')}['"])`), (_, end) => {
                    const importMatch = source.match(new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${from.replace('/', '\\/')}['"]`));
                    if (!importMatch)
                        return end;
                    return `} from '${from}'`;
                });
            }
        }
        return source;
    }
    // Prepend new import after any existing imports, or at top
    const lastImportIdx = source.lastIndexOf('import ');
    const insertAt = lastImportIdx !== -1 ? source.indexOf('\n', lastImportIdx) + 1 : 0;
    return source.slice(0, insertAt) + `import { ${symbols} } from '${from}';\n` + source.slice(insertAt);
}
// ── Env example content ───────────────────────────────────────────────────────
const ENV_EXAMPLE = `# FolioKit — Firebase configuration
# Copy this file to .env and fill in the values from your Firebase console:
# Project Settings → Your apps → SDK setup and configuration
#
# Build-time variables (inlined by @ngx-env/builder — safe to commit .env.example)
NG_APP_FIREBASE_API_KEY=
NG_APP_FIREBASE_AUTH_DOMAIN=
NG_APP_FIREBASE_PROJECT_ID=
NG_APP_FIREBASE_STORAGE_BUCKET=
NG_APP_FIREBASE_MESSAGING_SENDER_ID=
NG_APP_FIREBASE_APP_ID=

# Runtime variable — required by the blog SSR server (not the admin app)
FIREBASE_PROJECT_ID=
`;
// ── Setup checklist ───────────────────────────────────────────────────────────
function printChecklist(context, adminEmail) {
    context.logger.info('');
    context.logger.info('╔══════════════════════════════════════════════════════════╗');
    context.logger.info('║         FolioKit Admin UI — Setup Checklist             ║');
    context.logger.info('╚══════════════════════════════════════════════════════════╝');
    context.logger.info('');
    context.logger.info('  ☐ 1. Fill in .env with your Firebase credentials:');
    context.logger.info('       cp .env.example .env   # then edit with your values');
    context.logger.info('');
    context.logger.info(`  ☐ 2. Confirm adminEmail is set in your environment config:`);
    context.logger.info(`       adminEmail: '${adminEmail}'`);
    context.logger.info('');
    context.logger.info('  ☐ 3. Update firestore.rules — replace YOUR_ADMIN_EMAIL:');
    context.logger.info(`       request.auth.token.email == '${adminEmail}'`);
    context.logger.info('       Then deploy: firebase deploy --only firestore:rules');
    context.logger.info('');
    context.logger.info('  ☐ 4. Start the Firebase emulator and seed test data:');
    context.logger.info('       npm run emulator   # in one terminal');
    context.logger.info('       npm run seed       # in another terminal');
    context.logger.info('');
    context.logger.info('  ☐ 5. Start the dev server:');
    context.logger.info('       ng serve');
    context.logger.info('');
    context.logger.info('  📖 Full setup guide: docs/recipes/environment-setup.md');
    context.logger.info('  🔒 Security model:   docs/security/admin-authorization.md');
    context.logger.info('');
}
// ── Rule factory ──────────────────────────────────────────────────────────────
function ngAdd(options) {
    return (tree, context) => {
        const { adminEmail } = options;
        // ── 1. Locate app.config.ts ─────────────────────────────────────────────
        const configCandidates = [
            'src/app/app.config.ts',
            'projects/' + (options.project ?? '') + '/src/app/app.config.ts',
        ];
        let configPath = null;
        for (const candidate of configCandidates) {
            if (tree.exists(candidate)) {
                configPath = candidate;
                break;
            }
        }
        if (!configPath) {
            context.logger.warn('⚠  Could not locate app.config.ts. Please add the following providers manually:\n' +
                "     provideRouter(adminRoutes, withComponentInputBinding()),\n" +
                `     provideAdminKit({ adminEmail: '${adminEmail}' }),`);
        }
        else {
            // ── 2. Patch app.config.ts ───────────────────────────────────────────
            const configBuffer = tree.read(configPath);
            if (configBuffer) {
                let source = configBuffer.toString('utf-8');
                // Add imports
                source = addImport(source, 'provideRouter, withComponentInputBinding', '@angular/router');
                source = addImport(source, 'adminRoutes, provideAdminKit', '@foliokit/cms-admin-ui');
                source = addImport(source, 'provideFolioKit', '@foliokit/cms-core');
                // Inject providers
                let patched = insertIntoProviders(source, `provideRouter(adminRoutes, withComponentInputBinding())`);
                if (patched)
                    source = patched;
                patched = insertIntoProviders(source, `provideAdminKit({ adminEmail: '${adminEmail}' })`);
                if (patched)
                    source = patched;
                patched = insertIntoProviders(source, `provideFolioKit({ firebaseConfig: { /* paste from environment.ts */ } })`);
                if (patched)
                    source = patched;
                tree.overwrite(configPath, source);
                context.logger.info(`✔  Updated ${configPath}`);
            }
        }
        // ── 3. Create .env.example ───────────────────────────────────────────────
        if (!tree.exists('.env.example')) {
            tree.create('.env.example', ENV_EXAMPLE);
            context.logger.info('✔  Created .env.example');
        }
        else {
            context.logger.info('   .env.example already exists — skipped');
        }
        // ── 4. Print setup checklist ─────────────────────────────────────────────
        printChecklist(context, adminEmail);
        return tree;
    };
}
//# sourceMappingURL=index.js.map