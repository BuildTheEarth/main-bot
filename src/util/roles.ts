import humanizeConstant from "./humanizeConstant"

function get(target: unknown, key: string): string {
    return humanizeConstant(key, ["PR", "BOTW", "DJ"])
}

const proxy = new Proxy({}, { get })
export default proxy as { [key: string]: string }
