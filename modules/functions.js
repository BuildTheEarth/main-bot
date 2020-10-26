module.exports = () => {
    Object.defineProperty(String.prototype, "toProperCase", {
        value: function () {
            return this.replace(
                /([^\W_]+[^\s-]*) */g,
                (txt) =>
                    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
        },
    });

    //random object from an array
    Object.defineProperty(Array.prototype, "random", {
        value: function () {
            return this[Math.floor(Math.random() * this.length)];
        },
    });

    process.on("uncaughtException", (err) => {
        const errorMsg = err.stack.replace(
            new RegExp(`${__dirname}/`, "g"),
            "./"
        );
        console.error(`Uncaught Exception: ${errorMsg}`);
        console.error(err);
        process.exit(1);
    });

    process.on("unhandledRejection", (err) => {
        console.error(`Unhandled rejection: ${err}`);
        console.error(err);
    });
};
