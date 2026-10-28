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

interface CommandResult {
  success: boolean;
  exitCode: number | null;
  output: string;
}

interface RunOptions {
  // Exit codes considered successful (phinx status uses 2 and 3 for missing/pending migrations)
  successCodes?: number[];
  // Skip the done/failed notification so the caller can show its own
  silent?: boolean;
  // Rewrites the output before it is shown; the output is buffered instead of streamed
  filterOutput?: (output: string) => string;
}

// Exit codes returned by `phinx status`
const STATUS_MISSING = 2;
const STATUS_DOWN = 3;

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('Phinx', 'phinx-output');
  context.subscriptions.push(outputChannel);

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

  let statusDisposable = vscode.commands.registerCommand(
    'phinx.status',
    status
  );

  context.subscriptions.push(createDisposable, migrateDisposable, rollbackDisposable, statusDisposable);
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
  const result = await runPhinx(
    `${config.phinxPath} create ${migrationName}`,
    `Creating migration ${migrationName}`
  );

  if (result.success) {
    await findAndOpenMigrationFile(config.migrationsDirectory);
  }
}

async function migrate() {
  const confirm = await vscode.window.showQuickPick(
    ['Yes', 'No'],
    { placeHolder: 'Execute pending migrations?' }
  );

  if (confirm === 'Yes') {
    await runPhinx(`${getConfig().phinxPath} migrate`, 'Running migrations');
  }
}

async function rollback() {
  const confirm = await vscode.window.showQuickPick(
    ['Yes', 'No'],
    { placeHolder: 'Execute rollback of the last migration?' }
  );

  if (confirm === 'Yes') {
    await runPhinx(`${getConfig().phinxPath} rollback`, 'Rolling back last migration');
  }
}

async function status() {
  const result = await runPhinx(
    `${getConfig().phinxPath} status`,
    'Checking migration status',
    { successCodes: [0, STATUS_MISSING, STATUS_DOWN], silent: true, filterOutput: hideAppliedMigrations }
  );

  if (!result.success) {
    return;
  }

  if (result.exitCode === 0) {
    vscode.window.showInformationMessage('✅ All migrations are up to date');
    return;
  }

  if (result.exitCode === STATUS_MISSING) {
    const action = await vscode.window.showWarningMessage(
      '⚠️ Some executed migrations have no file (MISSING)',
      'Show output'
    );
    if (action === 'Show output') {
      outputChannel.show();
    }
    return;
  }

  const pending = (result.output.match(/^\s*down\s+\d+/gm) || []).length;
  const action = await vscode.window.showWarningMessage(
    `⏳ ${pending || 'There are'} pending migration${pending === 1 ? '' : 's'}`,
    'Migrate',
    'Show output'
  );
  if (action === 'Migrate') {
    await migrate();
  } else if (action === 'Show output') {
    outputChannel.show();
  }
}

// Removes the `up` rows from the `phinx status` table, keeping the ones whose file is missing
function hideAppliedMigrations(output: string): string {
  const lines = output.split('\n');
  const kept = lines.filter(line => !/^\s*up\s+\d+/.test(line) || /\*\*\s*MISSING/.test(line));
  const hidden = lines.length - kept.length;

  if (hidden === 0) {
    return output;
  }

  const text = kept.join('\n');
  return `${text}${text.endsWith('\n') ? '' : '\n'}(${hidden} applied migration${hidden === 1 ? '' : 's'} hidden)\n`;
}

function buildCommand(command: string, config: PhinxConfig): string {
  if (!config.useDocker) {
    return command;
  }

  const escapedCommand = command.replace(/"/g, '\\"');
  if (config.dockerMethod === 'docker') {
    return `docker exec ${config.dockerContainer} bash -c "${escapedCommand}"`;
  }
  return `docker-compose exec -T ${config.dockerComposeService} bash -c "${escapedCommand}"`;
}

// Runs a phinx command, streaming its output to the "Phinx" output channel
// and showing a progress notification until it finishes.
async function runPhinx(
  command: string,
  title: string,
  options: RunOptions = {}
): Promise<CommandResult> {
  const successCodes = options.successCodes ?? [0];
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No open workspace folder');
    return { success: false, exitCode: null, output: '' };
  }

  const finalCommand = buildCommand(command, getConfig());

  outputChannel.show(true);
  outputChannel.appendLine('');
  outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${title}`);
  outputChannel.appendLine(`$ ${finalCommand}`);

  const result = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Phinx: ${title}...`
    },
    () => new Promise<CommandResult>((resolve) => {
      let output = '';
      const child = cp.spawn(finalCommand, {
        cwd: workspaceFolder.uri.fsPath,
        shell: true
      });

      const onData = (data: Buffer) => {
        const text = data.toString();
        output += text;
        if (!options.filterOutput) {
          outputChannel.append(text);
        }
      };

      const flushFiltered = () => {
        if (options.filterOutput) {
          outputChannel.append(options.filterOutput(output));
        }
      };

      child.stdout.on('data', onData);
      child.stderr.on('data', onData);

      child.on('error', (error) => {
        flushFiltered();
        outputChannel.appendLine(error.message);
        resolve({ success: false, exitCode: null, output });
      });

      child.on('close', (code) => {
        flushFiltered();
        outputChannel.appendLine(`Process exited with code ${code}`);
        resolve({ success: code !== null && successCodes.includes(code), exitCode: code, output });
      });
    })
  );

  if (options.silent && result.success) {
    return result;
  }

  if (result.success) {
    vscode.window.showInformationMessage(`✅ ${title}: done`);
  } else {
    const action = await vscode.window.showErrorMessage(
      `❌ ${title}: failed`,
      'Show output'
    );
    if (action === 'Show output') {
      outputChannel.show();
    }
  }

  return result;
}

async function findAndOpenMigrationFile(migrationsDirectory: string) {
  const workspaceDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!workspaceDir) {
    return;
  }

  const migrationsDir = path.join(workspaceDir, migrationsDirectory);

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

    const document = await vscode.workspace.openTextDocument(mostRecent.path);
    await vscode.window.showTextDocument(document, {
      preview: false,
      viewColumn: vscode.ViewColumn.Active
    });
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }
}

export function deactivate() {}
