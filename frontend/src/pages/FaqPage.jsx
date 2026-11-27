import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SUPPORT_EMAIL } from '../config.js'

const QUESTIONS = [
  {
    q: 'Як знайти фільм?',
    a: 'Почніть вводити назву в рядку пошуку вгорі: сайт підкаже до п’яти фільмів з постерами. Натисніть Enter, щоб побачити всі збіги. У каталозі можна відфільтрувати фільми за жанром, роком, рейтингом і країною.',
  },
  {
    q: 'Що таке розділ «Онлайн» і чому там небагато фільмів?',
    a: 'Там зібрані фільми, які можна дивитися прямо на сайті легально: вони у суспільному надбанні або мають вільну ліцензію (наприклад, Creative Commons). Новинки та більшість популярних фільмів захищені авторським правом, тому для них ми показуємо трейлер і сервіси, де їх можна переглянути.',
  },
  {
    q: 'Чому кнопка «Дивитися» веде на інший сайт?',
    a: 'Для фільмів без вільної ліцензії ми показуємо легальні сервіси (дані TMDB/JustWatch). Сам сайт такі фільми не відтворює.',
  },
  {
    q: 'Як додати фільм в обране?',
    a: 'Увійдіть або зареєструйтеся, відкрийте сторінку фільму й натисніть «Додати в обране». Усі збережені фільми — у розділі «Обране».',
  },
  {
    q: 'Яким має бути пароль?',
    a: 'Щонайменше 8 символів: латинські літери, цифра і спеціальний знак (наприклад, !, @, #).',
  },
  {
    q: 'Що означає «Нова» замість оцінки?',
    a: 'У фільму ще замало оцінок глядачів (менше 30), тому справжній рейтинг показувати зарано. Оцінка зʼявиться, коли набереться достатньо голосів.',
  },
  {
    q: 'Як увімкнути озвучення, субтитри або збільшити текст?',
    a: 'Натисніть кнопку доступності в лівому нижньому куті. Субтитри показуються в трейлерах і фільмах, де вони є. Налаштування запамʼятовуються.',
  },
  {
    q: 'Чому я не бачу деякі фільми?',
    a: 'Фільми з віковим обмеженням 18+ приховані на всьому сайті.',
  },
  {
    q: 'Сайт відкривається дуже довго. Це нормально?',
    a: 'Якщо сайтом давно ніхто не користувався, сервер прокидається до хвилини. Після цього все працює швидко. Дані акаунтів і обраного поки зберігаються у демонстраційному режимі й можуть скидатися.',
  },
]

export function FaqPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function send(event) {
    event.preventDefault()
    const subject = 'Відгук про CineScope'
    const body = `${form.message}\n\nІмʼя: ${form.name || '—'}\nПошта: ${form.email || '—'}`
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="faq-page page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Допомога</span>
          <h1>Часті запитання</h1>
          <p>Не знайшли відповідь? Напишіть нам внизу сторінки.</p>
        </div>
      </div>

      <div className="faq-list">
        {QUESTIONS.map((item) => (
          <details className="faq-item" key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>

      <section className="faq-feedback" aria-labelledby="feedback-title">
        <h2 id="feedback-title">Написати нам</h2>
        <p>
          Знайшли помилку або маєте ідею? Опишіть її, і ми отримаємо лист на
          пошту техпідтримки.
        </p>
        <form className="auth-form" onSubmit={send}>
          <label>
            <span>Імʼя</span>
            <input name="name" value={form.name} onChange={update} placeholder="Як вас звати?" />
          </label>
          <label>
            <span>Ваша пошта (щоб ми могли відповісти)</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              placeholder="you@example.com"
            />
          </label>
          <label>
            <span>
              Повідомлення{' '}
              <span className="req" title="Обов’язкове поле">
                * <span className="req-text">обов’язкове</span>
              </span>
            </span>
            <textarea
              name="message"
              value={form.message}
              onChange={update}
              rows="5"
              required
              placeholder="Що саме не так або що можна покращити?"
            />
          </label>
          <button type="submit" className="button button-primary">
            Надіслати
          </button>
          <p className="required-note">
            Відкриється ваша поштова програма з готовим листом на {SUPPORT_EMAIL}.
          </p>
        </form>
        <p className="faq-back">
          <Link to="/">← Повернутися до каталогу</Link>
        </p>
      </section>
    </div>
  )
}
