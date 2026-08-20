import { formatTaskDue, sortTasksByDueDate } from "../dateUtils";

function TaskRow({ task, updatingTaskId, onTaskToggle }) {
  return (
    <li className={`task-row${task.completed ? " is-completed" : ""}`}>
      <input
        type="checkbox"
        checked={task.completed}
        disabled={updatingTaskId === task.id}
        aria-label={`${task.title}を${task.completed ? "未完了" : "完了"}にする`}
        onChange={() => onTaskToggle(task)}
      />
      <div className="task-row-content">
        <span className="task-row-title">{task.title}</span>
        <time dateTime={task.due_at ?? undefined}>
          {formatTaskDue(task.due_at)}
        </time>
        {task.description && <p>{task.description}</p>}
      </div>
    </li>
  );
}

function TaskList({ tasks, updatingTaskId, onTaskToggle }) {
  const incompleteTasks = sortTasksByDueDate(
    tasks.filter((task) => !task.completed),
  );
  const completedTasks = sortTasksByDueDate(
    tasks.filter((task) => task.completed),
  );

  return (
    <section className="task-list-view" aria-labelledby="task-list-heading">
      <div className="task-list-heading">
        <div>
          <p>やること</p>
          <h2 id="task-list-heading">タスク</h2>
        </div>
        <span>{incompleteTasks.length}件</span>
      </div>

      {incompleteTasks.length === 0 ? (
        <p className="empty-message">未完了のタスクはありません。</p>
      ) : (
        <ul className="task-rows">
          {incompleteTasks.map((task) => (
            <TaskRow
              task={task}
              updatingTaskId={updatingTaskId}
              onTaskToggle={onTaskToggle}
              key={task.id}
            />
          ))}
        </ul>
      )}

      <details className="completed-tasks">
        <summary>
          <span>完了済み</span>
          <span>{completedTasks.length}件</span>
        </summary>

        {completedTasks.length === 0 ? (
          <p className="empty-message">完了済みのタスクはありません。</p>
        ) : (
          <ul className="task-rows">
            {completedTasks.map((task) => (
              <TaskRow
                task={task}
                updatingTaskId={updatingTaskId}
                onTaskToggle={onTaskToggle}
                key={task.id}
              />
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}

export default TaskList;
