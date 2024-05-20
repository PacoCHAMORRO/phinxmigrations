# Phinx VS Code Extension

A Visual Studio Code extension to easily run Phinx migrations within your projects. This extension allows you to configure the path to your Phinx installation and execute migration commands directly from the VS Code interface.

## Features

- **Configure Phinx Path**: Prompt the user to set the path to their Phinx installation (e.g., `vendor/bin/phinx`).
- **Run Migrations**: Execute Phinx migration command.
- **Run Rollbacks**: Execute Phinx rollback command.

## Requirements

Ensure you have [Phinx](https://phinx.org/) installed in your project.

## Extension Settings

This extension contributes the following settings:

- `phinx.path`: Specifies the path to the Phinx installation.

Example `settings.json` configuration:

```json
{
  "phinx.path": "vendor/bin/phinx"
}
```

## Usage

### Configure the Phinx Path

1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
2. Type `Phinx: Select Phinx Path` and press `Enter`.
3. Enter the path to your Phinx installation (e.g., `vendor/bin/phinx`).

### Run Migrations

1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
2. Type `Phinx: Run Migrations` and press `Enter`.
3. The extension will execute the `phinx migrate` command from the root of your workspace and display the output.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---
