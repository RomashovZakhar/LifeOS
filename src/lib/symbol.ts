/** Symbol from Name — RU translit, uppercase, max 5 (05 / 09). */

const RU_TO_LAT: Record<string, string> = {
  а: 'A',
  б: 'B',
  в: 'V',
  г: 'G',
  д: 'D',
  е: 'E',
  ё: 'E',
  ж: 'ZH',
  з: 'Z',
  и: 'I',
  й: 'Y',
  к: 'K',
  л: 'L',
  м: 'M',
  н: 'N',
  о: 'O',
  п: 'P',
  р: 'R',
  с: 'S',
  т: 'T',
  у: 'U',
  ф: 'F',
  х: 'H',
  ц: 'C',
  ч: 'CH',
  ш: 'SH',
  щ: 'SCH',
  ъ: '',
  ы: 'Y',
  ь: '',
  э: 'E',
  ю: 'YU',
  я: 'YA',
}

export function symbolFromName(name: string, max = 5): string {
  let out = ''
  for (const ch of name.trim()) {
    const lower = ch.toLowerCase()
    if (RU_TO_LAT[lower] !== undefined) {
      out += RU_TO_LAT[lower]
    } else if (/[a-z0-9]/i.test(ch)) {
      out += ch.toUpperCase()
    }
    if (out.length >= max) break
  }
  // Prefer keeping RU letters in symbol when user types Cyrillic-only short names
  if (!out) {
    out = name
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')
      .slice(0, max)
  }
  return out.slice(0, max)
}

/** Keep Cyrillic in grid symbols when name is short RU (ТРЕНИ, КОФЕ). */
export function symbolFromNamePreferCyrillic(name: string, max = 5): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  const compact = trimmed.replace(/\s+/g, '').toUpperCase()
  const hasCyrillic = /[А-ЯЁ]/i.test(compact)
  if (hasCyrillic) {
    return compact.replace(/[^А-ЯЁA-Z0-9]/gi, '').slice(0, max)
  }
  return symbolFromName(trimmed, max)
}

export function normalizeSymbolInput(raw: string, max = 5): string {
  return raw.toUpperCase().replace(/\s+/g, '').slice(0, max)
}
