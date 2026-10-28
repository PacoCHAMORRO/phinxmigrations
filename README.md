# Phinx Migration Helper

A VSCode extension to streamline the use of **Phinx** in CakePHP, allowing you to create, execute, and rollback migrations directly from the editor.

## 🚀 Features

- 📝 **Create Migration** - Create new migrations with name validation
- ⬆️ **Migrate** - Execute all pending migrations
- ⬇️ **Rollback** - Revert the last executed migration
- 📊 **Status** - Show which migrations are up and which are pending
- 📺 **Live feedback** - Command output streams to a single **Phinx** output panel, with a progress notification and a success or error message when it finishes
- 🐳 **Docker Support** - Compatible with `docker-compose` and `docker exec`
- 🎯 **Auto-open** - Automatically opens the created migration file
- ⚙️ **Configurable** - Per-project customization

## 📋 Requirements

- VSCode 1.60.0 or higher
- Project with **Phinx** installed via Composer
- `composer_modules/bin/phinx` available in project root

## 🎯 Usage

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "Phinx:" to see available commands.

Every command writes its output to the **Phinx** output panel (`View` → `Output`, then pick "Phinx"). A notification shows while it runs, and when it finishes you get a ✅ or ❌ message. If it fails, click **Show output** to see the error.

### Create Migration
- Opens a dialog to enter the migration name
- Creates the migration in `phinx.migrationsDirectory` (`db/migrations` by default)
- **Automatically opens the created file** if the command succeeds

### Migrate
- Executes all pending migrations
- Asks for confirmation before running

### Rollback
- Reverts the last migration
- Asks for confirmation before running

### Status
- Shows the migration status table in the **Phinx** output panel
- Tells you how many migrations are pending, with a shortcut to run them

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
  "phinx.dockerContainer": "php-fpm",
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
| `phinx.migrationsDirectory` | string | `db/migrations` | Migrations directory (relative to the project root) |
| `phinx.workingDirectory` | string | `./` | Working directory in container (not used yet) |

## 🐛 Troubleshooting

### "No workspace folder open"
- Make sure to open your project in VSCode as a folder (`File` → `Open Folder`)

### "Command not found: composer_modules/bin/phinx"
- Verify Phinx is installed: `ls composer_modules/bin/phinx`
- Update the `phinx.phinxPath` setting in `.vscode/settings.json`

### With Docker: "cannot find path"
- Verify volumes are correctly configured in `docker-compose.yml`
- Commands run in the container's default working directory, so `phinx.phinxPath` must be valid from there

### A command fails
- Open the **Phinx** output panel to see the full Phinx output and the exit code

### File doesn't open automatically
- Verify that the folder in `phinx.migrationsDirectory` exists on your machine (not only inside the container)
- Check the **Phinx** output panel to confirm the migration was created

## 📄 License

MIT

## 👤 Contributing

Contributions are welcome. Please open an issue or pull request.