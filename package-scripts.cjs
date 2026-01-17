/// <reference types="./src/typings/nps-utils" />

const npsUtils = require('nps-utils');

const clean = npsUtils.rimraf('/dist');

module.exports = {
  scripts: {
    clean: clean,
    commit: "cz",
    cm: "cz",
    default: {
      default: 'node dist/index.js --unhandled-rejections=strict',
      production: 'npm start docker.production'
    },
    docker: {
      default: npsUtils.series('npm start docker.build', 'npm start docker.compose'),
      compose: "docker compose up",
      build: "docker build . -t buildtheearth/main-bot --no-cache",
      run: "docker run buildtheearth/main-bot",
      test: "docker run buildtheearth/main-bot",
      production: "docker run buildtheearth/main-bot -d"
    },
    start: {
      default: 'node dist/index.js --unhandled-rejections=strict',
      production: 'docker run buildtheearth/main-bot -d',
    },
    test: npsUtils.series('npm start build', 'npm start start'),
    preCommit: npsUtils.series('npm start lint', 'npm start format'),
    build: 'npm start clean && tsc',
    watch: 'tsc --watch',
    format: 'prettier --write -c src',
    lint: 'eslint src --fix',
    update: {
      default: 'git pull && npm start build && pm2 restart main-bot',
      migrate: 'git pull && npm start build && pm2 stop main-bot && npm start migrate && pm2 start main-bot'
    },
    error: 'ts-node scripts/error.cts',
    backup: 'mysqldump main_bot --user root --password --result-file "main_bot-$(date -u +\'%Y_%m_%dT%H:%M:%SZ\').sql"',
    migrate_config: 'ts-node scripts/convertOldYAML.cts',
  }
};
