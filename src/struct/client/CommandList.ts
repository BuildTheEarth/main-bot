import { ApplicationCommand, ApplicationCommandPermissions, ApplicationCommandPermissionsUpdateData, ApplicationCommandPermissionType, Collection, EditApplicationCommandPermissionsMixin } from "discord.js"
import Command from "../Command.js"
import loadDir from "../../util/loadDir.util.js"
import BotClient from "../BotClient.js"
import CommandUtils from "../../util/commandUtils.util.js"
import BotGuild from "../discord/BotGuild.js"

import pathModule from "path"
import url from "url"
import TranslateUtils from "../../util/TranslateUtils.util.js"
import commandToSlash from "../../util/commandUtils.util.js"
import getBearerToken from "../../util/getBearerToken.util.js"
import { OAuth2API } from "@discordjs/core"
import OAuthToken from "../../entities/OAuthToken.entity.js"

interface PermsObj {
    [name: string]: ApplicationCommandPermissionsUpdateData
}

export default class CommandList extends Collection<string, Command> {
    client: BotClient

    constructor(client: BotClient) {
        super()
        this.client = client
    }

    async load(): Promise<void> {
        const commands = await loadDir<Command>(
            pathModule.dirname(url.fileURLToPath(import.meta.url)) + "/../../commands/",
            this.client,
            TranslateUtils.injectTranslations,
            this
        )

        const bearerToken = await OAuthToken.getToken()

        //const oldCommands = await (await this.client.application.commands.fetch()).map((cmd) => cmd.name)
        const registerPermsMain: PermsObj = {}
        const registerPermsStaff: PermsObj = {}
        const registerCommands = []
        const registerCommandGlobal = []

        for await (const command of commands.values()) {
            ///if (command.name in oldCommands ) continue
            //for (const tmp in command.aliases) if (tmp in oldCommands) continue
            let permsTemp: string[][]
            const permsMain: Array<ApplicationCommandPermissions> = []
            const permsStaff: Array<ApplicationCommandPermissions> = []
            let isStringArr = false
            command.permission.forEach(value => (isStringArr = typeof value != "object"))
            const isStringArrFunc = (roles: string[] | string[][]): roles is string[] =>
                isStringArr
            if (isStringArrFunc(command.permission)) permsTemp = [command.permission]
            else permsTemp = command.permission
            permsTemp.push(this.client.roles.BOT_DEVELOPER)
            for await (const perm of permsTemp) {
                let roleMain
                let roleStaff

                if (await this.client.customGuilds.main())
                    roleMain = BotGuild.role(await this.client.customGuilds.main(), perm)
                if (await this.client.customGuilds.staff())
                    roleStaff = BotGuild.role(await this.client.customGuilds.staff(), perm)
                if (roleMain && permsTemp[0] != globalThis.client.roles.ANY)
                    permsMain.push({
                        id: roleMain.id,
                        type: ApplicationCommandPermissionType.Role,
                        permission: true
                    })
                if (roleStaff && permsTemp[0] != globalThis.client.roles.ANY)
                    permsStaff.push({
                        id: roleStaff.id,
                        type: ApplicationCommandPermissionType.Role,
                        permission: true
                    })
            }
            for await (const cmd of commandToSlash(command)) {
                const pushCmd = cmd
                //NOTE: Discord api major change hack fix
                pushCmd.setDefaultPermission(true)
                //if (permsTemp[0] == globalThis.client.roles.ANY)
                //    pushCmd.setDefaultPermission(true)

                if (command.globalRegister) {
                    const cmdJSON = pushCmd.toJSON()
                    if (command.userInstallContext) {
                        //https://discord.com/developers/docs/tutorials/developing-a-user-installable-app#step-2-setting-up-commands
                        cmdJSON["integration_types"] = [0, 1]
                        cmdJSON["contexts"] = [0, 1, 2]
                    }

                    registerCommandGlobal.push(cmdJSON)
                } else {
                    registerCommands.push(pushCmd.toJSON())
                    if (
                        this.client.customGuilds.staff() &&
                        permsTemp[0] != globalThis.client.roles.ANY
                    )
                        registerPermsStaff[cmd.name] = {
                            id: "",
                            permissions: permsStaff,
                            guildId: this.client.customGuilds.staff().id,
                            applicationId: client.application?.id || ""
                        }
                    if (
                        this.client.customGuilds.main() &&
                        permsTemp[0] != globalThis.client.roles.ANY
                    )
                        registerPermsMain[cmd.name] = {
                            id: "",
                            permissions: permsMain,
                            guildId: this.client.customGuilds.main().id,
                            applicationId: client.application?.id || ""
                        }
                }
            }
        }
        if (this.client.customGuilds.main()) {
            const commands = await this.client.customGuilds
                .main()
                .commands.set(registerCommands)
            for (const cmd of commands.values())
                if (registerPermsMain[cmd.name]) registerPermsMain[cmd.name].id = cmd.id
            
            if (bearerToken != null) {
                const permsToSet = Object.values(registerPermsMain)
                console.log("yahoo")
                // Run permission updates in background to avoid blocking the main flow
                void (async () => {
                    try {
                        this.client.logger?.info("Setting application command permissions (main)...")
                        await Promise.all(
                            permsToSet.map(permission =>
                                this.client.application?.commands.permissions.set({
                                    token: bearerToken,
                                    guild: permission.guildId,
                                    command: permission.id,
                                    permissions: permission.permissions
                                })
                            )
                        )
                        this.client.logger?.info("Set application command permissions (main).")
                    } catch (e: any) {
                        this.client.logger?.error(`Failed to set application command permissions (main): ${e}`)
                    }
                })()
            }
            //NOTE: Discord disabled the endpoint with 0 notice
            //Yeah no discord messed up the endpoint, I don't want auth 
            //Maybe one day i'll do an oauth redirect flow but not today
        }

        if (this.client.customGuilds.staff()) {
            const commands = await this.client.customGuilds
                .staff()
                .commands.set(registerCommands)
            for (const cmd of commands.values())
                if (registerPermsStaff[cmd.name]) registerPermsStaff[cmd.name].id = cmd.id

            if (bearerToken != null) {
                const permsToSetStaff = Object.values(registerPermsStaff)
                void (async () => {
                    try {
                        this.client.logger?.info("Setting application command permissions (staff)...")
                        await Promise.all(
                            permsToSetStaff.map(permission =>
                                this.client.application?.commands.permissions.set({
                                    token: bearerToken,
                                    guild: permission.guildId,
                                    command: permission.id,
                                    permissions: permission.permissions
                                })
                            )
                        )
                        this.client.logger?.info("Set application command permissions (staff).")
                    } catch (e: any) {
                        this.client.logger?.error(`Failed to set application command permissions (staff): ${e}`)
                    }
                })()
            }
        }

        await this.client.application?.commands.set(registerCommandGlobal)
    }

    search(name: string): Command | undefined {
        name = name.toLowerCase()
        return this.find(command => {
            return command.name === name || command.aliases.includes(name)
        })
    }

    async unloadOne(name: string): Promise<void> {
        const path = require.resolve(
            pathModule.join(
                pathModule.dirname(url.fileURLToPath(import.meta.url)) +
                `/../../commands/${name}.${globalThis.fileExtension}`
            )
        )
        const command = this.get(name)
        if (this.client.customGuilds.main()) {
            await this.client.customGuilds.main().commands.delete(
                //@ts-ignore
                this.client.customGuilds
                    .main()
                    .commands.cache.find(command => command.name === name)
            )
            for await (const alias of command?.aliases ? command?.aliases : []) {
                await this.client.customGuilds.main().commands.delete(
                    //@ts-ignore
                    this.client.customGuilds
                        .main()
                        .commands.cache.find(command => command.name === alias)
                )
            }
        }

        if (this.client.customGuilds.staff()) {
            await this.client.customGuilds.staff().commands.delete(
                //@ts-ignore
                this.client.customGuilds
                    .staff()
                    .commands.cache.find(command => command.name === name)
            )
            for await (const alias of command?.aliases ? command?.aliases : []) {
                await this.client.customGuilds.staff().commands.delete(
                    //@ts-ignore
                    this.client.customGuilds
                        .staff()
                        .commands.cache.find(command => command.name === alias)
                )
            }
        }

        delete require.cache[path]
        this.delete(name)
    }

    async loadOne(name: string): Promise<void> {
        let registerPermsMain: ApplicationCommandPermissions[] | null = null
        let registerPermsStaff: ApplicationCommandPermissions[] | null = null

        const registerCommands = []
        const path =
            pathModule.dirname(url.fileURLToPath(import.meta.url)) +
            `/../../commands/${name}.${globalThis.fileExtension}`
        const command: Command = (await import(path)).default
        this.set(command.name, command)
        let permsTemp: string[][]
        const permsMain: Array<ApplicationCommandPermissions> = []
        const permsStaff: Array<ApplicationCommandPermissions> = []
        let isStringArr = false
        command.permission.forEach(value => (isStringArr = typeof value != "object"))
        const isStringArrFunc = (roles: string[] | string[][]): roles is string[] =>
            isStringArr
        if (isStringArrFunc(command.permission)) permsTemp = [command.permission]
        else permsTemp = command.permission
        permsTemp.push(this.client.roles.BOT_DEVELOPER)
        for await (const perm of permsTemp) {
            const roleMain = BotGuild.role(await this.client.customGuilds.main(), perm)
            const roleStaff = BotGuild.role(await this.client.customGuilds.staff(), perm)
            if (roleMain)
                permsMain.push({
                    id: roleMain.id,
                    type: ApplicationCommandPermissionType.Role,
                    permission: true
                })
            if (roleStaff)
                permsStaff.push({
                    id: roleStaff.id,
                    type: ApplicationCommandPermissionType.Role,
                    permission: true
                })
        }

        for await (const cmd of commandToSlash(command)) {
            const pushCmd = cmd
            if (permsTemp[0] == globalThis.client.roles.ANY)
                pushCmd.setDefaultPermission(true)
            registerCommands.push(pushCmd.toJSON())
            if (
                (await this.client.customGuilds.staff()) &&
                permsTemp[0] != globalThis.client.roles.ANY
            )
                registerPermsStaff = permsStaff
            if (
                (await this.client.customGuilds.main()) &&
                permsTemp[0] != globalThis.client.roles.ANY
            )
                registerPermsMain = permsMain
        }

        if (this.client.customGuilds.main()) {
            await Promise.all(
                registerCommands.map(async (cmd) => {
                    const commandRegistered: ApplicationCommand =
                        //@ts-ignore
                        await this.client.customGuilds.main().commands.create(cmd)
                    if (registerPermsMain !== null) {
                        await commandRegistered.permissions.set({
                            permissions: registerPermsMain,
                            token: this.client.token || ""
                        })
                    }
                    return commandRegistered
                })
            )
        }

        if (this.client.customGuilds.staff()) {
            await Promise.all(
                registerCommands.map(async (cmd) => {
                    const commandRegistered: ApplicationCommand =
                        //@ts-ignore
                        await this.client.customGuilds.staff().commands.create(cmd)
                    if (registerPermsStaff !== null) {
                        await commandRegistered.permissions.set({
                            permissions: registerPermsStaff,
                            token: this.client.token || ""
                        })
                    }
                    return commandRegistered
                })
            )
        }
    }
}
