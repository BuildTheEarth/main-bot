import NoImplError from "../../util/errors/NoImplError"
import Client from "../Client"

export default class ConfigSubmodule {
    client: Client

    constructor(client: Client) {
        this.client = client
    }

    public load(): void | Promise<void> {
        throw new NoImplError("load")
    }

    public unload(): void | Promise<void> {
        throw new NoImplError("unload")
    }
}
