import Discord from "discord.js"
import Client from "../Client.js"
import pathModule from "path"
import url from "url"
import fs from "fs"
import { loadSyncJSON5 } from "@buildtheearth/bot-utils"
import loadDir from "../../util/loadDir.util.js"
import _ from "lodash"

export interface ComponentHandlerProperties {
    name: string
    prefix: string
    passTypes: Discord.InteractionType[]
    run: (client: Client, interaction: Discord.Interaction) => void
}

export class ComponentHandler implements ComponentHandlerProperties {
    name: string
    prefix: string
    passTypes: Discord.InteractionType[]
    run: (client: Client, interaction: Discord.Interaction) => void

    constructor(props: ComponentHandlerProperties) {
        this.name = props.name
        this.prefix = props.prefix
        this.passTypes = props.passTypes
        this.run = props.run.bind(this)
    }
}

export default class ComponentHandlersList {
    client: Client
    collection: Discord.Collection<string, ComponentHandler> = new Discord.Collection()
    constructor(client: Client) {
        this.client = client
    }

    async load(): Promise<void> {
        this.collection = await loadDir<ComponentHandler>(
            pathModule.dirname(url.fileURLToPath(import.meta.url)) +
                "/../../componenthandlers/",
            this.client
        )
    }

    findFromIdAndInteractionType(id: string, interactionType: Discord.InteractionType) {
        return this.collection.find((value, ignoreMeCauseLodashExists) => {
            return (
                _.startsWith(id, value.prefix) &&
                value.passTypes.includes(interactionType)
            )
        })
    }
}
