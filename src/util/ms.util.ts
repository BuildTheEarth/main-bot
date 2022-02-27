//https://github.com/vercel/ms

/*
The MIT License (MIT)

Copyright (c) 2020 Vercel, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Helpers.
const s = 1000
const m = s * 60
const h = m * 60
const d = h * 24
const w = d * 7
const y = d * 365.25

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

function ms(val: string, options?: { long?: boolean }): number
function ms(val: number, options?: { long?: boolean }): string

function ms(val: string | number, options: { long?: boolean } = {}): string | number {
    if (typeof val === "string" && val.length > 0) {
        return parse(val)
    } else if (typeof val === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val)
    }
    throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
    )
}

export default ms

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str: string): number {
    str = String(str)
    if (str.length > 100) {
        return
    }
    const match =
        /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
            str
        )
    if (!match) {
        return
    }
    const n = parseFloat(match[1])
    const type = (match[2] || "ms").toLowerCase()
    switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
            return n * y
        case "weeks":
        case "week":
        case "w":
            return n * w
        case "days":
        case "day":
        case "d":
            return n * d
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
            return n * h
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
            return n * m
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
            return n * s
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
            return n
        default:
            return undefined
    }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms: number): string {
    const msAbs = Math.abs(ms)
    if (msAbs >= d) {
        return Math.round(ms / d) + "d"
    }
    if (msAbs >= h) {
        return Math.round(ms / h) + "h"
    }
    if (msAbs >= m) {
        return Math.round(ms / m) + "m"
    }
    if (msAbs >= s) {
        return Math.round(ms / s) + "s"
    }
    return ms + "ms"
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms: number): string {
    const msAbs = Math.abs(ms)
    if (msAbs >= d) {
        return plural(ms, msAbs, d, "day")
    }
    if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour")
    }
    if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute")
    }
    if (msAbs >= s) {
        return plural(ms, msAbs, s, "second")
    }
    return ms + " ms"
}

/**
 * Pluralization helper.
 */

function plural(ms: number, msAbs: number, n: number, name: string) {
    const isPlural = msAbs >= n * 1.5
    return Math.round(ms / n) + " " + name + (isPlural ? "s" : "")
}
