/** Hour the bedtime lockout lifts. */
export const LOCKOUT_END_HOUR = 5;

/** Local date key, YYYY-MM-DD. */
export const getDateKey = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const date = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${date}`;
};

/** m:ss countdown. Negative values show as overtime, e.g. +1:05. */
export const formatCountdown = (totalSecs: number) => {
    const abs = Math.abs(Math.round(totalSecs));
    const mins = Math.floor(abs / 60);
    const secs = abs % 60;
    return `${totalSecs < 0 ? "+" : ""}${mins}:${secs.toString().padStart(2, "0")}`;
};

/** h:mm:ss session clock. */
export const formatClock = (totalSecs: number) => {
    const s = Math.max(0, Math.floor(totalSecs));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}:${m.toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
};

/** 1h 08m / 42m from a minute count. */
export const formatHrsMins = (totalMins: number) => {
    const hrs = Math.floor(totalMins / 60);
    const mins = Math.floor(totalMins % 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins.toString().padStart(2, "0")}m`;
};

/** Is this hour inside the lockout window that starts at `startHour` (23, 0 or 1) and ends at 5 AM? */
export const isLockoutHour = (hour: number, startHour: number) => {
    if (startHour >= 12) return hour >= startHour || hour < LOCKOUT_END_HOUR;
    return hour >= startHour && hour < LOCKOUT_END_HOUR;
};

/** "11 PM", "12 AM", "1 AM". */
export const formatHour = (hour: number) => {
    const h = hour % 12 === 0 ? 12 : hour % 12;
    return `${h} ${hour < 12 ? "AM" : "PM"}`;
};

/** Minutes until the lockout begins, or null when it is already active. */
export const minutesUntilLockout = (now: Date, startHour: number) => {
    if (isLockoutHour(now.getHours(), startHour)) return null;
    const target = new Date(now);
    target.setHours(startHour, 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return Math.round((target.getTime() - now.getTime()) / 60000);
};
