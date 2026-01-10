const token = ""; 

// Make sure to add the GUILD_MEMBERS intent if you need to fetch members in a specific guild
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers // Required for fetching guild members
    ]
});

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Fetch the application data to populate the 'owner' field
    await client.application.fetch();

    const owner = client.application.owner;

    if (owner.discriminator === '0') {
        // Handle new username system (no discriminator)
        console.log(`The bot owner is: ${owner.username} (ID: ${owner.id})`);
    } else {
        // Handle legacy username system
        console.log(`The bot owner is: ${owner.tag} (ID: ${owner.id})`);
    }

    // If the bot is owned by a team, 'owner' will be a Team object instead of a User
    if (client.application.owner.members) {
        console.log('The bot is owned by a team. Team members:');
        client.application.owner.members.forEach(member => {
            console.log(`- ${member.user.tag} (Role: ${member.membershipState})`);
        });
    }
});

// Log in to Discord with your app's token
client.login(token);
