import Discord from "discord.js"
import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Roles from "../util/roles.util.js"
import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "suggest",
    aliases: [],
    description: "Make a suggestion.",
    permission: Roles.ANY,
    dms: true,
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const modal = new Discord.Modal({
            title: "Suggestion",
            customId: `suggestionmodal.${message.author.id}`,
            components: [
                {
                    type: "ACTION_ROW",
                    components: [
                        {
                            type: "TEXT_INPUT",
                            customId: "anon",
                            label: "Anonymous (Type 'anon' to make it anonymous)",
                            maxLength: null,
                            minLength: null,
                            placeholder: null,
                            required: false,
                            style: "SHORT",
                            value: null
                        }
                    ]
                },
                {
                    type: "ACTION_ROW",
                    components: [
                        {
                            type: "TEXT_INPUT",
                            customId: "title",
                            label: "Title",
                            maxLength: 200,
                            minLength: null,
                            placeholder: null,
                            required: true,
                            style: "PARAGRAPH",
                            value: null
                        }
                    ]
                },
                {
                    type: "ACTION_ROW",
                    components: [
                        {
                            type: "TEXT_INPUT",
                            customId: "body",
                            label: "Suggestion Body",
                            maxLength: null,
                            minLength: null,
                            placeholder: null,
                            required: true,
                            style: "PARAGRAPH",
                            value: null
                        }
                    ]
                },
                {
                    type: "ACTION_ROW",
                    components: [
                        {
                            type: "TEXT_INPUT",
                            customId: "teams",
                            label: "Teams",
                            maxLength: null,
                            minLength: null,
                            placeholder: null,
                            required: true,
                            style: "SHORT",
                            value: null
                        }
                    ]
                }
            ]
        })
        await message.showModal(modal)
    }
})
