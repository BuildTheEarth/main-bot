//https://github.com/meikidd/iso-639-1/blob/master/src/index.js

/*
This software is licensed under the MIT License.

Copyright(c) by Mei Qingguang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

require("../../typings/requireJSON5")

import LANGUAGES_LIST = require("../../../config/extensions/languages.json5")

export default class ISO6391 {
    static getLanguages(codes: Array<string> = []): IndependentLanguageData[] {
        return codes.map(code => ({
            code,
            name: ISO6391.getName(code),
            nativeName: ISO6391.getNativeName(code)
        }))
    }

    static getName(code: string): string {
        return ISO6391.validate(code) ? LANGUAGES_LIST[code].name : ""
    }

    static getAllNames(): Array<string> {
        return Object.values(LANGUAGES_LIST).map(l => l.name)
    }

    static getNativeName(code: string): string {
        return ISO6391.validate(code) ? LANGUAGES_LIST[code].nativeName : ""
    }

    static getAllNativeNames(): Array<string> {
        return Object.values(LANGUAGES_LIST).map(l => l.nativeName)
    }

    static getCode(name: string): string {
        const code = Object.keys(LANGUAGES_LIST).find(code => {
            const language = LANGUAGES_LIST[code]

            return (
                language.name.toLowerCase() === name.toLowerCase() ||
                language.nativeName.toLowerCase() === name.toLowerCase()
            )
        })
        return code || ""
    }

    static getAllCodes(): Array<string> {
        return Object.keys(LANGUAGES_LIST)
    }

    static validate(code: string): boolean {
        return Object.prototype.hasOwnProperty.call(LANGUAGES_LIST, code)
    }
}

export interface LanguageData {
    name: string
    nativeName: string
}

export interface IndependentLanguageData extends LanguageData {
    code: string
}
