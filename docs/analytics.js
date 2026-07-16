(() => {
  const root = document.documentElement;
  const endpoint = root.dataset.analyticsEndpoint || "";
  const pageVersion = root.dataset.pageVersion || "unknown";
  const eventZone = root.dataset.eventZone || "unknown";

  function createId(prefix) {
    const token = globalThis.crypto?.randomUUID?.()
      || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    return `${prefix}_${token}`;
  }

  function storedId(storage, key, prefix) {
    try {
      const current = storage.getItem(key);
      if (current) return current;
      const created = createId(prefix);
      storage.setItem(key, created);
      return created;
    } catch {
      return createId(prefix);
    }
  }

  const visitorId = storedId(localStorage, "hashigopon_visitor_id", "v");
  const sessionId = storedId(sessionStorage, "hashigopon_session_id", "s");
  const deviceType = matchMedia("(max-width: 600px)").matches
    ? "mobile"
    : matchMedia("(max-width: 1024px)").matches ? "tablet" : "desktop";

  function baseEvent(name) {
    return {
      timestamp: new Date().toISOString(),
      visitor_id: visitorId,
      session_id: sessionId,
      event_name: name,
      question_id: "",
      selected_value: "",
      shop_id: "",
      action: "",
      shop_rank: "",
      compatibility_percent: "",
      result_shop_ids: "",
      extracted_tags: "",
      page_version: pageVersion,
      event_zone: eventZone,
      device_type: deviceType
    };
  }

  function buildEvents(detail) {
    const name = String(detail?.name || "");
    if (!name) return [];

    const primary = baseEvent(name);
    primary.question_id = String(detail.question || "");
    primary.selected_value = name === "refine" || name === "required_refine"
      ? "条件追加"
      : String(detail.value || "");
    primary.shop_id = String(detail.shop || "");
    primary.action = String(detail.action || "");
    primary.result_shop_ids = Array.isArray(detail.shops) ? detail.shops.join(",") : "";
    primary.compatibility_percent = Array.isArray(detail.compatibility)
      ? detail.compatibility.join(",")
      : "";
    primary.extracted_tags = Array.isArray(detail.tags) ? detail.tags.join(",") : "";

    const events = [primary];
    if (name === "results" && Array.isArray(detail.shops)) {
      detail.shops.slice(0, 3).forEach((shopId, index) => {
        const impression = baseEvent("shop_impression");
        impression.shop_id = String(shopId || "");
        impression.shop_rank = index + 1;
        impression.compatibility_percent = Number(detail.compatibility?.[index] || 0);
        impression.result_shop_ids = primary.result_shop_ids;
        events.push(impression);
      });
    }
    return events;
  }

  function send(events) {
    if (!endpoint || !events.length) return;
    const body = JSON.stringify({ app_id: "hashigopon-v1", events });
    const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
    if (navigator.sendBeacon?.(endpoint, blob)) return;
    fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body
    }).catch(() => {});
  }

  window.addEventListener("hashigopon:event", event => {
    send(buildEvents(event.detail));
  });

  window.hashigoponAnalytics = {
    enabled: Boolean(endpoint),
    visitorId,
    sessionId,
    buildEvents
  };
})();

