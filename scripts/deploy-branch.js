/**
 * Deploy para HostGator via branch "deploy".
 * Gera build, junta api/cron do hostgator e faz push na branch deploy.
 * No cPanel (Git), clone/pull da branch "deploy" na public_html.
 *
 * Segurança: api/config.local.php NUNCA é copiado para o staging nem commitado.
 * No servidor, crie/mantenha config.local.php manualmente (fora do Git).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const stagingDir = path.join(root, '.deploy-staging');
let didStash = false;
let returnToBranch = 'main';
let didBackupConfig = false;
const configLocalPath = path.join(root, 'hostgator', 'api', 'config.local.php');
const configLocalBackup = path.join(root, '.config.local.php.deploy-backup');

function run(cmd, opts = {}) {
  console.log('>', cmd);
  return execSync(cmd, { cwd: root, stdio: 'inherit', ...opts });
}

function rmDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
}

const NEVER_DEPLOY_NAMES = new Set(['config.local.php', 'schema-local.sql']);

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (NEVER_DEPLOY_NAMES.has(name)) continue;
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

try {
  let currentBranch = '';
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: root, encoding: 'utf-8' }).trim();
  } catch (_) {
    currentBranch = 'main';
  }
  const sourceBranch = currentBranch === 'master' ? 'master' : 'main';
  returnToBranch = sourceBranch;
  if (currentBranch !== 'main' && currentBranch !== 'master') {
    console.log('Na branch "' + currentBranch + '". Indo para "' + sourceBranch + '" para fazer o build...');
    try {
      run('git checkout ' + sourceBranch);
    } catch (e) {
      const status = execSync('git status --porcelain', { cwd: root, encoding: 'utf-8' }).trim();
      if (status) {
        console.log('Guardando alterações (stash) para trocar de branch...');
        run('git stash push -u -m "deploy-branch temp"');
        didStash = true;
        run('git checkout ' + sourceBranch);
      } else {
        throw e;
      }
    }
  }

  console.log('Build...');
  run('npm run build');

  console.log('Preparando staging...');
  rmDir(stagingDir);
  fs.mkdirSync(stagingDir, { recursive: true });

  const buildDir = path.join(root, 'build');
  if (fs.existsSync(buildDir)) {
    copyDir(buildDir, path.join(stagingDir, 'build'));
  }

  const apiSrc = path.join(root, 'hostgator', 'api');
  const apiDest = path.join(stagingDir, 'api');
  if (fs.existsSync(apiSrc)) {
    fs.mkdirSync(apiDest, { recursive: true });
    for (const name of fs.readdirSync(apiSrc)) {
      if (NEVER_DEPLOY_NAMES.has(name)) continue;
      const s = path.join(apiSrc, name);
      const d = path.join(apiDest, name);
      if (fs.statSync(s).isDirectory()) {
        copyDir(s, d);
      } else {
        fs.copyFileSync(s, d);
      }
    }
  }

  const cronSrc = path.join(root, 'hostgator', 'cron');
  const cronDest = path.join(stagingDir, 'cron');
  if (fs.existsSync(cronSrc)) {
    copyDir(cronSrc, cronDest);
  }

  // Conteúdo final na raiz do deploy: index.html e build na raiz (como public_html)
  const buildInStaging = path.join(stagingDir, 'build');
  if (fs.existsSync(buildInStaging)) {
    for (const name of fs.readdirSync(buildInStaging)) {
      const s = path.join(buildInStaging, name);
      const d = path.join(stagingDir, name);
      if (fs.statSync(s).isDirectory()) {
        copyDir(s, d);
      } else {
        fs.copyFileSync(s, d);
      }
    }
    rmDir(buildInStaging);
  }
  // .gitignore no deploy para git add -A não pegar node_modules/build/.deploy-staging nem "nul" (Windows)
  const deployGitignore = [
    'node_modules',
    'build',
    '.deploy-staging',
    'nul',
    '',
    '# Credenciais e SQL local — nunca no repositório deploy',
    'api/config.local.php',
    'hostgator/api/config.local.php',
  ].join('\n');
  fs.writeFileSync(path.join(stagingDir, '.gitignore'), deployGitignore, 'utf8');
  // .htaccess na raiz: HTTPS, bloquear .git + React/SPA routing (fallback para index.html)
  const rootHtaccess = [
    'RewriteEngine On',
    '',
    '# Redirecionar HTTP para HTTPS (fananimes.com.br -> https://fananimes.com.br/)',
    'RewriteCond %{HTTPS} off',
    'RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
    '',
    '# Bloquear acesso ao .git',
    'RewriteRule ^\\.git - [F]',
    '',
    '# React / SPA routing',
    'RewriteBase /',
    'RewriteRule ^index\\.html$ - [L]',
    'RewriteCond %{REQUEST_FILENAME} !-f',
    'RewriteCond %{REQUEST_FILENAME} !-d',
    'RewriteRule . /index.html [L]',
  ].join('\n');
  fs.writeFileSync(path.join(stagingDir, '.htaccess'), rootHtaccess, 'utf8');

  // Backup config.local.php (está no .gitignore e não entra no stash; sem isso some ao trocar de branch)
  if (fs.existsSync(configLocalPath)) {
    fs.copyFileSync(configLocalPath, configLocalBackup);
    didBackupConfig = true;
  }
  try {
    const status = execSync('git status --porcelain', { cwd: root, encoding: 'utf-8' }).trim();
    if (status) {
      console.log('Guardando alterações locais (git stash)...');
      run('git stash push -u -m "deploy-branch temp"');
      didStash = true;
    }
  } catch (_) {}

  let deployExists = false;
  try {
    execSync('git rev-parse --verify deploy', { cwd: root, stdio: 'pipe' });
    deployExists = true;
  } catch (_) {}

  if (!deployExists) {
    console.log('Criando branch deploy (orphan)...');
    run('git checkout --orphan deploy');
  } else {
    run('git checkout deploy');
  }
  try {
    run('git rm -rf .', { stdio: 'pipe' });
  } catch (_) {}
  // NÃO usar git clean -fdx: apagaria o código da main (package.json, src/, etc.)

  const stagingEntries = fs.readdirSync(stagingDir);
  for (const name of stagingEntries) {
    if (name === 'nul') continue; // Windows: evita arquivo especial
    const s = path.join(stagingDir, name);
    const d = path.join(root, name);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }

  // Credenciais não devem existir aqui; remove se algo as copiou por engano
  const stripSecretIfPresent = (rel) => {
    const p = path.join(root, ...rel.split('/'));
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('Removido do deploy (não commitar):', rel);
    }
  };
  stripSecretIfPresent('api/config.local.php');
  stripSecretIfPresent('hostgator/api/config.local.php');

  // No deploy, .gitignore ignora node_modules/build/.deploy-staging; add -A adiciona o resto
  run('git add -A');
  run('git status');
  const statusOut = execSync('git status --porcelain', { cwd: root, encoding: 'utf-8' }).trim();
  if (!statusOut) {
    console.log('Nenhuma alteração para commit (build idêntico). Pulando push.');
  } else {
    run('git commit -m "deploy: build + api + cron"');
    run('git push -u origin deploy --force');
  }

  console.log('Deploy branch atualizada. No cPanel: Update from Remote.');
} finally {
  rmDir(stagingDir);
  try {
    run('git checkout ' + returnToBranch);
  } catch (_) {
    try {
      run('git checkout main');
    } catch (__) {
      run('git checkout master');
    }
  }
  if (didStash) {
    try {
      console.log('Restaurando alterações locais (git stash pop)...');
      run('git stash pop');
    } catch (_) {
      console.warn('Alterações ficaram no stash. Rode: git stash pop');
    }
  }
  // Restaurar config.local.php do backup (para não perder ao fazer deploy)
  if (didBackupConfig && fs.existsSync(configLocalBackup)) {
    fs.copyFileSync(configLocalBackup, configLocalPath);
    fs.unlinkSync(configLocalBackup);
  }
}
