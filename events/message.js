const Discord = require("discord.js")
module.exports = async (client, message) => {
    if (message.author.bot) return;

    if (message.content.indexOf(client.config.prefix) !== 0) return;

    const args = message.content.slice(1).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const level = client.permlevel(message);

    const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command));
    if (!cmd) {
        let lang = args[0] || "en";
        lang = lang.toLowerCase();
        client.sql.query('select * from Commands where Command = ? and Language = ?', [command, lang], (err, res) => {
            if (err) {
                const embed = new Discord.MessageEmbed()
                    .setColor(0x14ff00)
                    .setAuthor(message.author.username, message.author.displayAvatarURL())
                    .setTitle("🚫 An error occurred!")
                    .setDescription("Please contact one of the bot developers for help.")
                message.channel.send(embed);
            }

            if (res.length !== 0) {
                let user = message.mentions.users.first() ? message.mentions.users.first().id : args.length === 1 ? "123456" : args[1];
                message.guild.members.fetch(user).then(m => {
                    message.channel.send(res[0].Response)
                }).catch(e => {
                    message.channel.send(res[0].Response)
                })
            }
        });
        return;
    }
    if (level < client.levelCache[cmd.conf.permLevel]) {
        return
    }

    message.author.permLevel = level;

    console.log(`${client.config.permLevels.find(l => l.level === level).name} ${message.author.username}(${message.author.id}) ran command ${command}`);

    cmd.run(client, message, args, level);
};