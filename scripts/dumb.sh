npm run typeorm migration:generate -- -n Snowflake19

cd src

cd migrations

cat *-Snowflake19*.ts | curl -F 'sprunge=<-' http://sprunge.us

echo done