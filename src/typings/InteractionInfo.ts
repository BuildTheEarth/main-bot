import Placeholder from "../entities/Placeholder.entity.js"
import Snippet from "../entities/Snippet.entity.js"

export interface SnippetModalInfo {
    name: string
    language: string
    type: "rule" | "snippet" | "team"
    subcommand: "add" | "edit"
    modalType: "snippetmodal"
    existingSnippet?: Snippet
}

export interface PlaceholderModalInfo {
    name: string
    language: string
    subcommand: "add" | "edit"
    modalType: "placeholdermodal"
    existingPlaceholder?: Placeholder
}

export function isSnippetInfo(info: { modalType: string }): info is SnippetModalInfo {
    return info.modalType === "snippetmodal"
}

export function isPlaceholderInfo(info: {
    modalType: string
}): info is PlaceholderModalInfo {
    return info.modalType === "placeholdermodal"
}

type InteractionInfo = SnippetModalInfo | PlaceholderModalInfo

export default InteractionInfo
