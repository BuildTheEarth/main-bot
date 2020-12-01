module.exports = function toProperCase(string) {
    const regex = /([^\W_]+[^\s-]*) */g;
    const callback = (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();

    return string.replace(regex, callback);
};
