export function startOfDayUTC(dateInput?: Date | string) {
  const date = dateInput ? new Date(dateInput) : new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function startOfDayInTimeZone(timeZone: string, dateInput?: Date | string) {
  const date = dateInput ? new Date(dateInput) : new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const year = get("year");
  const month = get("month");
  const day = get("day");

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export function dayBoundsForTimeZone(timeZone: string, dateInput?: Date | string) {
  const start = startOfDayInTimeZone(timeZone, dateInput);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function weekdayKeyForTimeZone(timeZone: string, dateInput?: Date | string) {
  const date = dateInput ? new Date(dateInput) : new Date();
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" });
  const label = formatter.format(date).toUpperCase();
  const map: Record<string, string> = {
    SUN: "SUN",
    MON: "MON",
    TUE: "TUE",
    WED: "WED",
    THU: "THU",
    FRI: "FRI",
    SAT: "SAT",
  };
  return (map[label] as typeof label) ?? "SUN";
}
