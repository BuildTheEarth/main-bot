const Discord = require("discord.js")
exports.run = async (client, message, args, level) => {
    const msg = await message.channel.send("Pinging")
    msg.edit(`Pong! ${msg.createdTimestamp - message.createdTimestamp}ms.`)
}

exports.conf = {
    enabled: true,
    aliases: [],
    permLevel: "User",
    name: "ping",
}
