npm run typeorm query "DESCRIBE advanced_builders"

apk --no-cache add curl

node scripts/backup.cjs

npm run typeorm query "source ./sqlScripts/Snowflake191658519013499_UP.sql"

npm run typeorm query "DESCRIBE advanced_builders"

echo done