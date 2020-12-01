const Discord = require("discord.js");
const ms = require("ms");
exports.run = async (client, message, args, level) => {
    const user =
        message.mentions.members.first() ||
        message.guild.members.cache.get(args[0]);

    if (user == null) {
        let embed = new Discord.MessageEmbed()
            .setAuthor(
                message.author.username,
                message.author.displayAvatarURL()
            )
            .setColor(0x14ff00)
            .setTitle("Could not find that user!")
            .setDescription(
                "Correct command usage: `=mute <user> <length> [reason]`"
            );
        return message.channel.send(embed);
    }

    //if (user.id == "692366528091258891" || user.id == message.author.id) return message.channel.send("bruh\n-metal");

    let muteRole = message.guild.roles.cache.find(
        (role) => role.name === "Muted"
    );
    if (user.roles.cache.has(muteRole.id)) {
        let embed = new Discord.MessageEmbed()
            .setAuthor(
                message.author.username,
                message.author.displayAvatarURL()
            )
            .setColor(0x14ff00)
            .setTitle("Could not mute that user!")
            .setDescription(`${user.displayName} is already muted!`);
        return message.channel.send(embed);
    }

    const time = args[1] || 0;
    const millis = ms(time);
    const reason = args.slice(2).join(" ") || "None";

    user.roles.add(muteRole.id);
    user.send(
        millis > 0
            ? `<@${message.author.id}> has muted you for ${ms(millis, {
                  long: true,
              })}!\n**Reason:** ${reason}`
            : `<@${message.author.id}> has muted you indefinitely!\n**Reason:** ${reason}`
    );

    const unmuteTime = millis > 0 ? Date.now() + millis : null;
    await client.sql.query(
        "INSERT INTO Members(DiscordID, Username, MutedUntil) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE MutedUntil = ?",
        [user.id, user.username, unmuteTime, unmuteTime],
        (err, res) => {
            if (err)
                return message.channel.send(
                    "An error occured when running this command. Please contact metal."
                );

            let embed = new Discord.MessageEmbed()
                .setAuthor(
                    message.author.username,
                    message.author.displayAvatarURL()
                )
                .setColor(0x14ff00)
                .setTitle("Muted!")
                .addField("User", user, true)
                .addField(
                    "Time",
                    millis > 0 ? ms(millis, { long: true }) : "Indefinitely",
                    true
                )
                .addField("Reason", reason);
            message.channel.send(embed);
            if (millis > 0)
                setTimeout(async () => {
                    await user.roles.remove(muteRole.id);
                }, millis);
        }
    );

    client.sql.query(
        "INSERT INTO Logs(Action, Member, Moderator, Reason, Time, ChannelID) VALUES(?, ?, ?, ?, ?, ?)",
        [
            "mute",
            user.id,
            message.author.id,
            reason,
            Date.now(),
            message.channel.id,
        ],
        (err, res) => {
            if (err)
                return message.channel.send(
                    "An error occured when running this command. Please contact metal."
                );
            let caseId = res.insertId;

            let embed = new Discord.MessageEmbed()
                .setAuthor(`Case ${caseId}`, client.user.displayAvatarURL())
                .setColor(0x14ff00)
                .setTitle("User muted!")
                .setDescription(
                    `**${user.user.tag}** (${user.id}) has been muted by ${
                        message.member
                    }\nLength : ${
                        millis > 0 ? ms(millis, { long: true }) : "Indefinitely"
                    }`
                )
                .setTimestamp()
                .addField("Reason", reason);

            client.channels.cache.get(client.config.logChannel).send(embed);
        }
    );
};

exports.conf = {
    enabled: true,
    aliases: [],
    permLevel: "Helper",
    name: "mute",
};
