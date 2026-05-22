import { apiUrl } from "../api/lehrplanApi";

export const fetchIcsSubscription = async (url, subscriptionId) => {
  const response = await fetch(apiUrl("/api/calendar/fetch"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, subscriptionId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && !data.error) {
    return { ok: false, error: `HTTP ${response.status}`, events: [] };
  }
  return data;
};
