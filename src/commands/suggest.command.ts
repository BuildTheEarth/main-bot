import Client from "../struct/Client.js"
import Command from "../struct/Command.js"
import Args from "../struct/Args.js"
import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "suggest",
    aliases: [],
    args: [
        {
            name: "anon",
            description: "Wheter the suggestion is anonymous or not.",
            required: false,
            optionType: "STRING",
            choices: ["anon"]
        },
        {
            name: "number",
            description: "Suggestion number, only to be used if sub-suggesting.",
            required: false,
            optionType: "STRING"
        }
    ],
    description: "Make a suggestion.",
    permission: globalThis.client.roles.ANY,
    dms: true,
    async run(this: Command, _client: Client, message: CommandMessage, args: Args) {
        const anon = args.consume("anon")
        const subsuggestion = args.consume("number")
        const modalId = await message.showModal("suggest")
        return client.interactionInfo.set(modalId, {
            anon: anon,
            subsuggestion: subsuggestion,
            modalType: "suggestmodal"
        })
    }
})
