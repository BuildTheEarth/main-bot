module.exports = () => {
    process.on("uncaughtException", err => {
        const errorMsg = err.stack.replace(
            new RegExp(`${__dirname}/`, "g"),
            "./"
        )
        console.error(`Uncaught Exception: ${errorMsg}`)
        console.error(err)
        process.exit(1)
    })

    process.on("unhandledRejection", err => {
        console.error(`Unhandled rejection: ${err}`)
        console.error(err)
    })
}
