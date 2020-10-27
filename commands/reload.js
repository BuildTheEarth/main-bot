exports.run = async (client, message, args, level) => {
    // eslint-disable-line no-unused-vars
    if (!args || args.length < 1)
        return message.reply("Provide a command to reload.");
    const command =
        client.commands.get(args[0]) ||
        client.commands.get(client.aliases.get(args[0]));
    let response = await client.unloadCommand(args[0]);
    if (response) return message.reply(`Error Unloading: ${response}`);

    response = client.loadCommand(command.conf.name);
    if (response) return message.reply(`Error Loading: ${response}`);

    message.reply(`The command \`${command.conf.name}\` has been reloaded`);
};

exports.conf = {
    enabled: true,
    name: "reload",
    aliases: [],
    permLevel: "Admin",
};
