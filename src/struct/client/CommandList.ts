import Discord from "discord.js"
import Command from "../Command.js"
import loadDir from "../../util/loadDir.util.js"
import Client from "../Client.js"
import CommandUtils from "../../util/CommandUtils.util.js"
import Guild from "../discord/Guild.js"

import pathModule from "path"
import url from "url"
import TranslateUtils from "../../util/TranslateUtils.util.js"

interface PermsObj {
    [name: string]: Discord.ApplicationCommandPermissionsUpdateData
}

export default class CommandList extends Discord.Collection<string, Command> {
    client: Client

    constructor(client: Client) {
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

        //const oldCommands = await (await this.client.application.commands.fetch()).map((cmd) => cmd.name)
        const registerPermsMain: PermsObj = {}
        const registerPermsStaff: PermsObj = {}
        const registerCommands = []

        for await (const command of commands.values()) {
            ///if (command.name in oldCommands ) continue
            //for (const tmp in command.aliases) if (tmp in oldCommands) continue
            let permsTemp: string[][]
            const permsMain: Array<Discord.ApplicationCommandPermissions> = []
            const permsStaff: Array<Discord.ApplicationCommandPermissions> = []
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
                    roleMain = Guild.role(await this.client.customGuilds.main(), perm)
                if (await this.client.customGuilds.staff())
                    roleStaff = Guild.role(await this.client.customGuilds.staff(), perm)
                if (roleMain && permsTemp[0] != globalThis.client.roles.ANY)
                    permsMain.push({
                        id: roleMain.id,
                        type: Discord.ApplicationCommandPermissionType.Role,
                        permission: true
                    })
                if (roleStaff && permsTemp[0] != globalThis.client.roles.ANY)
                    permsStaff.push({
                        id: roleStaff.id,
                        type: Discord.ApplicationCommandPermissionType.Role,
                        permission: true
                    })
            }
            for await (const cmd of CommandUtils.commandToSlash(command)) {
                const pushCmd = cmd
                //NOTE: Discord api major change hack fix
                pushCmd.setDefaultPermission(true)
                //if (permsTemp[0] == globalThis.client.roles.ANY)
                //    pushCmd.setDefaultPermission(true)
                registerCommands.push(pushCmd.toJSON())
                if (
                    (await this.client.customGuilds.staff()) &&
                    permsTemp[0] != globalThis.client.roles.ANY
                )
                    registerPermsStaff[cmd.name] = {
                        id: "",
                        permissions: permsStaff,
                        guildId: this.client.customGuilds.staff().id,
                        applicationId: client.application?.id || ""
                    }
                if (
                    (await this.client.customGuilds.main()) &&
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
        if (this.client.customGuilds.main()) {
            const commands = await this.client.customGuilds
                .main()
                .commands.set(registerCommands)
            for (const cmd of commands.values())
                if (registerPermsMain[cmd.name]) registerPermsMain[cmd.name].id = cmd.id
            //await this.client.customGuilds.main().commands.permissions.set({
            //    fullPermissions: Object.values(registerPermsMain)
            //})
            //NOTE: Discord disabled the endpoint with 0 notice
        }

        if (this.client.customGuilds.staff()) {
            const commands = await this.client.customGuilds
                .staff()
                .commands.set(registerCommands)
            for (const cmd of commands.values())
                if (registerPermsStaff[cmd.name]) registerPermsStaff[cmd.name].id = cmd.id
            // await this.client.customGuilds.staff().commands.permissions.set({
            //    fullPermissions: Object.values(registerPermsStaff)
            //})
            //NOTE: Discord disabled the endpoint with 0 notice
        }
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
        let registerPermsMain: Discord.ApplicationCommandPermissions[] | null = null
        let registerPermsStaff: Discord.ApplicationCommandPermissions[] | null = null

        const registerCommands = []
        const path =
            pathModule.dirname(url.fileURLToPath(import.meta.url)) +
            `/../../commands/${name}.${globalThis.fileExtension}`
        const command: Command = (await import(path)).default
        this.set(command.name, command)
        let permsTemp: string[][]
        const permsMain: Array<Discord.ApplicationCommandPermissions> = []
        const permsStaff: Array<Discord.ApplicationCommandPermissions> = []
        let isStringArr = false
        command.permission.forEach(value => (isStringArr = typeof value != "object"))
        const isStringArrFunc = (roles: string[] | string[][]): roles is string[] =>
            isStringArr
        if (isStringArrFunc(command.permission)) permsTemp = [command.permission]
        else permsTemp = command.permission
        permsTemp.push(this.client.roles.BOT_DEVELOPER)
        for await (const perm of permsTemp) {
            const roleMain = Guild.role(await this.client.customGuilds.main(), perm)
            const roleStaff = Guild.role(await this.client.customGuilds.staff(), perm)
            if (roleMain)
                permsMain.push({
                    id: roleMain.id,
                    type: Discord.ApplicationCommandPermissionType.Role,
                    permission: true
                })
            if (roleStaff)
                permsStaff.push({
                    id: roleStaff.id,
                    type: Discord.ApplicationCommandPermissionType.Role,
                    permission: true
                })
        }

        for await (const cmd of CommandUtils.commandToSlash(command)) {
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
            for (const cmd of registerCommands) {
                const commandRegistered: Discord.ApplicationCommand =
                    //@ts-ignore
                    await this.client.customGuilds.main().commands.create(cmd)
                if (registerPermsMain !== null)
                    await commandRegistered.permissions.set({
                        permissions: registerPermsMain,
                        token: client.token || ""
                    })
            }
        }

        if (this.client.customGuilds.staff()) {
            for (const cmd of registerCommands) {
                const commandRegistered: Discord.ApplicationCommand =
                    //@ts-ignore
                    await this.client.customGuilds.staff().commands.create(cmd)
                if (registerPermsStaff !== null)
                    await commandRegistered.permissions.set({
                        permissions: registerPermsStaff,
                        token: client.token || ""
                    })
            }
        }
    }
}
