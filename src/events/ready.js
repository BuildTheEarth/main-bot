module.exports = async (client, message) => {
    await client.wait(1000);
    client.user.setActivity(`${client.config.prefix}help`, { type: "PLAYING" });
    console.log(`Ready | ${client.user.username}`);

    const guild = "571136573253615627";

    client.sql.query(
        "Select * from Members where MutedUntil IS NOT NULL AND MutedUntil > ?",
        [Date.now()],
        (err, res) => {
            if (err) return console.error(err);

            let mutes = res.filter((r) => r.MutedUntil);

            mutes.forEach((r) => {
                const muteRole = client.guilds.cache
                    .get(guild)
                    .roles.cache.find((role) => role.name === "Muted");
                if (r.MutedUntil < new Date().getTime()) {
                    client.guilds
                        .resolve(guild)
                        .members.fetch(r.DiscordID)
                        .then((m) => {
                            m.roles.remove(muteRole);
                            sql.query(
                                "Update Members set MutedUntil = null where ID = ?",
                                [r.ID]
                            );
                        })
                        .catch((e) => {});
                }

                setTimeout(async () => {
                    client.guilds
                        .resolve(guild)
                        .members.fetch(r.DiscordID)
                        .then((m) => {
                            m.roles.remove(muteRole);
                            sql.query(
                                "Update Members set MutedUntil = null where ID = ?",
                                [r.ID]
                            );
                        })
                        .catch((e) => {});
                }, r.MutedUntil - Date.now());
            });
        }
    );
};
