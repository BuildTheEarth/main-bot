import {
    ActionRowData,
    ComponentType,
    ModalActionRowComponentData,
    TextInputStyle
} from "discord.js"
import _ from "lodash"

function transform(val: string): ComponentType {
    if (val === "ACTION_ROW") return ComponentType.ActionRow
    if (val === "BUTTON") return ComponentType.Button
    if (val === "SELECT_MENU") return ComponentType.StringSelect
    if (val === "TEXT_INPUT") return ComponentType.TextInput
    return ComponentType.ActionRow
}

function transformStyle(val: string): TextInputStyle {
    if (val === "SHORT") return TextInputStyle.Short
    return TextInputStyle.Paragraph
}

export default function replaceTypes(json: {
    components: ActionRowData<ModalActionRowComponentData>[]
    customId: string
    title: string
}): {
    components: ActionRowData<ModalActionRowComponentData>[]
    customId: string
    title: string
} {
    const jNew = _.cloneDeep(json)

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
