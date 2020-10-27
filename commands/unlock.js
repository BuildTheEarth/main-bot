const Discord = require("discord.js");
exports.run = async (client, message, args, level) => {
    try {
        client.guilds.cache
            .get(message.guild.id)
            .channels.resolve(message.channel.id)
            .updateOverwrite(message.guild.id, {
                SEND_MESSAGES: null,
            });
    } catch (error) {
        console.log(error);
    }

    let embed = new Discord.MessageEmbed()
        .setAuthor(message.author.username, message.author.displayAvatarURL())
        .setColor(0x14ff00)
        .setTitle("Channel has been unlocked!");

    message.channel.send(embed);
};

exports.conf = {
    enabled: true,
    aliases: [],
    permLevel: "Manager",
    name: "unlock",
};
