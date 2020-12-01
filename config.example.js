const config = {
    prefix: "",
    ownerIds: ["377551134702829568", "391984806638125066"],
    logChannel: "",

    token: "",
    db: {
        host: "",
        name: "",
        user: "",
        password: "",
    },

    permLevels: [
        {
            level: 0,
            name: "User",
            check: () => true,
        },

        {
            level: 2,
            name: "Staff",
            check: message =>
                message.author.roles.cache.has(r => r.name == "Staff")
                    ? true
                    : false,
        },

        {
            level: 6,
            name: "Helper",
            check: message =>
                message.author.roles.cache.has(r => r.name == "Helper")
                    ? true
                    : false,
        },

        {
            level: 7,
            name: "Moderator",
            check: message =>
                message.author.roles.cache.has(r => r.name == "Moderator")
                    ? true
                    : false,
        },

        {
            level: 8,
            name: "Manager",
            check: message =>
                message.author.roles.cache.has(r => r.name == "Manager")
                    ? true
                    : false,
        },

        {
            level: 9,
            name: "Admin",
            check: message =>
                message.author.roles.cache.has(r => r.name == "Admin")
                    ? true
                    : false,
        },

        {
            level: 10,
            name: "Bot Developer",
            check: message => config.ownerIds.includes(message.author.id),
        },
    ],
};
module.exports = config;
