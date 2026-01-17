import BotClient from "../BotClient.js"
import pathModule from "path"
import url from "url"
import fs from "fs"
import { loadSyncJSON5 } from "@buildtheearth/bot-utils"
import loadDir from "../../util/loadDir.util.js"
import _ from "lodash"
import { InteractionType, Interaction, Collection, ContextMenuCommandType, ContextMenuCommandInteraction, ApplicationCommandPermissions, ApplicationCommandPermissionType } from "discord.js"
import { Context } from "vm"
import BotGuild from "../discord/BotGuild.js"

export interface ContextMenuCommandProperties {
    name: string
    type: ContextMenuCommandType
    permissions: string[] | string[][]
    run: (client: BotClient, interaction: ContextMenuCommandInteraction) => void
}

export class ContextMenuCommand implements ContextMenuCommandProperties {
    name: string
    type: ContextMenuCommandType
    permissions: string[] | string[][]
    run: (client: BotClient, interaction: ContextMenuCommandInteraction) => void

    constructor(props: ContextMenuCommandProperties) {
        this.name = props.name
        this.type = props.type
        this.permissions = props.permissions
        this.run = props.run.bind(this)
    }
}

export default class ContextMenuCommandList {
    client: BotClient
    collection: Collection<string, ContextMenuCommand> = new Collection()
    constructor(client: BotClient) {
        this.client = client
    }

    async load(): Promise<void> {
        this.collection = await loadDir<ContextMenuCommand>(
            pathModule.dirname(url.fileURLToPath(import.meta.url)) +
            "/../../contextmenucommands/",
            this.client
        )
    }

    async register(token: string | null): Promise<void> {
        const commandsData = this.collection.map((cmd) => ({
            name: cmd.name,
            type: cmd.type,
            permissions: cmd.permissions,
            mainId: null as (string | null),
            staffId: null as (string | null)
        }))

        if (this.client.customGuilds.main()) {
            await this.client.customGuilds.main().commands.fetch()

        }
        if (this.client.customGuilds.staff()) {
            await this.client.customGuilds.staff().commands.fetch()
        }

            

        for (const command of commandsData) {
            let permsMain: ApplicationCommandPermissions[] = []
            let permsStaff: ApplicationCommandPermissions[] = []


            if (this.client.customGuilds.main()) {
                const findCmd = this.client.customGuilds.main().commands.cache.find(cmd => cmd.name === command.name && cmd.type === command.type)
                console.log(findCmd)
                if (findCmd) {
                    command.mainId = findCmd.id
                    await this.client.customGuilds.main().commands.edit(findCmd.id, {
                        name: command.name,
                        type: command.type
                    })
                } else {
                    const cmd = await this.client.customGuilds.main().commands.create(command)
                    command.mainId = cmd.id
                }
            }

            if (this.client.customGuilds.staff()) {
                const findCmd = this.client.customGuilds.staff().commands.cache.find(cmd => cmd.name === command.name && cmd.type === command.type)
                if (findCmd) {
                    command.staffId = findCmd.id
                    await this.client.customGuilds.staff().commands.edit(findCmd.id, {
                        name: command.name,
                        type: command.type
                    })
                } else {
                    const cmd = await this.client.customGuilds.staff().commands.create(command)
                    command.staffId = cmd.id
                }
            }


            let permsTemp: string[][]
            let isStringArr = false
            command.permissions.forEach(value => (isStringArr = typeof value != "object"))
            const isStringArrFunc = (roles: string[] | string[][]): roles is string[] => isStringArr
            if (isStringArrFunc(command.permissions)) permsTemp = [command.permissions]
            else permsTemp = command.permissions
            permsTemp.push(this.client.roles.BOT_DEVELOPER)

            for await (const perm of permsTemp) {
                if (this.client.customGuilds.main() && permsTemp[0] != globalThis.client.roles.ANY) {
                    const role = BotGuild.role(this.client.customGuilds.main(), perm)
                    if (role) {
                        permsMain.push({
                            id: role.id,
                            type: ApplicationCommandPermissionType.Role,
                            permission: true
                        })
                    }
                }
                if (this.client.customGuilds.staff() && permsTemp[0] != globalThis.client.roles.ANY) {
                    const role = BotGuild.role(this.client.customGuilds.staff(), perm)
                    if (role) {
                        permsStaff.push({
                            id: role.id,
                            type: ApplicationCommandPermissionType.Role,
                            permission: true
                        })
                    }
                }
            }

            client.logger.info(`Registered context menu command: ${command.name}`)


            if (token) void (async () => {
                if (this.client.customGuilds.main()) {
                    //If the command isn't for everyone, restrict by default
                    if (!permsTemp.includes(globalThis.client.roles.ANY)) {
                        permsMain.push({
                            id: this.client.customGuilds.main().roles.everyone.id,
                            type: ApplicationCommandPermissionType.Role,
                            permission: false
                        })
                    }
                    try {
                        await this.client.customGuilds.main().commands.permissions.set({
                            token: token,
                            command: command.mainId!,
                            permissions: permsMain
                        })
                    }
                    catch (e) {
                        console.error(`Failed to set permissions for command ${command.name} in main guild:`, e)
                    }


                }

                if (this.client.customGuilds.staff()) {
                    //If the command isn't for everyone, restrict by default
                    if (!permsTemp.includes(globalThis.client.roles.ANY)) {
                        permsStaff.push({
                            id: this.client.customGuilds.staff().roles.everyone.id,
                            type: ApplicationCommandPermissionType.Role,
                            permission: false
                        })
                    }
                    try {
                        await this.client.customGuilds.staff().commands.permissions.set({
                            token: token,
                            command: command.staffId!,
                            permissions: permsStaff
                        })
                    }
                    catch (e) {
                        console.error(`Failed to set permissions for command ${command.name} in staff guild:`, e)
                    }
                }
            })()
        }

    }


    getByName(name: string): ContextMenuCommand | null {
        return this.collection.find((cmd) => cmd.name === name) || null
    }

}
