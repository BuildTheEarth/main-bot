import Snippet from "../entities/Snippet.entity.js"

export interface SuggestionModalInfo {
    name: string
    language: string
    type: "rule" | "snippet" | "team"
    subcommand: "add" | "edit"
    modalType: "snippetmodal"
    existingSnippet?: Snippet
}

type InteractionInfo = SuggestionModalInfo

export default InteractionInfo
