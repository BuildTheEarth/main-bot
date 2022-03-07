import Client from "../Client.js"

export default interface ConfigSubmodule {
    client: Client

    load(): void | Promise<void>

    unload(): void | Promise<void>
}
