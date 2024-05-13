const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');
const {config} = require('./../dist/core/config');
const dotenv = require('dotenv');

dotenv.config();

function runMigrations() {
    const migrationsDir = path.join(__dirname)
    const migrationDirs = fs.readdirSync(migrationsDir)

    migrationDirs.forEach((migrationDir) => {
        const migrationFilePath = path.join(migrationsDir, migrationDir, 'migration.sql')
        console.log(`Running migration: ${migrationFilePath}`)

        execSync(`PGPASSWORD=${config.DB.PASSWORD} psql -h ${config.DB.HOST} -U ${config.DB.USER} -d ${config.DB.NAME} -a -f ${migrationFilePath}`, {stdio: 'inherit'})
    });
}

// Run the migrations
runMigrations();
