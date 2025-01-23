import { baseUrl } from "../utils";

export const createEvent = (body: any) => {
  return fetch(`${baseUrl}/create-event`, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
};

export const fetchFreeSlotsByDateAndTimeZone = (date: string, selectedTimezone: string) => {
  return fetch(`${baseUrl}/free-slots?date=${date}&timezone=${selectedTimezone}`);
};

export const getMeetingBetweenTime = (startDate: string, endDate: string) => {
  return fetch(`${baseUrl}/get-events?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
};
