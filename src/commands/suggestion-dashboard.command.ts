import Command from "../struct/Command.js"

export default new Command({
    name: "suggestion-dashboard",
    aliases: [],
    description: "Browse and search Main and Staff suggestions privately.",

    permission: globalThis.client.roles.ANY,
    args: [
        {
            name: "publish",
            description:
                "Post or find this week's menus in Main and Staff (Staff Admins/Managers).",
            required: false,
            optionType: "BOOLEAN"
        }
    ],
    async run(client, message, args) {
        await client.suggestionDashboard.openDashboard(
            message.message,
            args.consumeBoolean("publish")
        )
    }
})
