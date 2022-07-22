npm run typeorm query "DESCRIBE advanced_builders"

apk --no-cache add curl

node scripts/runMigration.cjs

npm run typeorm query "DESCRIBE advanced_builders"

echo done