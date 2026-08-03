const HEX_COLOUR_PATTERN = /^#([\da-f]{3}|[\da-f]{6})$/i

function relativeLuminance(hexColour: string): number | null {
  const match = HEX_COLOUR_PATTERN.exec(hexColour.trim())
  if (!match) return null

  const compact = match[1]
  const expanded =
    compact.length === 3
      ? compact
          .split('')
          .map(character => character.repeat(2))
          .join('')
      : compact
  const channels = [0, 2, 4].map(offset => Number.parseInt(expanded.slice(offset, offset + 2), 16))
  const linearChannels = channels.map(channel => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * linearChannels[0] + 0.7152 * linearChannels[1] + 0.0722 * linearChannels[2]
}

export function getAccessibleTextColor(backgroundColor: string): '#000000' | '#FFFFFF' {
  const luminance = relativeLuminance(backgroundColor)
  if (luminance === null) return '#000000'

  const contrastWithWhite = 1.05 / (luminance + 0.05)
  return contrastWithWhite >= 4.5 ? '#FFFFFF' : '#000000'
}
