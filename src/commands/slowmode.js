const Discord = require("discord.js");
exports.run = async (client, message, args, level) => {
    let time = args[0];
    if (isNaN(time)) {
        const embed = new Discord.MessageEmbed()
            .setColor(0x14ff00)
            .setAuthor(
                message.author.username,
                message.author.displayAvatarURL()
            )
            .setTitle("Invalid length!")
            .setDescription(
                "Correct usage: `=slowmode <time>`\n*(Use 0 to disable)*"
            );

        return message.channel.send(embed);
    }

    const embed = new Discord.MessageEmbed()
        .setColor(0x14ff00)
        .setAuthor(message.author.username, message.author.displayAvatarURL())
        .setTitle(
            `Set slowmode in #${message.channel.name} to ${time} seconds!`
        );
    message.channel.setRateLimitPerUser(time);
    message.channel.send(embed);
};

exports.conf = {
    enabled: true,
    aliases: [],
    permLevel: "Helper",
    name: "slowmode",
};
