const sql = require("../modules/sql.js");
const util = require("util");
const config = require("../config.js");
const Discord = require("discord.js");

module.exports = class Client extends Discord.Client {
    sql = sql;
    config = config;
    commands = new Discord.Collection();
    aliases = new Discord.Collection();
    prefix = this.config.prefix;
    levelCache = {};

    async wait(timeout) {
        await util.promisify(setTimeout)(timeout);
    }

    async permlevel(message) {
        let permlvl = 0;
        const permOrder = client.config.permLevels
            .slice(0)
            .sort((p, c) => (p.level < c.level ? 1 : -1));

        while (permOrder.length) {
            const currentLevel = permOrder.shift();
            if (message.guild && currentLevel.guildOnly) continue;
            if (currentLevel.check(message)) {
                permlvl = currentLevel.level;
                break;
            }
        }
        return permlvl;
    }

    async clean(client, text) {
        if (text && text.constructor.name == "Promise") text = await text;
        if (typeof evaled !== "string")
            text = require("util").inspect(text, { depth: 1 });

        text = text
            .replace(/`/g, "`" + String.fromCharCode(8203))
            .replace(/@/g, "@" + String.fromCharCode(8203))
            .replace(client.token, "why u tryna steal token");

        return text;
    }

    async loadCommand(commandName) {
        try {
            console.log(`Loading Command: ${commandName}`);
            const props = require(`../commands/${commandName}`);
            if (props.init) {
                props.init(client);
            }
            client.commands.set(props.conf.name, props);
            props.conf.aliases.forEach((alias) => {
                client.aliases.set(alias, props.conf.name);
            });
            return false;
        } catch (e) {
            return `Unable to load command ${commandName}: ${e}`;
        }
    }

    async unloadCommand(commandName) {
        let command;
        if (client.commands.has(commandName)) {
            command = client.commands.get(commandName);
        } else if (client.aliases.has(commandName)) {
            command = client.commands.get(client.aliases.get(commandName));
        }
        if (!command)
            return `The command \`${commandName}\` doesn"t seem to exist, nor is it an alias. Try again!`;

        if (command.shutdown) {
            await command.shutdown(client);
        }
        const mod =
            require.cache[require.resolve(`../commands/${command.conf.name}`)];
        delete require.cache[
            require.resolve(`../commands/${command.conf.name}.js`)
        ];
        for (let i = 0; i < mod.parent.children.length; i++) {
            if (mod.parent.children[i] === mod) {
                mod.parent.children.splice(i, 1);
                break;
            }
        }
        return false;
    }
};
