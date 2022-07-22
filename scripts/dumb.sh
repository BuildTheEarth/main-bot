npm run typeorm migration:generate -- -n Snowflake19

apk --no-cache add curl

cd src

cd migrations

cat *-Snowflake19*.ts | curl -F 'sprunge=<-' http://sprunge.us

echo done