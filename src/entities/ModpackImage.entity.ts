import fetch, { Response } from "node-fetch"
import typeorm from "typeorm"
import unicode from "./transformers/unicode.transformer.js"

export type ModpackImageKey = "logo" | 1 | 2 | 3 | 4 | 5
export type ModpackImageSetName = "queue" | "store"
export type ModpackImageData = { url: string; credit: string | null }
export type ModpackImageSet = Partial<Record<ModpackImageKey, ModpackImageData>>

@typeorm.Entity({ name: "modpack_images" })
export default class ModpackImage extends typeorm.BaseEntity {
    static readonly API_URL = "https://api.buildtheearth.net/api/v1/jsonstore/modpack"

    @typeorm.PrimaryGeneratedColumn()
    id!: number

    @typeorm.Column({ type: "varchar" })
    key!: ModpackImageKey

    @typeorm.Column()
    set!: ModpackImageSetName

    @typeorm.Column()
    url!: string

    @typeorm.Column({ nullable: true, transformer: unicode })
    credit?: string

    format(compact = false): string {
        if (compact) {
            return this.credit
                ? `**#${this.key}:** <${this.url}> (${this.credit})`
                : `**${this.key}:** <${this.url}>`
        } else {
            return this.credit
                ? `• **ID:** ${this.key}\n• **URL:** <${this.url}>\n• **Credit:** ${this.credit}`
                : `• **Logo**\n• **URL:** <${this.url}>`
        }
    }

    static isValidKey(value: number | string): boolean {
        return ["logo", "1", "2", "3", "4", "5"].includes(value.toString())
    }

    static async fetch(): Promise<{ response: Response; body: ModpackImageSet }> {
        const images = await this.find({ set: "store" })
        const response: Response = await fetch(this.API_URL)
        const object: ModpackImageSet = <ModpackImageSet>await response.json()

        for (const [key, data] of Object.entries(object)) {
            if (!ModpackImage.isValidKey(key)) continue

            const existing = images.find(image => image.key === key)
            if (existing) await existing.remove()

            const image = new ModpackImage()
            image.key = key as ModpackImageKey
            image.set = "store"
            image.url = data.url
            image.credit = data.credit ? data.credit : undefined

            await image.save()
        }

        return { response, body: object }
    }

    static async post(token: string): Promise<Response> {
        const images = await this.find({ set: "store" })
        const object: ModpackImageSet = {}

        for (const image of images) {
            object[image.key] = {
                url: image.url,
                credit: image.credit ? image.credit : null
            }
        }

        const response: Response = await fetch(this.API_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            //Using json as I doubt the api supports JSON5 *yet*
            body: JSON.stringify(object)
        })

        return response
    }
}
