import Client from "../Client.js"

export default class Messages {
    client: Client

    constructor(client: Client) {
        this.client = client
    }

    public getMessage(key: string, locale: string): string {
        let trueLocale = "en"
        if (locale === "zh-CN") trueLocale = "zh-s"
        else if (locale === "zh-TW") trueLocale = "zh-t"
        else trueLocale = locale.split("-")[0]
        console.log(trueLocale)
        if (this.client.config.submodules.messages.json[trueLocale][key] === undefined)
            if (this.client.config.submodules.messages.json["en"][key] === undefined)
                return "Message not set in configuration!"
            else
                return this.getRandomMessage(
                    this.client.config.submodules.messages.json["en"][key]
                )

        return this.getRandomMessage(
            this.client.config.submodules.messages.json[trueLocale][key]
        )
    }

    private getRandomMessage(arr: string[]): string {
        const arrayIndex = Math.floor(Math.random() * arr.length)
        return arr[arrayIndex]
    }
}
