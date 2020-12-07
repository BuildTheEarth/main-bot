import fetch, { Response } from "node-fetch"
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm"

export const VALID_KEYS = ["logo", "1", "2", "3", "4", "5"]
export type ModpackImageKey = "logo" | "1" | "2" | "3" | "4" | "5"
export type ModpackImageSetName = "queue" | "store"
export type ModpackImageData = { url: string; credit: string }
export type ModpackImageSet = { [key in ModpackImageKey]?: ModpackImageData }

@Entity({ name: "modpack_images" })
export default class ModpackImage extends BaseEntity {
    static readonly API_URL = "https://buildtheearth.net/api/modpack/images"

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    key: ModpackImageKey

    @Column()
    set: ModpackImageSetName

    @Column()
    url: string

    @Column({ nullable: true })
    credit?: string

    format(compact: boolean = false): string {
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

    static async fetch(): Promise<Response> {
        const response: Response = await fetch(this.API_URL)
        const object: ModpackImageSet = await response.json()

        for (const [key, data] of Object.entries(object)) {
            if (!VALID_KEYS.includes(key)) continue
            const image = new ModpackImage()
            image.key = <ModpackImageKey>key
            image.set = "store"
            image.url = data.url
            image.credit = data.credit

            await image.save()
        }

        return response
    }

    static async post(token: string): Promise<Response> {
        const object: ModpackImageSet = {}
        const images = await this.find({ where: { set: "store" } })

        for (const image of images) {
            object[image.key] = {
                url: image.url,
                credit: image.credit
            }
        }

        const response: Response = await fetch(this.API_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(object)
        })

        return response
    }
}
