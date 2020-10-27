const fs = require("fs").promises;
const Client = require("./struct/Client");
const client = new Client();
require("./modules/functions.js")();

async function main() {
    const commands = await fs.readdir("./commands");
    console.log(`Loading ${commands.length} commands...`);
    commands.forEach(client.loadCommand);

    const events = await fs.readdir("./events");
    console.log(`Loading ${events.length} events...`);
    events.forEach(event => {
        const name = event.replace(/\.js$/, "");
        const handler = require(`./events/${name}`);
        client.on(name, handler.bind(null, client));
    });

    client.config.permLevels.forEach(level => {
        client.levelCache[level.name] = level.level;
    });

    await client.login(client.config.token);
    console.log("Logged in!");
}

main();
