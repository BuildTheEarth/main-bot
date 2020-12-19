/* eslint-disable @typescript-eslint/no-unused-vars */
import Message from "../struct/discord/Message"

import ActionLog from "../entities/ActionLog"
import ModerationNote from "../entities/ModerationNote"
import ModpackImage from "../entities/ModpackImage"
import Snippet from "../entities/Snippet"
import Suggestion from "../entities/Suggestion"
import TimedPunishment from "../entities/TimedPunishment"

import CommandList from "../struct/client/CommandList"
import ConfigManager from "../struct/client/ConfigManager"
import EventList from "../struct/client/EventList"

import Args from "../struct/Args"
import Client from "../struct/Client"
import Command from "../struct/Command"

import formatPunishmentTime from "../util/formatPunishmentTime"
import formatUTCDate from "../util/formatUTCDate"
import humanizeConstant from "../util/humanizeConstant"
import isURL from "../util/isURL"
import loadDir from "../util/loadDir"
import noop from "../util/noop"
import Roles from "../util/roles"
import truncateString from "../util/truncateString"
/* eslint-enable @typescript-eslint/no-unused-vars */

export default new Command({
    name: "eval",
    aliases: ["run"],
    description: "Evaluate JavaScript code.",
    permission: Roles.BOT_DEVELOPER,
    usage: "<code>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const code = args.removeCodeblock()

        try {
            const out = String(await eval(code)) || "\u200B"
            message.channel.sendSuccess({
                author: { name: "Output" },
                description: `\`\`\`js\n${truncateString(out, 1990)}\n\`\`\``
            })
        } catch (error) {
            const err = error.message || "\u200B"
            message.channel.sendError({
                author: { name: "Error" },
                description: `\`\`\`${truncateString(err, 1994)}\`\`\``
            })
        }
    }
})
