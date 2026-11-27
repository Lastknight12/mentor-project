// Країни для фільтра (коди ISO 3166-1) і переклад назв українською
export const COUNTRY_OPTIONS = [
  'US', 'UA', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL',
  'JP', 'KR', 'CN', 'IN', 'CA', 'SE', 'DK',
]

let names = null

export function countryName(code) {
  try {
    names = names || new Intl.DisplayNames(['uk'], { type: 'region' })
    return names.of(code) || code
  } catch {
    return code
  }
}
