import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface PhinxConfig {
  useDocker: boolean;
  dockerMethod: 'docker-compose' | 'docker';
  dockerContainer: string;
  dockerComposeService: string;
  phinxPath: string;
  workingDirectory: string;
  migrationsDirectory: string;
}

export function activate(context: vscode.ExtensionContext) {

  let createDisposable = vscode.commands.registerCommand(
    'phinx.createMigration',
    createMigration
  );

  let migrateDisposable = vscode.commands.registerCommand(
    'phinx.migrate',
    migrate
  );

  let rollbackDisposable = vscode.commands.registerCommand(
    'phinx.rollback',
    rollback
  );

  context.subscriptions.push(createDisposable, migrateDisposable, rollbackDisposable);
}

function getConfig(): PhinxConfig {
  const config = vscode.workspace.getConfiguration('phinx');

  return {
    useDocker: config.get('useDocker') || false,
    dockerMethod: config.get('dockerMethod') || 'docker-compose',
    dockerContainer: config.get('dockerContainer') || 'php-fpm',
    dockerComposeService: config.get('dockerComposeService') || 'php-fpm',
    phinxPath: config.get('phinxPath') || 'composer_modules/bin/phinx',
    workingDirectory: config.get('workingDirectory') || '/app',
    migrationsDirectory: config.get('migrationsDirectory') || 'db/migrations'
  };
}

async function createMigration() {
  const migrationName = await vscode.window.showInputBox({
    placeHolder: 'CreateUsersTable',
    prompt: 'Migration name (no spaces)',
    validateInput: (text) => {
      if (!text) return 'The name cannot be empty';
      if (!/^[a-zA-Z0-9_]+$/.test(text)) {
        return 'Only letters, numbers and underscores are allowed';
      }
      return null;
    }
  });

  if (!migrationName) {
    return;
  }

  const config = getConfig();
  const command = `${config.phinxPath} create ${migrationName}`;

  executeCommandAndOpen(command, migrationName);
}

async function migrate() {
  const confirm = await vscode.window.showQuickPick(
    ['Yes', 'No'],
    { placeHolder: 'Execute pending migrations?' }
  );

  if (confirm === 'Yes') {
    executeCommand(`${getConfig().phinxPath} migrate`);
  }
}

async function rollback() {
  const confirm = await vscode.window.showQuickPick(
    ['Yes', 'No'],
    { placeHolder: 'Execute rollback of the last migration?' }
  );

  if (confirm === 'Yes') {
    executeCommand(`${getConfig().phinxPath} rollback`);
  }
}

async function executeCommandAndOpen(command: string, migrationName: string) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No open workspace folder');
    return;
  }

  const config = getConfig();
  let finalCommand = command;

  if (config.useDocker) {
    const escapedCommand = command.replace(/"/g, '\\"');
    if (config.dockerMethod === 'docker-compose') {
      finalCommand = `docker-compose exec -T ${config.dockerComposeService} bash -c "${escapedCommand}"`;
    } else if (config.dockerMethod === 'docker') {
      finalCommand = `docker exec ${config.dockerContainer} bash -c "${escapedCommand}"`;
    }
  }

  cp.exec(
    finalCommand,
    { cwd: workspaceFolder.uri.fsPath },
    async (error, stdout, stderr) => {
      if (error) {
        vscode.window.showErrorMessage(`Error creating migration: ${error.message}`);
        return;
      }

      const terminal = vscode.window.createTerminal({
        name: 'Phinx',
        cwd: workspaceFolder.uri.fsPath
      });
      terminal.show();
      terminal.sendText(finalCommand);

      await findAndOpenMigrationFile(workspaceFolder.uri.fsPath, migrationName);
    }
  );
}

async function findAndOpenMigrationFile(workspaceDir: string, migrationName: string) {
  const migrationsDir = path.join(workspaceDir, 'db', 'migrations');

  try {
    if (!fs.existsSync(migrationsDir)) {
      vscode.window.showWarningMessage(`⚠️ Directory does not exist: ${migrationsDir}`);
      return;
    }

    const allFiles = fs.readdirSync(migrationsDir);
    
    const phpFiles = allFiles.filter(file => {
      const filePath = path.join(migrationsDir, file);
      const isFile = fs.statSync(filePath).isFile();
      const isPhp = file.endsWith('.php');
      return isFile && isPhp;
    });

    if (phpFiles.length === 0) {
      vscode.window.showWarningMessage(`⚠️ No migration files (.php) found in: ${migrationsDir}`);
      return;
    }

    const filesWithStats = phpFiles.map(file => ({
      name: file,
      path: path.join(migrationsDir, file),
      time: fs.statSync(path.join(migrationsDir, file)).mtimeMs
    }));

    const mostRecent = filesWithStats.sort((a, b) => b.time - a.time)[0];

    if (!fs.existsSync(mostRecent.path)) {
      vscode.window.showErrorMessage(`❌ File does not exist: ${mostRecent.path}`);
      return;
    }

    const document = await vscode.workspace.openTextDocument(mostRecent.path);
    await vscode.window.showTextDocument(document, {
      preview: false,
      viewColumn: vscode.ViewColumn.Active
    });

    vscode.window.showInformationMessage(`✅ Migration created: ${mostRecent.name}`);
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }
}

function executeCommand(command: string) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No open workspace folder');
    return;
  }

  const config = getConfig();
  let finalCommand = command;

  if (config.useDocker) {
    const escapedCommand = command.replace(/"/g, '\\"');
    if (config.dockerMethod === 'docker-compose') {
      finalCommand = `docker-compose exec -T ${config.dockerComposeService} bash -c "${escapedCommand}"`;
    } else if (config.dockerMethod === 'docker') {
      finalCommand = `docker exec ${config.dockerContainer} bash -c "${escapedCommand}"`;
    }
  }

  const terminal = vscode.window.createTerminal({
    name: 'Phinx',
    cwd: workspaceFolder.uri.fsPath
  });

  terminal.show();
  
  if (config.useDocker) {
    terminal.sendText(`# Executing in Docker: ${config.dockerMethod}`);
  }
  
  terminal.sendText(finalCommand);
}

export function deactivate() {}
