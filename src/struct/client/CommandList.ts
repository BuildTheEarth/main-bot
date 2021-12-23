import Discord from "discord.js"
import Command from "../Command"
import loadDir from "../../util/loadDir"
import Client from "../Client"
import CommandUtils from "../../util/CommandUtils"
import Guild from "../discord/Guild"
import Roles from "../../util/roles"

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
            __dirname + "/../../commands/",
            this.client,
            null,
            this
        )

        //const oldCommands = await (await this.client.application.commands.fetch()).map((cmd) => cmd.name)
        const registerPermsMain: PermsObj = {}
        const registerPermsStaff: PermsObj = {}
        const registerCommands = []

        for await (const command of commands.values()) {
            ///if (command.name in oldCommands ) continue
            //for (const tmp in command.aliases) if (tmp in oldCommands) continue
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
            for await (const cmd of CommandUtils.commandToSlash(command)) {
                const pushCmd = cmd
                console.log(cmd.name)
                if (permsTemp[0] == Roles.ANY) pushCmd.setDefaultPermission(true)
                registerCommands.push(pushCmd.toJSON())
                if ((await this.client.customGuilds.staff()) && permsTemp[0] != Roles.ANY)
                    registerPermsStaff[cmd.name] = { id: "", permissions: permsStaff }
                if ((await this.client.customGuilds.main()) && permsTemp[0] != Roles.ANY)
                    registerPermsMain[cmd.name] = { id: "", permissions: permsMain }
            }
            // NOTE: ALSO REGISTER THIS STUFF ACTUALLY
            //commandToSlash(command).forEach(async cmd =>
            /*for await (const cmd of commandToSlash(command)) {
                if (await this.client.customGuilds.main()) {
                    await this.client.application.commands.permissions.set({
                        command: await this.client.application.commands.create(
                            cmd.toJSON(),
                            this.client.config.guilds.main
                        ),
                        guild: this.client.config.guilds.main,
                        permissions: permsMain
                    })
                }
                if (await this.client.customGuilds.staff()) {
                    await this.client.application.commands.permissions.set({
                        command: await this.client.application.commands.create(
                            cmd.toJSON(),
                            this.client.config.guilds.staff
                        ),
                        guild: this.client.config.guilds.staff,
                        permissions: permsStaff
                    })
                }
            }*/
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
            await this.client.customGuilds.main().commands.permissions.set({
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

    //NOTE: fix loadone and unloadone

    async unloadOne(name: string): Promise<void> {
        this.delete(name)
        const path = require.resolve(__dirname + `/../../commands/${name}.js`)
        const command: Command = (await import(path)).default
        await this.client.application.commands.delete(
            this.client.application.commands.cache.find(command => command.name === name)
        )
        for await (const alias of command.aliases) {
            await this.client.application.commands.delete(
                this.client.application.commands.cache.find(
                    command => command.name === alias
                )
            )
        }
        delete require.cache[path]
    }

    async loadOne(name: string): Promise<void> {
        const path = __dirname + `/../../commands/${name}.js`
        const command: Command = (await import(path)).default
        this.set(command.name, command)
        let permsTemp
        const permsMain: Array<Discord.ApplicationCommandPermissionData> = []
        const permsStaff: Array<Discord.ApplicationCommandPermissionData> = []
        if (typeof command.permission === "string") permsTemp = [command.permission]
        else permsTemp = command.permission
        for await (const perm of permsTemp) {
            const roleMain = Guild.role(await this.client.customGuilds.main(), perm)
            const roleStaff = Guild.role(await this.client.customGuilds.staff(), perm)
            if (roleMain)
                permsMain.push({ id: roleMain.id, type: "ROLE", permission: true })
            if (roleStaff)
                permsStaff.push({ id: roleStaff.id, type: "ROLE", permission: true })
        }

        for await (const cmd of CommandUtils.commandToSlash(command)) {
            await this.client.application.commands.permissions.add({
                command: await this.client.application.commands.create(
                    cmd.toJSON(),
                    this.client.config.guilds.main
                ),
                guild: this.client.config.guilds.main,
                permissions: permsMain
            })
            await this.client.application.commands.permissions.add({
                command: await this.client.application.commands.create(
                    cmd.toJSON(),
                    this.client.config.guilds.staff
                ),
                guild: this.client.config.guilds.staff,
                permissions: permsStaff
            })
        }
    }
}
