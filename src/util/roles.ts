import humanizeConstant from "./humanizeConstant"

function get(target: unknown, key: string): string {
    return humanizeConstant(key, ["PR", "BOTW", "DJ"], ["ON"])
}

const proxy = new Proxy({}, { get })
export default proxy as Record<string, string>
