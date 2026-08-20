import { useEffect, useState } from "react";
import "./App.css";
import MonthCalendar from "./components/MonthCalendar";
import TaskList from "./components/TaskList";
import WeekCalendar from "./components/WeekCalendar";

const API_BASE_URL = "http://localhost:8000/api";

async function getScheduleData() {
  const [eventsResponse, tasksResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/events`),
    fetch(`${API_BASE_URL}/tasks`),
  ]);

  if (!eventsResponse.ok || !tasksResponse.ok) {
    throw new Error("予定とタスクを取得できませんでした");
  }

  return Promise.all([eventsResponse.json(), tasksResponse.json()]);
}

function App() {
  const [activeView, setActiveView] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const [loadedEvents, loadedTasks] = await getScheduleData();
        setEvents(loadedEvents);
        setTasks(loadedTasks);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadSchedule();
  }, []);

  async function handleRetry() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [loadedEvents, loadedTasks] = await getScheduleData();
      setEvents(loadedEvents);
      setTasks(loadedTasks);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTaskToggle(task) {
    setUpdatingTaskId(task.id);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          due_at: task.due_at,
          description: task.description,
          completed: !task.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("タスクの完了状態を更新できませんでした");
      }

      const updatedTask = await response.json();
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === updatedTask.id ? updatedTask : currentTask,
        ),
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setUpdatingTaskId(null);
    }
  }

  return (
    <div className="schedule-app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo" aria-hidden="true">
            竜
          </span>
          <h1>よりよいスケジュール帳</h1>
        </div>

        <nav className="view-tabs" aria-label="表示を切り替える">
          <button
            className={activeView === "month" ? "is-active" : ""}
            type="button"
            onClick={() => setActiveView("month")}
          >
            月
          </button>
          <button
            className={activeView === "week" ? "is-active" : ""}
            type="button"
            onClick={() => setActiveView("week")}
          >
            週
          </button>
          <button
            className={activeView === "tasks" ? "is-active" : ""}
            type="button"
            onClick={() => setActiveView("tasks")}
          >
            タスク
          </button>
        </nav>
      </header>

      {errorMessage && (
        <div className="error-message" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={handleRetry}>
            再読み込み
          </button>
        </div>
      )}

      <main className="app-content">
        {isLoading ? (
          <p className="status-message">読み込み中...</p>
        ) : activeView === "month" ? (
          <MonthCalendar
            events={events}
            tasks={tasks}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        ) : activeView === "week" ? (
          <WeekCalendar
            events={events}
            tasks={tasks}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        ) : (
          <TaskList
            tasks={tasks}
            updatingTaskId={updatingTaskId}
            onTaskToggle={handleTaskToggle}
          />
        )}
      </main>
    </div>
  );
}

export default App;
