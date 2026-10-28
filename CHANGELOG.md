# Change Log

All notable changes to the "phinxmigrations" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added
- Syntax highlighting in the **Phinx** output panel: applied and pending migrations, missing files, warnings, errors and exit codes are shown in color.

### Changed
- Requires VS Code 1.67 or later.

## [1.1.0]

### Added
- **Phinx: Status** command. Shows the migration status and how many migrations are pending, with a shortcut to run them.
- Progress notification while a command runs, and a success or error message when it finishes.

### Changed
- Command output is shown in a single **Phinx** output panel instead of opening a new terminal on every run.
- The migration file is only opened if `phinx create` succeeds.

### Fixed
- **Create Migration** ran the command twice and created two migration files.
- The `phinx.migrationsDirectory` setting was ignored.

## [1.0.1]

- Initial release
