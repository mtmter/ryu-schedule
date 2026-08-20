import CalendarToolbar from "./CalendarToolbar";
import {
  WEEKDAY_NAMES,
  addDays,
  eventOccursOnDate,
  formatTime,
  formatWeekTitle,
  getDateKey,
  getEventPositionForDay,
  getWeekDates,
  isSameDay,
} from "../dateUtils";

const HOUR_HEIGHT = 56;

function formatMinutes(minutes) {
  if (minutes === 24 * 60) {
    return "24:00";
  }

  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
}

function WeekCalendar({ events, tasks, selectedDate, onDateChange }) {
  const weekDates = getWeekDates(selectedDate);
  const today = new Date();

  return (
    <section aria-label="週間カレンダー">
      <CalendarToolbar
        title={formatWeekTitle(weekDates)}
        onPrevious={() => onDateChange(addDays(selectedDate, -7))}
        onToday={() => onDateChange(new Date())}
        onNext={() => onDateChange(addDays(selectedDate, 7))}
      />

      <div className="calendar-horizontal-scroll">
        <div className="week-calendar">
          <div className="week-header-row">
            <div className="week-corner" />
            {weekDates.map((date, index) => (
              <div className="week-date-heading" key={getDateKey(date)}>
                <span
                  className={
                    index === 0
                      ? "is-sunday"
                      : index === 6
                        ? "is-saturday"
                        : ""
                  }
                >
                  {WEEKDAY_NAMES[index]}
                </span>
                <time
                  className={isSameDay(date, today) ? "is-today" : ""}
                  dateTime={getDateKey(date)}
                >
                  {date.getDate()}
                </time>
              </div>
            ))}
          </div>

          <div className="week-due-row">
            <div className="week-due-label">期限</div>
            {weekDates.map((date) => {
              const dateTasks = tasks
                .filter(
                  (task) =>
                    !task.completed &&
                    task.due_at?.slice(0, 10) === getDateKey(date),
                )
                .sort((firstTask, secondTask) =>
                  firstTask.due_at.localeCompare(secondTask.due_at),
                );

              return (
                <div className="week-due-cell" key={getDateKey(date)}>
                  {dateTasks.map((task) => (
                    <div className="week-task" title={task.title} key={task.id}>
                      {formatTime(task.due_at)} {task.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="week-time-scroll">
            <div
              className="week-time-grid"
              style={{ height: `${24 * HOUR_HEIGHT}px` }}
            >
              <div className="week-hours" aria-hidden="true">
                {Array.from({ length: 24 }, (_, hour) => (
                  <span
                    style={{ top: `${hour * HOUR_HEIGHT}px` }}
                    key={hour}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </span>
                ))}
              </div>

              {weekDates.map((date) => {
                const dateEvents = events
                  .filter((event) => eventOccursOnDate(event, date))
                  .sort((firstEvent, secondEvent) =>
                    (firstEvent.start_at ?? "").localeCompare(
                      secondEvent.start_at ?? "",
                    ),
                  );

                return (
                  <div
                    className="week-day-column"
                    style={{ "--hour-height": `${HOUR_HEIGHT}px` }}
                    key={getDateKey(date)}
                  >
                    {dateEvents.map((event) => {
                      const position = getEventPositionForDay(event, date);

                      return (
                        <div
                          className="week-event"
                          style={{
                            top: `${(position.startMinutes / 60) * HOUR_HEIGHT}px`,
                            height: `${Math.max(
                              (position.durationMinutes / 60) * HOUR_HEIGHT,
                              28,
                            )}px`,
                          }}
                          title={event.title}
                          key={event.id}
                        >
                          <strong>{event.title}</strong>
                          <span>
                            {formatMinutes(position.startMinutes)}–
                            {formatMinutes(
                              position.startMinutes + position.durationMinutes,
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WeekCalendar;
