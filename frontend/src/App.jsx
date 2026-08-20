import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:8000/api/events'

async function getEvents() {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error('予定一覧を取得できませんでした')
  }

  return response.json()
}

function App() {
  const [title, setTitle] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [description, setDescription] = useState('')
  const [events, setEvents] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadEvents() {
      try {
        setEvents(await getEvents())
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!title.trim()) {
      setErrorMessage('予定タイトルを入力してください')
      return
    }

    if (!startAt || !endAt) {
      setErrorMessage('開始日時と終了日時を入力してください')
      return
    }

    if (endAt < startAt) {
      setErrorMessage('終了日時は開始日時と同じか、それより後にしてください')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          start_at: startAt,
          end_at: endAt,
          description,
        }),
      })

      if (!response.ok) {
        throw new Error('予定を追加できませんでした')
      }

      setTitle('')
      setStartAt('')
      setEndAt('')
      setDescription('')
      setEvents(await getEvents())
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="schedule-app">
      <h1>よりよいスケジュール帳</h1>

      <form className="event-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="event-title">予定タイトル</label>
          <input
            id="event-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例: ハッカソン"
            required
          />
        </div>

        <div className="date-fields">
          <div className="form-field">
            <label htmlFor="event-start-at">開始日時</label>
            <input
              id="event-start-at"
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="event-end-at">終了日時</label>
            <input
              id="event-end-at"
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
              min={startAt}
              required
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="event-description">説明</label>
          <textarea
            id="event-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="例: 開発と発表を行う"
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '追加中...' : '追加'}
        </button>
      </form>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <section className="event-list" aria-labelledby="event-list-heading">
        <h2 id="event-list-heading">予定一覧</h2>
        {isLoading ? (
          <p>読み込み中...</p>
        ) : events.length === 0 ? (
          <p>予定はまだありません。</p>
        ) : (
          <ul>
            {events.map((event) => (
              <li key={event.id}>{event.title}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
