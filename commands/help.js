const Discord = require("discord.js");
exports.run = async (client, message, args, level) => {
    let embed = new Discord.MessageEmbed()
        .setAuthor(message.author.username, message.author.displayAvatarURL())
        .setColor(0x14ff00)
        .addField("Commands", "-`=ping`\n-`=help`\n-`=listcommands`");

    if (
        level >= client.config.permLevels.find((l) => l.name === "Helper").level
    ) {
        embed.addField("Helper Commands", "-`=slowmode <time>`");
    }

    if (
        level >=
        client.config.permLevels.find((l) => l.name === "Manager").level
    ) {
        embed.addField("Helper Commands", "-`=lock [time]`\n-`=unlock`");
    }

    message.channel.send(embed);
};

exports.conf = {
    enabled: true,
    aliases: [],
    permLevel: "User",
    name: "help",
};
