export default function quote(text: string): string {
    return text
        .split("\n")
        .map(line => `> ${line}`)
        .join("\n")
}
