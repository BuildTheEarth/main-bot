const Discord = require("discord.js")
exports.run = async (client, message, args, level) => {
    client.sql.query("Select * from Commands", [], (err, rows) => {
        if (err) {
            const embed = new Discord.MessageEmbed()
                .setColor(0x14ff00)
                .setAuthor(message.author.username, message.author.displayAvatarURL())
                .setTitle("🚫 An error occurred!")
                .setDescription("Please contact one of the bot developers for help.")
            return message.channel.send(embed);
        }

        let allCommands = "";
        rows.forEach(row => {
            allCommands += "- `=" + row.Command + "`\n";
        });

        const embed = new Discord.MessageEmbed()
            .setColor(0x14ff00)
            .setAuthor(message.author.username, message.author.displayAvatarURL())
            .setTitle("All Custom Commands")
            .setDescription(allCommands)

        message.channel.send(embed);
    })
};

exports.conf = {
    enabled: true,
    aliases: ["listcom", "listcoms"],
    permLevel: "User",
    name: "listcommands"
};