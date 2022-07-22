npm run typeorm migration:generate -- -n Snowflake19

npm run typeorm schema:log

npm run typeorm query "SELECT * from advanced_builders"

npm run typeorm query "DESCRIBE advanced_builders"

apk --no-cache add curl

cd src

cd migrations

cat *-Snowflake19*.ts | curl -F 'sprunge=<-' http://sprunge.us

echo done