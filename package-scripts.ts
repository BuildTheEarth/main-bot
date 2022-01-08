/// <reference types="./src/typings/nps-utils" />

import npsUtils = require('nps-utils')

const clean = npsUtils.rimraf('/dist');

function seriesNPS(...scriptNames: Array<string>): string {
  function quoteScript(script: string, escaped?: string): string {
    const quote = escaped ? '\\"' : '"';
    const shouldQuote = script.indexOf(' ') !== -1;
    return shouldQuote ? `${quote}${script}${quote}` : script;
  }

  return npsUtils.series(
    ...scriptNames
      .filter(Boolean)
      .map(scriptName => scriptName.trim())
      .filter(Boolean)
      .map(scriptName => `nps ${quoteScript(scriptName)}`),
  );
};

export = {
  scripts: {
    clean: clean,
    default: {
      default: 'node dist/index.js --unhandled-rejections=strict',
      production: 'pm2 start ecosystem.yml --env production'
    },
    start: {
      default: 'node dist/index.js --unhandled-rejections=strict',
      production: 'pm2 start ecosystem.json --env production'
    },
    test: seriesNPS('build', 'start'),
    preCommit: seriesNPS('lint', 'format'),
    build: 'npm start clean && tsc',
    watch: 'tsc --watch',
    format: 'prettier --write -c src',
    lint: 'eslint src --fix',
    typeorm: 'ts-node --require ts-node/register ./node_modules/typeorm/cli.js',
    migrate: {
      default: 'ts-node --require ts-node/register ./node_modules/typeorm/cli.js migration:run',
      generate: 'ts-node --require ts-node/register ./node_modules/typeorm/cli.js migration:generate',
      create: 'ts-node --require ts-node/register ./node_modules/typeorm/cli.js migration:create'
    },
    update: {
      default: 'git pull && npm start build && pm2 restart main-bot',
      migrate: 'git pull && npm start build && pm2 stop main-bot && npm start migrate && pm2 start main-bot'
    },
    error: 'ts-node scripts/error',
    backup: 'mysqldump main_bot --user root --password --result-file "main_bot-$(date -u +\'%Y_%m_%dT%H:%M:%SZ\').sql"',
    migrate_config: 'ts-node scripts/convertOldYAML',
  }
};
