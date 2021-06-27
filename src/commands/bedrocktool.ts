import path from "path"
import { JavaCaller } from "java-caller"
import fs from "fs"
import NodeGoogleDrive from "google-drive-connect"
import Discord from "discord.js"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import TextChannel from "../struct/discord/TextChannel"

const bedrockToolPath = path.join(__dirname, "../../assets/BedrockTool/BedrockTool.jar")
const bedrockToolCWD = path.join(__dirname, "../../assets/BedrockTool")

const java = new JavaCaller({
    useAbsoluteClassPaths: true,
    classPath: bedrockToolPath,
    mainClass: "io.github.rudeyeti.bedrocktool.BedrockTool",
    minimumJavaVersion: 8,
    maximumJavaVersion: 8,
    javaType: "jdk"
})

export default new Command({
    name: "bedrocktool",
    aliases: ["bedrockgen"],
    description: "Generate a bedrock world for bedrock singleplayer",
    permission: Roles.SUPPORT,
    usage: "<region> <username>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const googleDriveInstance = new NodeGoogleDrive({
            ROOT_FOLDER: client.config.bedrocktool.folderID
        })
        const gdrive = await googleDriveInstance.useServiceAccountAuth(
            client.config.bedrocktool.googleDriveKeyInfo
        )

        if (!gdrive) return message.channel.sendError("Google drive creds error.")

        const region = args.consume(1)[0]
        const username = args.consumeRest()

        if (!region) return message.channel.sendError("Please provide a region.")
        if (!username) return message.channel.sendError("Please provide an username.")

        if (!username.match(/^([^#@:]{2,32})(#{1})(\d{4}$)$/))
            return message.channel.sendError("Please provide an valid username.")

        if (!region.match(/-?\d+\.-?\d+/))
            return message.channel.sendError("Please provide an valid region.")

        const worldFilePath = path.join(
            bedrockToolCWD,
            `${username.replace(/[^\p{L}\d_.]/gu, "")}_${region}.zip`
        )

        const statusEmbed = await message.channel.send(
            new Discord.MessageEmbed()
                .setColor(client.config.colors.info)
                .setDescription("Generating bedrock region....")
        )

        const result = await java.run([region, username], {
            cwd: bedrockToolCWD,
            detached: false
        })

        if (result.stderr) {
            try {
                fs.unlinkSync(worldFilePath)
            } catch {
                return await statusEmbed.edit(
                    new Discord.MessageEmbed()
                        .setColor(client.config.colors.error)
                        .setDescription("An error has occured")
                        .addField("**Logs**", `\`\`\`${result.stdout}\`\`\``)
                        .addField("**Error**", `\`\`\`${result.stderr}\`\`\``)
                )
            }
            return await statusEmbed.edit(
                new Discord.MessageEmbed()
                    .setColor(client.config.colors.error)
                    .setDescription("An error has occured")
                    .addField("**Logs**", `\`\`\`${result.stdout}\`\`\``)
                    .addField("**Error**", `\`\`\`${result.stderr}\`\`\``)
            )
        }

        let file

        if (result.stdout) {
            client.guilds.main.channels.cache.forEach(async channel => {
                if (channel.name === "bedrock-worlds" && channel.type === "text") {
                    try {
                        statusEmbed.edit(
                            new Discord.MessageEmbed()
                                .setColor(client.config.colors.info)
                                .setDescription("Uploading file to drive....")
                        )
                        file = await googleDriveInstance.create({
                            source: fs.createReadStream(worldFilePath),
                            name: `${username.replace(
                                /[^\p{L}\d_.]/gu,
                                ""
                            )}_${region}.zip`,
                            mimeType: "application/zip"
                        })
                        fs.unlinkSync(worldFilePath)
                        await (channel as TextChannel).send(
                            `Generation ran by <@${message.author.id}>\nFile: https://drive.google.com/file/d/${file.id}`
                        )
                        return statusEmbed.edit(
                            new Discord.MessageEmbed()
                                .setColor(client.config.colors.success)
                                .setDescription("Region completed!")
                                .addField("**Logs**", `\`\`\`${result.stdout}\`\`\``)
                                .addField(
                                    "**File**",
                                    `https://drive.google.com/file/d/${file.id}`
                                )
                        )
                    } catch {
                        return await statusEmbed.edit(
                            new Discord.MessageEmbed()
                                .setColor(client.config.colors.error)
                                .setDescription(
                                    "Could not find file, please contact a Bot Developer"
                                )
                                .addField("**Logs**", `\`\`\`${result.stdout}\`\`\``)
                        )
                    }
                }
            })
        }
    }
})
