import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const skipped = new Set([
  'node_modules',
  'dist',
  '.git',
  'coverage',
  '.turbo',
  'playwright-report',
]);
const presets = new Set(['web', 'bff', 'bff-auth']);
const devSecrets = {
  session: 'development-only-session-secret-change',
  encryptionKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  oidcClient: 'dev-only-client-secret-change-me-32b',
};

const args = readArgs(process.argv.slice(2));
const packageJsonPath = path.join(root, 'package.json');
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

if (!packageJson.scripts?.['create-project']) {
  output.write('Project bootstrap already ran.\n');
  process.exit(0);
}

const answers = args.yes
  ? { name: args.name, scope: args.scope, preset: args.preset || 'web' }
  : await ask();
const name = answers.name?.trim();
const scope = answers.scope?.trim();
const preset = answers.preset?.trim() || 'web';

if (!name || !/^[a-z][a-z0-9-]*$/.test(scope ?? '') || !presets.has(preset)) {
  throw new Error(
    'Provide a project name, a scope matching ^[a-z][a-z0-9-]*$, and preset web, bff or bff-auth.',
  );
}

const features = { bff: preset !== 'web', auth: preset === 'bff-auth' };
const secrets = {
  session: randomBytes(32).toString('base64url'),
  encryptionKey: randomBytes(32).toString('base64'),
  oidcClient: randomBytes(24).toString('base64url'),
};

await walk(root, async file => {
  const raw = await readFile(file);
  if (raw.includes(0)) return;
  const text = raw.toString('utf8');
  if (text.includes('@sample-file')) {
    await rm(file);
    return;
  }
  let next = text;
  if (!features.auth) next = stripMarker(next, 'feature-auth');
  if (!features.bff) next = stripMarker(next, 'feature-bff');
  next = stripMarker(next, 'sample')
    .split('@react-template')
    .join(`@${scope}`)
    .split('React Template')
    .join(name);
  if (next !== text) await writeFile(file, next);
});

for (const relative of removalPaths(features)) {
  await rm(path.join(root, relative), { recursive: true, force: true });
}

if (features.bff)
  await writeEnv('apps/bff/.env.example', 'apps/bff/.env', secrets);
await writeEnv('apps/web/.env.example', 'apps/web/.env', secrets);
if (features.auth) await writeRealmSecret(secrets.oidcClient);
await editPackages(scope, features);
await generateRoutes();
run('pnpm', ['install']);
run('pnpm', ['lint']);
run('pnpm', ['typecheck']);
run('pnpm', ['test']);
run('pnpm', ['build']);

const updated = JSON.parse(await readFile(packageJsonPath, 'utf8'));
delete updated.scripts['create-project'];
await writeFile(packageJsonPath, `${JSON.stringify(updated, null, 2)}\n`);
await rm(path.join(root, 'scripts/create-project.mjs'), { force: true });
output.write(`Bootstrapped ${name} as @${scope} with preset ${preset}.\n`);

function removalPaths(selected) {
  const paths = ['docs/adr/0011-presets.md'];
  if (!selected.auth) {
    paths.push(
      'apps/web/src/features/auth',
      'apps/web/src/routes/_authenticated.tsx',
      'apps/web/src/routes/_authenticated',
      'apps/bff/src/auth',
      'apps/bff/src/config/auth-env.ts',
      'docker/keycloak',
      'docs/guides/add-protected-route.md',
      'docs/adr/0004-oidc-session.md',
    );
  }
  if (!selected.bff) {
    paths.push(
      'apps/bff',
      'apps/web/src/shared/lib/bff-client.ts',
      'docker/bff.Dockerfile',
      'docker/keycloak',
      'docs/guides/add-upstream.md',
      'docs/guides/add-protected-route.md',
      'docs/adr/0002-spa-bff.md',
      'docs/adr/0003-hono.md',
      'docs/adr/0004-oidc-session.md',
      'docs/adr/0006-explicit-routes.md',
      'docs/adr/0007-same-origin.md',
      'docs/adr/0008-openapi-types.md',
      'docs/adr/0010-winston.md',
    );
  }
  return paths;
}

function stripMarker(text, name) {
  const patterns = [
    new RegExp(
      `^[ \\t]*/\\*[^*]*@${name}-start[\\s\\S]*?@${name}-end[^*]*\\*/\\n?`,
      'gm',
    ),
    new RegExp(
      `^[ \\t]*\\{/\\*\\s*@${name}-start\\s*\\*/\\}[\\s\\S]*?\\{/\\*\\s*@${name}-end\\s*\\*/\\}\\n?`,
      'gm',
    ),
    new RegExp(`^[ \\t]*// @${name}-start[\\s\\S]*?// @${name}-end\\n?`, 'gm'),
    new RegExp(`^[ \\t]*# @${name}-start[\\s\\S]*?# @${name}-end\\n?`, 'gm'),
    new RegExp(
      `^[ \\t]*<!--\\s*@${name}-start\\s*-->[\\s\\S]*?<!--\\s*@${name}-end\\s*-->\\n?`,
      'gm',
    ),
    new RegExp(
      `^[ \\t]*\\[\\/\\/\\]: # \\(@${name}-start\\)[\\s\\S]*?\\[\\/\\/\\]: # \\(@${name}-end\\)\\n?`,
      'gm',
    ),
  ];
  return patterns.reduce(
    (current, pattern) => current.replace(pattern, ''),
    text,
  );
}

async function walk(directory, visit) {
  const entries = await readdir(directory);
  for (const entry of entries) {
    if (skipped.has(entry)) continue;
    const full = path.join(directory, entry);
    const info = await stat(full);
    if (full === path.join(root, 'scripts/create-project.mjs')) continue;
    if (info.isDirectory()) await walk(full, visit);
    else if (info.isFile()) await visit(full);
  }
}

async function writeEnv(examplePath, targetPath, generated) {
  const example = await readFile(path.join(root, examplePath), 'utf8');
  const contents = example
    .split(devSecrets.session)
    .join(generated.session)
    .split(devSecrets.encryptionKey)
    .join(generated.encryptionKey)
    .split(devSecrets.oidcClient)
    .join(generated.oidcClient);
  await writeFile(path.join(root, targetPath), contents);
}

async function writeRealmSecret(secret) {
  const realmPath = path.join(root, 'docker/keycloak/realm-sample.json');
  const text = await readFile(realmPath, 'utf8');
  await writeFile(realmPath, text.split(devSecrets.oidcClient).join(secret));
}

async function editPackages(scope, selected) {
  const rootPackage = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  rootPackage.name = scope;
  if (!selected.bff) delete rootPackage.scripts['gen:upstreams'];
  await writeFile(packageJsonPath, `${JSON.stringify(rootPackage, null, 2)}\n`);

  const webPath = path.join(root, 'apps/web/package.json');
  const webPackage = JSON.parse(await readFile(webPath, 'utf8'));
  if (!selected.bff) delete webPackage.dependencies[`@${scope}/bff`];
  await writeFile(webPath, `${JSON.stringify(webPackage, null, 2)}\n`);

  if (!selected.bff || selected.auth) return;
  const bffPath = path.join(root, 'apps/bff/package.json');
  const bffPackage = JSON.parse(await readFile(bffPath, 'utf8'));
  delete bffPackage.dependencies['openid-client'];
  delete bffPackage.dependencies['ioredis'];
  await writeFile(bffPath, `${JSON.stringify(bffPackage, null, 2)}\n`);
}

function generateRoutes() {
  run('pnpm', ['--dir', 'apps/web', 'exec', 'tsr', 'generate']);
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${commandArgs.join(' ')} failed. Start again from a clean template.`,
    );
  }
}

async function ask() {
  const rl = createInterface({ input, output });
  const projectName = await rl.question('Project name: ');
  const projectScope = await rl.question('Package scope (lowercase, no @): ');
  const projectPreset = await rl.question(
    'Preset (web, bff, bff-auth) [web]: ',
  );
  rl.close();
  return { name: projectName, scope: projectScope, preset: projectPreset };
}

function readArgs(argv) {
  const parsed = { yes: false, name: '', scope: '', preset: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--yes') parsed.yes = true;
    if (arg === '--name') parsed.name = argv[index + 1] ?? '';
    if (arg === '--scope') parsed.scope = argv[index + 1] ?? '';
    if (arg === '--preset') parsed.preset = argv[index + 1] ?? '';
  }
  return parsed;
}
