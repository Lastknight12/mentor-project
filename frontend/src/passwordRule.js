// Правило пароля: 8+ символів, латиниця, цифра і спеціальний знак.
// Те саме правило перевіряється на сервері (backend/src/routes/auth.js).
export const PASSWORD_CHECKS = [
  { id: 'length', label: 'Щонайменше 8 символів', test: (p) => p.length >= 8 },
  { id: 'letter', label: 'Латинські літери (a–z)', test: (p) => /[A-Za-z]/.test(p) },
  { id: 'digit', label: 'Цифра', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'Спеціальний знак (!@#$%…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
  { id: 'ascii', label: 'Без кирилиці та пробілів', test: (p) => /^[\x21-\x7E]*$/.test(p) },
]

export function isPasswordValid(password) {
  return PASSWORD_CHECKS.every((check) => check.test(password))
}
