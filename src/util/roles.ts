function get(_target: any, key: string): string {
    const words = key.split("_")
    const capital = words.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    return capital.join(" ")
}

export default new Proxy({}, { get })
