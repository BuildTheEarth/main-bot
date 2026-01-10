import BotClient from "../BotClient.js"

export default interface ConfigSubmodule {
    client: BotClient

    load(): void | Promise<void>

    unload(): void | Promise<void>
}
