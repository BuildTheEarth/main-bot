const Discord = require("discord.js")
const ms = require("ms")
exports.run = async (client, message, args, level) => {
    try {
        client.guilds.cache
            .get(message.guild.id)
            .channels.resolve(message.channel.id)
            .updateOverwrite(message.guild.id, {
                SEND_MESSAGES: false,
            })
    } catch (error) {
        console.log(error)
    }

    let embed = new Discord.MessageEmbed()
        .setAuthor(message.author.username, message.author.displayAvatarURL())
        .setColor(0x14ff00)
        .setTitle("Channel has been locked!")

    let time = args[0]
    if (time) {
        let millis = ms(time)
        setTimeout(async () => {
            try {
                client.guilds.cache
                    .get(message.guild.id)
                    .channels.resolve(message.channel.id)
                    .updateOverwrite(message.guild.id, {
                        SEND_MESSAGES: true,
                    })
            } catch (error) {
                console.log(error)
            }
        }, millis)
        embed.addField("Time Locked", ms(millis, { long: true }))
    }

    message.channel.send(embed)
}

exports.conf = {
    enabled: true,
    aliases: [],
    permLevel: "Manager",
    name: "lock",
}
