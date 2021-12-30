// We dont need this typing anymore however it might prove useful for future things
declare module "*.json" {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value: any
    export default value
}
