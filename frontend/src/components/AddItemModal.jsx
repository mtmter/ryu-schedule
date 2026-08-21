import { useEffect, useState } from "react";

function AddItemModal({ initialValues, onClose, onSubmit }) {
  const [itemType, setItemType] = useState(initialValues.itemType);
  const [title, setTitle] = useState("");
  const [eventStartAt, setEventStartAt] = useState(
    initialValues.eventStartAt,
  );
  const [eventEndAt, setEventEndAt] = useState(initialValues.eventEndAt);
  const [taskDueAt, setTaskDueAt] = useState(initialValues.taskDueAt);
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onClose]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setErrorMessage(
        itemType === "event"
          ? "予定タイトルを入力してください"
          : "タスクタイトルを入力してください",
      );
      return;
    }

    if (itemType === "event") {
      if (!eventStartAt || !eventEndAt) {
        setErrorMessage("開始日時と終了日時を入力してください");
        return;
      }

      if (eventEndAt < eventStartAt) {
        setErrorMessage("終了日時は開始日時以降にしてください");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (itemType === "event") {
        await onSubmit("event", {
          title: title.trim(),
          start_at: eventStartAt,
          end_at: eventEndAt,
          description,
        });
      } else {
        await onSubmit("task", {
          title: title.trim(),
          due_at: taskDueAt || null,
          description,
        });
      }
    } catch (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <section
        className="add-item-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-heading"
      >
        <div className="modal-header">
          <div>
            <p>新しく追加</p>
            <h2 id="add-item-heading">
              {itemType === "event" ? "予定を追加" : "タスクを追加"}
            </h2>
          </div>
          <button
            className="modal-close-button"
            type="button"
            aria-label="閉じる"
            disabled={isSubmitting}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="item-type-tabs" aria-label="追加する種類">
          <button
            className={itemType === "event" ? "is-active" : ""}
            type="button"
            onClick={() => {
              setItemType("event");
              setErrorMessage("");
            }}
          >
            予定
          </button>
          <button
            className={itemType === "task" ? "is-active" : ""}
            type="button"
            onClick={() => {
              setItemType("task");
              setErrorMessage("");
            }}
          >
            タスク
          </button>
        </div>

        <form className="add-item-form" onSubmit={handleSubmit}>
          <div className="modal-form-field">
            <label htmlFor="item-title">
              {itemType === "event" ? "予定タイトル" : "タスクタイトル"}
            </label>
            <input
              id="item-title"
              type="text"
              value={title}
              placeholder={
                itemType === "event" ? "例：ミーティング" : "例：資料を作る"
              }
              autoFocus
              required
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          {itemType === "event" ? (
            <div className="modal-date-fields">
              <div className="modal-form-field">
                <label htmlFor="event-start-at">開始日時</label>
                <input
                  id="event-start-at"
                  type="datetime-local"
                  value={eventStartAt}
                  required
                  onChange={(event) => setEventStartAt(event.target.value)}
                />
              </div>
              <div className="modal-form-field">
                <label htmlFor="event-end-at">終了日時</label>
                <input
                  id="event-end-at"
                  type="datetime-local"
                  value={eventEndAt}
                  min={eventStartAt}
                  required
                  onChange={(event) => setEventEndAt(event.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="modal-form-field">
              <label htmlFor="task-due-at">
                期限 <span>任意</span>
              </label>
              <input
                id="task-due-at"
                type="datetime-local"
                value={taskDueAt}
                onChange={(event) => setTaskDueAt(event.target.value)}
              />
            </div>
          )}

          <div className="modal-form-field">
            <label htmlFor="item-description">
              説明 <span>任意</span>
            </label>
            <textarea
              id="item-description"
              value={description}
              placeholder="補足があれば入力してください"
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          {errorMessage && (
            <p className="modal-error-message" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="modal-actions">
            <button
              className="secondary-button"
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              className="primary-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "追加中..." : "追加"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AddItemModal;
