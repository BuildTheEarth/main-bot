declare module "emoji-tree" {
    export default function emojiTree(
        emojiText: string
    ): { text: string; type: "text" | "emoji" }[]
}
