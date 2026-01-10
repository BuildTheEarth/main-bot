import BotClient from "../BotClient.js"
import pathModule from "path"
import url from "url"
import fs from "fs"
import { loadSyncJSON5 } from "@buildtheearth/bot-utils"
import loadDir from "../../util/loadDir.util.js"
import _ from "lodash"
import { InteractionType, Interaction, Collection } from "discord.js"

export interface ComponentHandlerProperties {
    name: string
    prefix: string
    passTypes: InteractionType[]
    run: (client: BotClient, interaction: Interaction) => void
}

export class ComponentHandler implements ComponentHandlerProperties {
    name: string
    prefix: string
    passTypes: InteractionType[]
    run: (client: BotClient, interaction: Interaction) => void

    constructor(props: ComponentHandlerProperties) {
        this.name = props.name
        this.prefix = props.prefix
        this.passTypes = props.passTypes
        this.run = props.run.bind(this)
    }
}

export default class ComponentHandlersList {
    client: BotClient
    collection: Collection<string, ComponentHandler> = new Collection()
    constructor(client: BotClient) {
        this.client = client
    }

    async load(): Promise<void> {
        this.collection = await loadDir<ComponentHandler>(
            pathModule.dirname(url.fileURLToPath(import.meta.url)) +
                "/../../componenthandlers/",
            this.client
        )
    }

    findFromIdAndInteractionType(id: string, interactionType: InteractionType) {
        return this.collection.find((value, ignoreMeCauseLodashExists) => {
            return (
                _.startsWith(id, value.prefix) &&
                value.passTypes.includes(interactionType)
            )
        })
    }
}
