const Discord = require("discord.js")
exports.run = async (client, message, args, level) => {
    const code = args.join(" ")
    try {
        const evaled = eval(code)
        const clean = await client.clean(client, evaled)
        if (clean.length > 1024) {
            message.channel.send(clean, {
                code: "js",
                split: {
                    maxLength: 1024,
                    char: " ",
                },
            })
        } else {
            let embed = new Discord.MessageEmbed()
                .setAuthor(
                    message.author.username,
                    message.author.displayAvatarURL()
                )
                .setColor(0x11ff00)
                .setTitle("Eval - Success")
                .addField("Input", `\`\`\`js\n${code}\`\`\``)
                .addField("Output", `\`\`\`js\n${clean}\n\`\`\``)
            message.channel.send(embed)
        }
    } catch (err) {
        let embed = new Discord.MessageEmbed()
            .setAuthor(
                message.author.username,
                message.author.displayAvatarURL()
            )
            .setColor(0xff0000)
            .setTitle("Eval - Error")
            .setDescription(
                `\`\`\`xl\n${await client.clean(client, err)}\n\`\`\``
            )
        message.channel.send(embed)
    }
}

exports.conf = {
    enabled: true,
    name: "eval",
    aliases: [],
    permLevel: "Owner",
}
