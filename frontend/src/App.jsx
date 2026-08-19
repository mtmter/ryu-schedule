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

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        throw new Error('予定を追加できませんでした')
      }

      setTitle('')
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
        <label htmlFor="event-title">予定タイトル</label>
        <div className="form-row">
          <input
            id="event-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例: ハッカソン"
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '追加中...' : '追加'}
          </button>
        </div>
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
