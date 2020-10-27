const fs = require("fs").promises;
const Client = require("./struct/Client");
const client = new Client();
require("./modules/functions.js")();

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

    for (const level of client.config.permLevels)
        client.levelCache[thisLevel.name] = level.level;

    client.login(client.config.token);
};

init();
