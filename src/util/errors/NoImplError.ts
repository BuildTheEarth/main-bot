export default class NoImplError extends Error {
    constructor(method: string) {
        super(`Method ${method} not implemented.`)
    }
}
