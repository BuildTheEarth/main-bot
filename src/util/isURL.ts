import { URL } from "url"

export default function isURL(input: string): boolean {
    try {
        new URL(input)
        return true
    } catch {
        return false
    }
}
