// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from 'child_process';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "phinxmigrations" is now active!');

	const workspaceRoot = getWorkspaceRoot();

	let disposable = vscode.commands.registerCommand('phinxmigrations.selectPhinxPath', async () => {
		const phinxPath = await vscode.window.showInputBox({
			prompt: 'Enter the path to the Phinx installation (e.g., vendor/bin/phinx)',
			placeHolder: 'vendor/bin/phinx'
		});

		if (phinxPath) {
			const config = vscode.workspace.getConfiguration('phinx');
			await config.update('path', phinxPath, vscode.ConfigurationTarget.Workspace);

			vscode.window.showInformationMessage(`Phinx path set to: ${phinxPath}`);
		}

	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('phinxmigrations.runMigrations', async () => {
		if (!workspaceRoot) {
			vscode.window.showErrorMessage('No workspace is open.');
			return;
		}

		const config = vscode.workspace.getConfiguration('phinx');
		const phinxPath = config.get<string>('path', 'vendor/bin/phinx');

		if (!phinxPath) {
			vscode.window.showErrorMessage('Phinx path is not set. Please configure the path first.');
			return;
		}

		cp.exec(`${phinxPath} migrate`, {cwd: workspaceRoot}, (err, stdout, stderr) => {
			if (err) {
					vscode.window.showErrorMessage(`Error running Phinx migrate: ${stderr}`);
					return;
			}

			vscode.window.showInformationMessage(`Phinx migrate output: ${stdout}`);
		});
	});

	disposable = vscode.commands.registerCommand('phinxmigrations.runRollback', async () => {
		if (!workspaceRoot) {
			vscode.window.showErrorMessage('No workspace is open.');
			return;
		}

		const config = vscode.workspace.getConfiguration('phinx');
		const phinxPath = config.get<string>('path', 'vendor/bin/phinx');

		if (!phinxPath) {
			vscode.window.showErrorMessage('Phinx path is not set. Please configure the path first.');
		}

		cp.exec(`${phinxPath} rollback`, {cwd: workspaceRoot}, (err, stdout, stderr) => {
			if (err) {
					vscode.window.showErrorMessage(`Error running Phinx migrate: ${stderr}`);
					return;
			}

			vscode.window.showInformationMessage(`Phinx rollback output: ${stdout}`);
		});
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('phinxmigrations.createMigration', async () => {
		if (!workspaceRoot) {
			vscode.window.showErrorMessage('No workspace is open.');
			return;
		}

		const config = vscode.workspace.getConfiguration('phinx');
		const phinxPath = config.get<string>('path', 'vendor/bin/phinx');

		if (!phinxPath) {
			vscode.window.showErrorMessage('Phinx path is not set. Please configure the path first.');
		}

		const migrationName = await vscode.window.showInputBox({
			prompt: 'Migration name:',
			placeHolder: 'MyNewMigration'
		});

		if (!migrationName) {
			vscode.window.showErrorMessage('Invalid migration name.');
			return;
		}

		cp.exec(`${phinxPath} create ${migrationName}`, {cwd: workspaceRoot}, (err, stdout, stderr) => {
			if (err) {
				vscode.window.showErrorMessage(`Error running Phinx create: ${stderr}`);
				;
			}

			vscode.window.showInformationMessage(`Phinx create output: ${stdout}`);
		});
	});

	context.subscriptions.push(disposable);
}

function getWorkspaceRoot(): string | undefined {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders && workspaceFolders.length > 0) {
			return workspaceFolders[0].uri.fsPath;
	}
	return undefined;
}

// This method is called when your extension is deactivated
export function deactivate() {}
