import { useEffect, useRef, useState } from "react";
import {
  WEEKDAY_NAMES,
  addMonths,
  getDateKey,
  getMonthDates,
  isSameDay,
  parseDateTime,
} from "../dateUtils";

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const minutes = index * 15;
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
});

function formatDateLabel(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAY_NAMES[date.getDay()]}）`;
}

function DateTimePicker({
  defaultTime = "09:00",
  id,
  label,
  min,
  onChange,
  optional = false,
  value,
}) {
  const pickerRef = useRef(null);
  const selectedDate = parseDateTime(value) ?? new Date();
  const selectedDateKey = getDateKey(selectedDate);
  const selectedTime = value?.slice(11, 16) || "09:00";
  const minimumDateKey = min?.slice(0, 10) || "";
  const minimumTime = min?.slice(11, 16) || "";
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [displayedMonth, setDisplayedMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );

  useEffect(() => {
    if (!isCalendarOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isCalendarOpen]);

  function openCalendar() {
    setDisplayedMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    );
    setIsCalendarOpen((currentValue) => !currentValue);
  }

  function handleDateChange(date) {
    const nextDateKey = getDateKey(date);
    const nextTime =
      nextDateKey === minimumDateKey && selectedTime < minimumTime
        ? minimumTime
        : selectedTime;

    onChange(`${nextDateKey}T${nextTime}`);
    setIsCalendarOpen(false);
  }

  const calendarDates = getMonthDates(displayedMonth);
  const today = new Date();

  return (
    <div className="date-time-field">
      <span className="date-time-label">
        {label}
        {optional && <small>任意</small>}
      </span>
      {optional && !value ? (
        <button
          className="empty-date-time-button"
          type="button"
          onClick={() => onChange(`${getDateKey(today)}T${defaultTime}`)}
        >
          ＋ 日時を設定
        </button>
      ) : (
        <div className="date-time-controls">
          <div className="date-picker" ref={pickerRef}>
            <button
              className="date-picker-button"
              id={`${id}-date`}
              type="button"
              aria-expanded={isCalendarOpen}
              aria-haspopup="dialog"
              onClick={openCalendar}
            >
              <span aria-hidden="true">▦</span>
              {formatDateLabel(selectedDate)}
            </button>

            {isCalendarOpen && (
              <div
                className="date-picker-popover"
                role="dialog"
                aria-label={`${label}の日付を選択`}
              >
                <div className="date-picker-header">
                  <strong>
                    {displayedMonth.getFullYear()}年
                    {displayedMonth.getMonth() + 1}月
                  </strong>
                  <div>
                    <button
                      type="button"
                      aria-label="前の月"
                      onClick={() =>
                        setDisplayedMonth((currentMonth) =>
                          addMonths(currentMonth, -1),
                        )
                      }
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="次の月"
                      onClick={() =>
                        setDisplayedMonth((currentMonth) =>
                          addMonths(currentMonth, 1),
                        )
                      }
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div className="date-picker-weekdays" aria-hidden="true">
                  {WEEKDAY_NAMES.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>

                <div className="date-picker-days">
                  {calendarDates.map((date) => {
                    const dateKey = getDateKey(date);
                    const isOutsideMonth =
                      date.getMonth() !== displayedMonth.getMonth();
                    const isSelected = dateKey === selectedDateKey;

                    return (
                      <button
                        className={`${isOutsideMonth ? "is-outside-month" : ""}${isSelected ? " is-selected" : ""}${isSameDay(date, today) ? " is-today" : ""}`}
                        type="button"
                        disabled={Boolean(
                          minimumDateKey && dateKey < minimumDateKey,
                        )}
                        aria-label={`${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`}
                        aria-pressed={isSelected}
                        key={dateKey}
                        onClick={() => handleDateChange(date)}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <select
            className="time-picker-select"
            id={`${id}-time`}
            aria-label={`${label}の時刻`}
            value={selectedTime}
            onChange={(event) =>
              onChange(`${selectedDateKey}T${event.target.value}`)
            }
          >
            {TIME_OPTIONS.map((time) => (
              <option
                value={time}
                disabled={
                  selectedDateKey === minimumDateKey && time < minimumTime
                }
                key={time}
              >
                {time}
              </option>
            ))}
          </select>
          {optional && (
            <button
              className="clear-date-time-button"
              type="button"
              aria-label={`${label}を削除`}
              title={`${label}を削除`}
              onClick={() => onChange("")}
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default DateTimePicker;
