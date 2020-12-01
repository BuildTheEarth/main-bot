exports.run = async function help(client, message, args, level) {
    const allCommandList = client.commands
        .map(command => `— \`${client.config.prefix}${command.conf.name}\``)
        .join("\n")

    const embed = {
        color: "#1EAD2F",
        fields: [{ name: "All Commands", value: allCommandList }],
    }

    // these 2 are temporary, of course
    const helper = client.config.permLevels.find(l => l.name === "Helper")
    if (level >= helper.level) {
        embed.fields.push({
            name: "Moderation Commands",
            value: "— `=slowmode <time>`",
        })
    }

    const manager = client.config.permLevels.find(l => l.name === "Manager")
    if (level >= manager.level)
        embed.fields.push({
            name: "Management Commands",
            value: "— `=lock [time]`\n— `=unlock`",
        })

    message.channel.send({ embed })
}

exports.conf = {
    enabled: true,
    aliases: [],
    permLevel: "User",
    name: "help",
}
