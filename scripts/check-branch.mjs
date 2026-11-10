import { execSync } from 'node:child_process';

const branch =
  process.env.GITHUB_HEAD_REF ||
  execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

if (branch === 'main' || branch === 'master' || branch === 'HEAD') {
  process.exit(0);
}

const valid = /^(feature|fix|refactor|hotfix)-[a-z0-9-]*[a-z0-9]$/.test(branch);
if (!valid) {
  process.stderr.write(
    `Branch "${branch}" must match feature|fix|refactor|hotfix followed by kebab-case, without slashes.\n`,
  );
  process.exit(1);
}
