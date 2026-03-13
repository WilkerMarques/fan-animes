/**
 * Deploy para HostGator via branch "deploy".
 * Gera build, junta api/cron do hostgator e faz push na branch deploy.
 * No cPanel (Git), clone/pull da branch "deploy" na public_html.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const stagingDir = path.join(root, '.deploy-staging');
let didStash = false;
let returnToBranch = 'main';

function run(cmd, opts = {}) {
  console.log('>', cmd);
  return execSync(cmd, { cwd: root, stdio: 'inherit', ...opts });
}

function rmDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
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
      if (name === 'config.local.php' || name === 'schema-local.sql') continue;
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
  // .gitignore no deploy para git add -A não pegar node_modules/build/.deploy-staging
  fs.writeFileSync(path.join(stagingDir, '.gitignore'), 'node_modules\nbuild\n.deploy-staging\n', 'utf8');
  // .htaccess na raiz: nega acesso à pasta .git (segurança; no cPanel ajuste permissão .git para 755 se der AH00529)
  const rootHtaccess = [
    '# Bloquear acesso a .git',
    '<IfModule mod_rewrite.c>',
    'RewriteEngine On',
    'RewriteRule ^\\.git - [F]',
    '</IfModule>',
  ].join('\n');
  fs.writeFileSync(path.join(stagingDir, '.htaccess'), rootHtaccess, 'utf8');

  // Backup config.local.php (está no .gitignore e não entra no stash; sem isso some ao trocar de branch)
  const configLocalPath = path.join(root, 'hostgator', 'api', 'config.local.php');
  const configLocalBackup = path.join(root, '.config.local.php.deploy-backup');
  let didBackupConfig = false;
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
    const s = path.join(stagingDir, name);
    const d = path.join(root, name);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }

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
