/**
 * Require .json files with comments
 *
 * @license MIT
 * @version 1.1.0
 * @author Dumitru Uzun (DUzun.Me)
 */

/*
MIT License

Copyright (c) 2019 Dumitru Uzun

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const VERSION = "1.1.0"

import fs from "fs"
import path from "path"

import JSON5 from "json5"

/// Require a JSON file with comments
function requireJSON5(filename: string) {
    if (path.extname(filename) == "") {
        const extensions = [".json5", ".json"]
        for (let i = 0, l = extensions.length, ext: string; i < l; ++i) {
            ext = extensions[i]
            if (fs.existsSync(filename + ext)) {
                filename += ext
                break
            }
        }
    }
    try {
        return JSON5.parse(stripBOM(fs.readFileSync(filename, "utf8")))
    } catch (error) {
        error.message = filename + ": " + error.message
        throw error
    }
}

/// Override require for .json extension
function replace_require() {
    require.extensions[".json"] = function (module, filename) {
        module.exports = requireJSON5(filename)
    }
}

/// Register .json5 extension for require
require.extensions[".json5"] = function (module, filename) {
    module.exports = requireJSON5(filename)
}

/// Exports:

requireJSON5.parse = JSON5.parse.bind(JSON5)
requireJSON5.stringify = JSON5.stringify.bind(JSON5)
requireJSON5.replace = replace_require
requireJSON5.VERSION = VERSION

module.exports = requireJSON5

/// Helpers:

function stripBOM(content: string) {
    // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
    // because the buffer-to-string conversion in `fs.readFileSync()`
    // translates it to FEFF, the UTF-16 BOM.
    if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1)
    }
    return content
}
