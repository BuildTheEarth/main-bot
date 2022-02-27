export default function hexToRGB(hexCode: string): readonly [number, number, number] {
    let R, G, B
    if (hexCode.charAt(0) == "#") {
        hexCode = hexCode.substr(1)
    }

    R = hexCode.charAt(0) + "" + hexCode.charAt(1)
    G = hexCode.charAt(2) + "" + hexCode.charAt(3)
    B = hexCode.charAt(4) + "" + hexCode.charAt(5)

    R = parseInt(R, 16)
    G = parseInt(G, 16)
    B = parseInt(B, 16)
    return [R, G, B]
}
