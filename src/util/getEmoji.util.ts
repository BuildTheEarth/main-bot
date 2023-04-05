import emojiTree from "emoji-tree"

export default function getEmoji(emoji: string): string | undefined {
    let realEmoji: string | undefined = undefined
    const emojis = emojiTree(emoji)
        .filter(ele => ele.type == "emoji")
        .map(ele => ele.text)

    if (emojis.length >= 1) {
        realEmoji = emojis[0]
    } else {
        const matches = emoji.match(/<a?:.+?:\d{16,20}>/gu)
        if (matches && matches.length >= 1) {
            realEmoji = matches[0].match(/(\d+)/)?.[0]
        }
    }

    return realEmoji
}
