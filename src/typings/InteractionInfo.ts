import Placeholder from "../entities/Placeholder.entity.js"
import Snippet from "../entities/Snippet.entity.js"
import Discord from "discord.js"
import Suggestion from "../entities/Suggestion.entity.js"

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

export interface SuggestModalInfo {
    anon: string
    subsuggestion: string
    modalType: "suggestmodal"
}

export interface SuggestionModalInfo {
    suggestion: Suggestion
    message: Discord.Message
    modalType: "suggestionmodal"
}

export function isSnippetInfo(info: { modalType: string }): info is SnippetModalInfo {
    return info.modalType === "snippetmodal"
}

export function isPlaceholderInfo(info: {
    modalType: string
}): info is PlaceholderModalInfo {
    return info.modalType === "placeholdermodal"
}

export function isSuggestInfo(info: { modalType: string }): info is SuggestModalInfo {
    return info.modalType === "suggestmodal"
}

export function isSuggestionInfo(info: {
    modalType: string
}): info is SuggestionModalInfo {
    return info.modalType === "suggestionmodal"
}

type InteractionInfo =
    | SnippetModalInfo
    | PlaceholderModalInfo
    | SuggestModalInfo
    | SuggestionModalInfo

export default InteractionInfo
