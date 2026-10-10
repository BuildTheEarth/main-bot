# Suggestion dashboard

`/suggestion-dashboard` opens a private menu for searching suggestions by status,
date and text. Sessions expire after 30 minutes of inactivity.

Staff server members can browse Main and Staff suggestions. In the Main server,
members must have Builder+ (`691343715117039666`) and can only browse Main
suggestions. Buttons, select menus and submitted search forms check access again
on every interaction. Sessions belong to one member in one server.

Configure `suggestionDashboard` in `config/config.json5`:

```json
{
    "enabled": true,
    "channels": {
        "main": "692251560981430292",
        "staff": "705286174356537394"
    },
    "mainAccessRoleId": "691343715117039666"
}
```

Each channel must belong to its corresponding `guilds.main` or `guilds.staff`
server. The bot requires View Channel, Send Messages, Embed Links and Read Message
History. Configure channel visibility in Discord to match the intended audience.

Weekly posts are published on Mondays at 09:00 UTC and checked on startup. Each
post covers the previous calendar week in UTC. Main posts only count Main
suggestions; Staff posts count both sources. Stored channel/week keys and message
markers prevent duplicate posts after a restart. A failure in one channel does
not prevent publication in the other.

Staff Admins and Managers can use `/suggestion-dashboard publish:true` to publish
or find the current weekly posts. Other Staff members can use the menus without
publishing permission.

Run the access and publication regression tests with:

```sh
node --test tests/suggestion-dashboard.test.cjs
```
