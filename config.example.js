const config = {
    token: "", // discord bot token
    dbHost: "", // ip for mysql server, localhost if hosted on the same device
    dbUser: "", // user for mysql server
    dbPass: "", // password for mysql server
    dbName: "", // name of the database to use
    prefix: "=", // prefix of the bot
    ownerIds: [], // array of discord ids
    logChannel: "", // channel id

    permLevels: [
        {
            level: 0,
            name: "User",
            check: () => true,
        },

        {
            level: 2,
            name: "Staff",
            check: (message) =>
                message.author.roles.cache.has((r) => r.name == "Staff")
                    ? true
                    : false,
        },

        {
            level: 6,
            name: "Helper",
            check: (message) =>
                message.author.roles.cache.has((r) => r.name == "Helper")
                    ? true
                    : false,
        },

        {
            level: 7,
            name: "Moderator",
            check: (message) =>
                message.author.roles.cache.has((r) => r.name == "Moderator")
                    ? true
                    : false,
        },

        {
            level: 8,
            name: "Manager",
            check: (message) =>
                message.author.roles.cache.has((r) => r.name == "Manager")
                    ? true
                    : false,
        },

        {
            level: 9,
            name: "Admin",
            check: (message) =>
                message.author.roles.cache.has((r) => r.name == "Admin")
                    ? true
                    : false,
        },

        {
            level: 10,
            name: "Bot Developer",
            check: (message) => config.ownerIds.includes(message.author.id),
        },
    ],
};
module.exports = config;
