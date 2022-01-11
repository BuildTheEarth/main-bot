import Client from "../Client"

export default interface ConfigSubmodule {
    client: Client

    load(): void | Promise<void>

    unload(): void | Promise<void>
}
