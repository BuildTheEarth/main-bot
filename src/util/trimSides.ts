import _ from "lodash"

export default function trimSides(
    text: string,
    startTrim: string,
    endTrim: string
): string {
    return _.trimStart(_.trimEnd(text, endTrim), startTrim)
}
