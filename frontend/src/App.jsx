import { useEffect, useState } from "react";
import "./App.css";
import AddItemModal from "./components/AddItemModal";
import CalendarToolbar from "./components/CalendarToolbar";
import MonthCalendar from "./components/MonthCalendar";
import TaskList from "./components/TaskList";
import WeekCalendar from "./components/WeekCalendar";
import {
  addDays,
  addMonths,
  formatMonthTitle,
  formatWeekTitle,
  getWeekDates,
  isSameDay,
  toDateTimeInputValue,
} from "./dateUtils";

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

function createDateAtMinutes(date, minutes) {
  const dateAtTime = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  dateAtTime.setMinutes(minutes);
  return dateAtTime;
}

function createInitialValues(
  date,
  itemType,
  eventStartMinutes = 9 * 60,
  taskDueMinutes = 23 * 60 + 45,
) {
  const eventStart = createDateAtMinutes(date, eventStartMinutes);
  const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);
  const taskDue =
    taskDueMinutes === null
      ? ""
      : toDateTimeInputValue(createDateAtMinutes(date, taskDueMinutes));

  return {
    itemType,
    eventStartAt: toDateTimeInputValue(eventStart),
    eventEndAt: toDateTimeInputValue(eventEnd),
    taskDueAt: taskDue,
  };
}

async function getResponseError(response, defaultMessage) {
  try {
    const errorData = await response.json();
    if (typeof errorData.detail === "string") {
      return errorData.detail;
    }
  } catch {
    // JSONではないエラーの場合は、画面用の既定メッセージを使います。
  }

  return defaultMessage;
}

function App() {
  const [activeView, setActiveView] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [addModalValues, setAddModalValues] = useState(null);

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

  function handleAddButtonClick() {
    const today = new Date();

    if (activeView === "tasks") {
      setAddModalValues(createInitialValues(today, "task", 9 * 60, null));
      return;
    }

    if (activeView === "month") {
      const isCurrentMonth =
        selectedDate.getFullYear() === today.getFullYear() &&
        selectedDate.getMonth() === today.getMonth();
      const targetDate = isCurrentMonth
        ? today
        : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      setAddModalValues(createInitialValues(targetDate, "event"));
      return;
    }

    const weekDates = getWeekDates(selectedDate);
    const targetDate = weekDates.some((date) => isSameDay(date, today))
      ? today
      : weekDates[0];
    setAddModalValues(createInitialValues(targetDate, "event"));
  }

  function handleMonthDateClick(date) {
    setAddModalValues(createInitialValues(date, "event"));
  }

  function handleWeekTimeClick(date, startMinutes) {
    setAddModalValues(
      createInitialValues(date, "event", startMinutes, startMinutes),
    );
  }

  async function handleCreateItem(itemType, itemData) {
    const response = await fetch(
      `${API_BASE_URL}/${itemType === "event" ? "events" : "tasks"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      },
    );

    if (!response.ok) {
      const defaultMessage =
        itemType === "event"
          ? "予定を追加できませんでした"
          : "タスクを追加できませんでした";
      throw new Error(await getResponseError(response, defaultMessage));
    }

    const createdItem = await response.json();
    if (itemType === "event") {
      setEvents((currentEvents) => [...currentEvents, createdItem]);
    } else {
      setTasks((currentTasks) => [...currentTasks, createdItem]);
    }
    setAddModalValues(null);
  }

  return (
    <div
      className={`schedule-app${activeView === "month" ? " month-view-active" : ""}`}
    >
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo" aria-hidden="true">
            竜
          </span>
          <h1>よりよいスケジュール帳</h1>
        </div>

        <div className="header-calendar-controls">
          {activeView === "month" ? (
            <CalendarToolbar
              title={formatMonthTitle(selectedDate)}
              onPrevious={() => setSelectedDate(addMonths(selectedDate, -1))}
              onToday={() => setSelectedDate(new Date())}
              onNext={() => setSelectedDate(addMonths(selectedDate, 1))}
            />
          ) : activeView === "week" ? (
            <CalendarToolbar
              title={formatWeekTitle(getWeekDates(selectedDate))}
              onPrevious={() => setSelectedDate(addDays(selectedDate, -7))}
              onToday={() => setSelectedDate(new Date())}
              onNext={() => setSelectedDate(addDays(selectedDate, 7))}
            />
          ) : null}
        </div>

        <div className="header-actions">
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
              onClick={() => {
                if (activeView === "month") {
                  setSelectedDate(new Date());
                }
                setActiveView("week");
              }}
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
          <button
            className="add-button"
            type="button"
            onClick={handleAddButtonClick}
          >
            <span aria-hidden="true">＋</span>
            追加
          </button>
        </div>
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
            onDateClick={handleMonthDateClick}
          />
        ) : activeView === "week" ? (
          <WeekCalendar
            events={events}
            tasks={tasks}
            selectedDate={selectedDate}
            onTimeClick={handleWeekTimeClick}
          />
        ) : (
          <TaskList
            tasks={tasks}
            updatingTaskId={updatingTaskId}
            onTaskToggle={handleTaskToggle}
          />
        )}
      </main>

      {addModalValues && (
        <AddItemModal
          initialValues={addModalValues}
          onClose={() => setAddModalValues(null)}
          onSubmit={handleCreateItem}
        />
      )}
    </div>
  );
}

export default App;
