// https://api.mcsrvstat.us/
export default interface MinecraftServerStatus {
    online: boolean
    ip: string
    port: number
    debug: {
        ping: boolean
        query: boolean
        srv: boolean
        querymismatch: boolean
        ipinsrv: boolean
        cnameinsrv: boolean
        animatedmotd: boolean
        cachetime: number
    }
    motd: FormattedText
    players: {
        online: number
        max: number
        list?: string[]
        uuid?: { [name: string]: string }
    }
    version: string
    protocol?: number
    hostname?: string
    icon?: string
    software?: string
    map: string
    plugins?: AddonList
    mods?: AddonList
    info?: FormattedText
}

export interface FormattedText {
    raw: string[]
    clean: string[]
    html: string[]
}

export interface AddonList {
    names: string[]
    raw: string[]
}
