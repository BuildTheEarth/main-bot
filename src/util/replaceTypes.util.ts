import Discord from "discord.js"

function transform(val: string): Discord.ComponentType {
    if (val === "ACTION_ROW") return Discord.ComponentType.ActionRow
    if (val === "BUTTON") return Discord.ComponentType.Button
    if (val === "SELECT_MENU") return Discord.ComponentType.SelectMenu
    if (val === "TEXT_INPUT") return Discord.ComponentType.TextInput
    return Discord.ComponentType.ActionRow
}

function transformStyle(val: string): Discord.TextInputStyle {
    if (val === "SHORT") return Discord.TextInputStyle.Short
    return Discord.TextInputStyle.Paragraph
}

export default function replaceTypes(json: {
    components: Discord.ActionRowData<Discord.ModalActionRowComponentData>[]
    customId: string
    title: string
}): {
    components: Discord.ActionRowData<Discord.ModalActionRowComponentData>[]
    customId: string
    title: string
} {
    const jNew = {
        ...json,
        components: json.components.map(component => ({
            ...component,
            components: component.components ? [...component.components] : component.components
        }))
    }

    for (const component of jNew.components) {
        //@ts-ignore
        component.type = transform(component.type)
        if (component.components) {
            for (const component2 of component.components) {
                //@ts-ignore
                if (component2?.type)
                    //@ts-ignore
                    component2.type = transform(component2.type)
                //@ts-ignore
                if (component2?.style)
                    //@ts-ignore
                    component2.style = transformStyle(component2.style)
            }
        }
    }

    return jNew
}
