import Placeholder from "../../entities/Placeholder"
import Client from "../Client"

export default class PlaceholderHandler {
    client: Client

    constructor(client: Client) {
        this.client = client
    }

    cache = new Map<string, Placeholder>()
}
