const Discord = require("discord.js");
const fs = require("fs").promises;
const sql = require("./modules/sql.js");
require("./modules/functions.js")(client);

client.sql = sql;
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.prefix = client.config.prefix;

const client = new Discord.Client({ autoReconnect: true });
client.config = require("./config.js");

const init = async () => {
    const cmdFiles = await fs.readdir("./commands/");
    console.log(`Loading a total of ${cmdFiles.length} commands.`);
    cmdFiles.forEach((f) => {
        if (!f.endsWith(".js")) return;
        const response = client.loadCommand(f);
        if (response) console.log(response);
    });

    const evtFiles = await fs.readdir("./events/");
    console.log(`Loading a total of ${evtFiles.length} events.`);
    evtFiles.forEach((file) => {
        const eventName = file.split(".")[0];
        console.log(`Loading Event: ${eventName}`);
        const event = require(`./events/${file}`);
        client.on(eventName, event.bind(null, client));
    });

    client.levelCache = {};
    for (let i = 0; i < client.config.permLevels.length; i++) {
        const thisLevel = client.config.permLevels[i];
        client.levelCache[thisLevel.name] = thisLevel.level;
    }

    client.login(client.config.token);
};

init();
