import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"
import JSON5 from "json5"
import { truncateString } from "@buildtheearth/bot-utils"

export default new Command({
    name: "query",
    aliases: [],
    description: "Evaluate an SQL query.",
    permission: globalThis.client.roles.BOT_DEVELOPER,
    devOnly: true,
    args: [
        {
            name: "query",
            description: "SQl query.",
            required: true,
            optionType: "STRING"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const query = args.removeCodeblock(args.consumeRest(["query"]))

        if (!client.db) return // ok this really should never happen but TS strict mode!

        await message.continue()

        try {
            const out = JSON5.stringify(await client.db.query(query), null, 2)
            await message.sendSuccess({
                author: { name: "Output" },
                description: `\`\`\`${truncateString(out, 1994)}\`\`\``
            })
        } catch (error) {
            if (error instanceof Error) {
                const err = error.message || "\u200B"
                await message.sendError(
                    {
                        author: { name: "Error" },
                        description: `\`\`\`${truncateString(err, 1994)}\`\`\``
                    },
                    false
                )
            }
        }
    }
})
