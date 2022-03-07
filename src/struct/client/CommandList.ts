import Discord from "discord.js"
import Command from "../Command.js"
import loadDir from "../../util/loadDir.util.js"
import Client from "../Client.js"
import CommandUtils from "../../util/CommandUtils.util.js"
import Guild from "../discord/Guild.js"
import Roles from "../../util/roles.util.js"
import pathModule from "path"
import url from "url"

interface PermsObj {
    [name: string]: Discord.GuildApplicationCommandPermissionData
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
            null,
            this
        )

        const registerPermsMain: PermsObj = {}
        const registerPermsStaff: PermsObj = {}
        const registerCommands = []

        for await (const command of commands.values()) {
            let permsTemp
            const permsMain: Array<Discord.ApplicationCommandPermissionData> = []
            const permsStaff: Array<Discord.ApplicationCommandPermissionData> = []
            if (typeof command.permission === "string") permsTemp = [command.permission]
            else permsTemp = command.permission
            permsTemp.push("Bot Developer")
            for await (const perm of permsTemp) {
                let roleMain
                let roleStaff

                if (await this.client.customGuilds.main())
                    roleMain = Guild.role(await this.client.customGuilds.main(), perm)
                if (await this.client.customGuilds.staff())
                    roleStaff = Guild.role(await this.client.customGuilds.staff(), perm)
                if (roleMain && permsTemp[0] != Roles.ANY)
                    permsMain.push({ id: roleMain.id, type: "ROLE", permission: true })
                if (roleStaff && permsTemp[0] != Roles.ANY)
                    permsStaff.push({ id: roleStaff.id, type: "ROLE", permission: true })
            }
            const cmd = CommandUtils.commandToSlash(command)
            const pushCmd = cmd
            if (permsTemp[0] == Roles.ANY) pushCmd.setDefaultPermission(true)
            registerCommands.push(pushCmd.toJSON())
            if ((await this.client.customGuilds.staff()) && permsTemp[0] != Roles.ANY)
                registerPermsStaff[cmd.name] = { id: "", permissions: permsStaff }
            if ((await this.client.customGuilds.main()) && permsTemp[0] != Roles.ANY)
                registerPermsMain[cmd.name] = { id: "", permissions: permsMain }
        }
        if (this.client.customGuilds.main()) {
            const commands = await this.client.customGuilds
                .main()
                .commands.set(registerCommands)
            for (const cmd of commands.values())
                if (registerPermsMain[cmd.name]) registerPermsMain[cmd.name].id = cmd.id
            await this.client.customGuilds.main().commands.permissions.set({
                fullPermissions: Object.values(registerPermsMain)
            })
        }

        if (this.client.customGuilds.staff()) {
            const commands = await this.client.customGuilds
                .staff()
                .commands.set(registerCommands)
            for (const cmd of commands.values())
                if (registerPermsStaff[cmd.name]) registerPermsStaff[cmd.name].id = cmd.id
            await this.client.customGuilds.staff().commands.permissions.set({
                fullPermissions: Object.values(registerPermsStaff)
            })
        }
    }

    search(name: string): Command {
        name = name.toLowerCase()
        return this.find(command => {
            return command.name === name || command.aliases.includes(name)
        })
    }

    async unloadOne(name: string): Promise<void> {
        const path = require.resolve(
            pathModule.join(
                pathModule.dirname(url.fileURLToPath(import.meta.url)) +
                    `/../../commands/${name}.command.${globalThis.fileExtension}`
            )
        )
        if (this.client.customGuilds.main()) {
            await this.client.customGuilds
                .main()
                .commands.delete(
                    this.client.customGuilds
                        .main()
                        .commands.cache.find(command => command.name === name)
                )
        }

        if (this.client.customGuilds.staff()) {
            await this.client.customGuilds
                .staff()
                .commands.delete(
                    this.client.customGuilds
                        .staff()
                        .commands.cache.find(command => command.name === name)
                )
        }

        delete require.cache[path]
        this.delete(name + ".command")
    }

    async loadOne(name: string): Promise<void> {
        let registerPermsMain: Discord.ApplicationCommandPermissionData[] = null
        let registerPermsStaff: Discord.ApplicationCommandPermissionData[] = null

        const registerCommands = []
        const path =
            pathModule.dirname(url.fileURLToPath(import.meta.url)) +
            `/../../commands/${name}.command.${globalThis.fileExtension}`
        const command: Command = (await import(path)).default
        this.set(command.name + ".command", command)
        let permsTemp: string[]
        const permsMain: Array<Discord.ApplicationCommandPermissionData> = []
        const permsStaff: Array<Discord.ApplicationCommandPermissionData> = []
        if (typeof command.permission === "string") permsTemp = [command.permission]
        else permsTemp = command.permission
        permsTemp.push("Bot Developer")
        for await (const perm of permsTemp) {
            const roleMain = Guild.role(this.client.customGuilds.main(), perm)
            const roleStaff = Guild.role(this.client.customGuilds.staff(), perm)
            if (roleMain)
                permsMain.push({ id: roleMain.id, type: "ROLE", permission: true })
            if (roleStaff)
                permsStaff.push({ id: roleStaff.id, type: "ROLE", permission: true })
        }

        const cmd = CommandUtils.commandToSlash(command)
        const pushCmd = cmd
        if (permsTemp[0] == Roles.ANY) pushCmd.setDefaultPermission(true)
        registerCommands.push(pushCmd.toJSON())
        if ((await this.client.customGuilds.staff()) && permsTemp[0] != Roles.ANY)
            registerPermsStaff = permsStaff
        if ((await this.client.customGuilds.main()) && permsTemp[0] != Roles.ANY)
            registerPermsMain = permsMain

        if (this.client.customGuilds.main()) {
            for (const cmd of registerCommands) {
                const commandRegistered: Discord.ApplicationCommand =
                    await this.client.customGuilds.main().commands.create(cmd)
                if (registerPermsMain !== null)
                    await commandRegistered.permissions.set({
                        permissions: registerPermsMain
                    })
            }
        }

        if (this.client.customGuilds.staff()) {
            for (const cmd of registerCommands) {
                const commandRegistered: Discord.ApplicationCommand =
                    await this.client.customGuilds.staff().commands.create(cmd)
                if (registerPermsStaff !== null)
                    await commandRegistered.permissions.set({
                        permissions: registerPermsStaff
                    })
            }
        }
    }
}
