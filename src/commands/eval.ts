import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Client from "../struct/Client"
import Command from "../struct/Command"

import ActionLog from "../entities/ActionLog"
import ModerationNote from "../entities/ModerationNote"
import ModpackImage from "../entities/ModpackImage"
import Snippet from "../entities/Snippet"
import Suggestion from "../entities/Suggestion"
import TimedPunishment from "../entities/TimedPunishment"

import CommandList from "../struct/client/CommandList"
import ConfigManager from "../struct/client/ConfigManager"
import EventList from "../struct/client/EventList"

import flattenMarkdown from "../util/flattenMarkdown"
import formatPunishmentTime from "../util/formatPunishmentTime"
import formatUTCDate from "../util/formatUTCDate"
import humanizeArray from "../util/humanizeArray"
import humanizeConstant from "../util/humanizeConstant"
import isURL from "../util/isURL"
import loadDir from "../util/loadDir"
import noop from "../util/noop"
import pastTense from "../util/pastTense"
import patchedISO6391 from "../util/patchedISO6391"
import Roles from "../util/roles"
import stringifyAnything from "../util/stringifyAnything"
import truncateString from "../util/truncateString"

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ = { Args, Client, Command, ActionLog, ModerationNote, ModpackImage, Snippet, Suggestion, TimedPunishment, CommandList, ConfigManager, EventList, flattenMarkdown, formatPunishmentTime, formatUTCDate, humanizeArray, humanizeConstant, isURL, loadDir, noop, pastTense, patchedISO6391, Roles, stringifyAnything, truncateString }

export default new Command({
    name: "eval",
    aliases: ["run"],
    description: "Evaluate JavaScript code.",
    permission: Roles.BOT_DEVELOPER,
    usage: "<code>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const code = args.removeCodeblock()

        try {
            const wrapped = code.includes("await") ? `(async () => {${code}})()` : code

            const tokenRegex = new RegExp(client.token, "g")
            const modpackRegex = new RegExp(client.config.modpackAuth, "g")
            const pwRegex = new RegExp(client.config.database.pass, "g")
            const out = stringifyAnything(await eval(wrapped))
                .replace(tokenRegex, "")
                .replace(modpackRegex, "")
                .replace(pwRegex, "")

            message.channel.sendSuccess({
                author: { name: "Output" },
                description: `\`\`\`js\n${truncateString(out, 1990)}\n\`\`\``
            })
        } catch (error) {
            const err = `${error.name || "Error"}: ${error.message}`

            message.channel.sendError({
                author: { name: "Error" },
                description: `\`\`\`${truncateString(err, 1994)}\`\`\``
            })
        }
    }
})
