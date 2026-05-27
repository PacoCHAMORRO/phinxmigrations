# Phinx Migration Helper

A VSCode extension to streamline the use of **Phinx** in CakePHP, allowing you to create, execute, and rollback migrations directly from the editor.

## 🚀 Features

- 📝 **Create Migration** - Create new migrations with name validation
- ⬆️ **Migrate** - Execute all pending migrations
- ⬇️ **Rollback** - Revert the last executed migration
- 🐳 **Docker Support** - Compatible with `docker-compose` and `docker exec`
- 🎯 **Auto-open** - Automatically opens the created migration file
- ⚙️ **Configurable** - Per-project customization

## 📋 Requirements

- VSCode 1.60.0 or higher
- Project with **Phinx** installed via Composer
- `composer_modules/bin/phinx` available in project root

## 📦 Installation

1. Download the `.vsix` file from releases
2. In VSCode: `Extensions` → `Install from VSIX` → select the file
3. Done! The extension will activate automatically

## 🎯 Usage

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "Phinx:" to see available commands:

### Create Migration
- Opens a dialog to enter the migration name
- Creates the migration in `db/migrations/`
- **Automatically opens the created file**

### Migrate
- Executes all pending migrations
- Asks for confirmation before running

### Rollback
- Reverts the last migration
- Asks for confirmation before running

## ⚙️ Configuration

### Option 1: Without Docker (Local Execution)

```json
{
	"phinx.useDocker": false,
  "phinx.phinxPath": "composer_modules/bin/phinx"
}
```

### Option 2: With Docker Compose
```json
{
  "phinx.useDocker": true,
  "phinx.dockerMethod": "docker-compose",
  "phinx.dockerComposeService": "php-fpm",
  "phinx.phinxPath": "composer_modules/bin/phinx"
}
```
### Option 3: With Docker Exec
```json
{
  "phinx.useDocker": true,
  "phinx.dockerMethod": "docker",
  "phinx.dockerComposeService": "php-fpm",
  "phinx.phinxPath": "composer_modules/bin/phinx"
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `phinx.useDocker` | boolean | `false` | Execute commands inside Docker |
| `phinx.dockerMethod` | string | `docker-compose` | Method: `docker-compose` or `docker` |
| `phinx.dockerContainer` | string | `php-fpm` | Docker container name |
| `phinx.dockerComposeService` | string | `php-fpm` | Service name in docker-compose.yml |
| `phinx.phinxPath` | string | `composer_modules/bin/phinx` | Path to phinx |
| `phinx.workingDirectory` | string | `/app` | Working directory in container |

## 🐛 Troubleshooting

### "No workspace folder open"
- Make sure to open your project in VSCode as a folder (`File` → `Open Folder`)

### "Command not found: composer_modules/bin/phinx"
- Verify Phinx is installed: `ls composer_modules/bin/phinx`
- Update the `phinx.phinxPath` setting in `.vscode/settings.json`

### With Docker: "cannot find path"
- Verify volumes are correctly configured in `docker-compose.yml`
- The project should be mounted at `/app` (or adjust `phinx.workingDirectory`)

### File doesn't open automatically
- Verify that the `db/migrations/` folder exists
- Open Developer Console (`Ctrl+Shift+I`) to check debug logs

## 📄 License

MIT

## 👤 Contributing

Contributions are welcome. Please open an issue or pull request.