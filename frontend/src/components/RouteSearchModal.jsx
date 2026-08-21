import { useState } from "react";
import { WEEKDAY_NAMES, parseDateTime } from "../dateUtils";

function formatDesiredArrival(event) {
  const startDate = parseDateTime(event.start_at);

  if (!startDate) {
    return "未設定";
  }

  const bufferMinutes = event.arrival_buffer_minutes ?? 0;
  const desiredArrival = new Date(
    startDate.getTime() - bufferMinutes * 60 * 1000,
  );
  const hour = String(desiredArrival.getHours()).padStart(2, "0");
  const minute = String(desiredArrival.getMinutes()).padStart(2, "0");

  return `${desiredArrival.getFullYear()}年${desiredArrival.getMonth() + 1}月${desiredArrival.getDate()}日（${WEEKDAY_NAMES[desiredArrival.getDay()]}） ${hour}:${minute}`;
}

function RouteSearchModal({
  event,
  initialRouteResult,
  onBack,
  onBusyChange,
  onSearch,
  onSearchSuccess,
}) {
  const [origin, setOrigin] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [routeResult, setRouteResult] = useState(initialRouteResult);

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();

    if (isSearching) {
      return;
    }

    const trimmedOrigin = origin.trim();
    if (!trimmedOrigin) {
      setErrorMessage("出発地を入力してください");
      return;
    }

    setIsSearching(true);
    onBusyChange(true);
    setErrorMessage("");
    setRouteResult(null);

    try {
      const result = await onSearch(event.id, trimmedOrigin);
      setRouteResult(result);
      onSearchSuccess?.(result);
    } catch (searchError) {
      setErrorMessage(searchError.message);
    } finally {
      setIsSearching(false);
      onBusyChange(false);
    }
  }

  return (
    <form className="route-search-form" onSubmit={handleSubmit}>
      <div className="modal-form-field">
        <label htmlFor="route-search-origin">出発地</label>
        <input
          id="route-search-origin"
          type="text"
          value={origin}
          placeholder="例：九州大学 伊都キャンパス"
          autoFocus
          disabled={isSearching}
          onChange={(inputEvent) => {
            setOrigin(inputEvent.target.value);
            setErrorMessage("");
            setRouteResult(null);
          }}
        />
      </div>

      <dl className="route-search-summary">
        <div>
          <dt>目的地</dt>
          <dd>{event.destination}</dd>
        </div>
        <div>
          <dt>到着希望時刻</dt>
          <dd>{formatDesiredArrival(event)}</dd>
        </div>
        <div>
          <dt>到着余裕時間</dt>
          <dd>{event.arrival_buffer_minutes ?? 0}分</dd>
        </div>
      </dl>

      {errorMessage && (
        <p className="modal-error-message" role="alert">
          {errorMessage}
        </p>
      )}

      {routeResult && (
        <p className="route-search-success" role="status">
          経路が見つかりました
        </p>
      )}

      <div className="modal-actions">
        <button
          className="secondary-button"
          type="button"
          disabled={isSearching}
          onClick={onBack}
        >
          戻る
        </button>
        <button
          className="primary-button"
          type="submit"
          disabled={isSearching}
        >
          {isSearching ? "検索中..." : "検索する"}
        </button>
      </div>
    </form>
  );
}

export default RouteSearchModal;
