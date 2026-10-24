import { getDateKey, formatHrsMins } from "../utils/time";

type WeekCardProps = {
    now: Date;
    dailyLogs: Record<string, number>;
    dailyFocusLogs: Record<string, number>;
};

export function WeekCard({ now, dailyLogs, dailyFocusLogs }: WeekCardProps) {
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const key = getDateKey(d);
        return {
            key,
            short: i === 6 ? "Today" : d.toLocaleDateString([], { weekday: "short" }),
            long: i === 6 ? "Today" : d.toLocaleDateString([], { weekday: "long" }),
            minutes: dailyLogs[key] || 0,
            focus: Math.min(dailyFocusLogs[key] || 0, dailyLogs[key] || 0),
        };
    });

    const today = days[6];
    const max = Math.max(120, ...days.map((d) => d.minutes));
    const total = days.reduce((sum, d) => sum + d.minutes, 0);
    const activeDays = days.filter((d) => d.minutes >= 1).length;
    const hasData = total >= 1;

    return (
        <section
            aria-labelledby="week-heading"
            className="card flex min-h-[300px] min-w-0 flex-col p-4 strip:min-h-0 animate-rise [animation-delay:60ms] sm:p-5"
        >
            <h2 id="week-heading" className="text-sm font-medium text-muted">
                Screen time today
            </h2>
            <p className="mt-1 font-display text-[40px] leading-none font-semibold tnum strip:text-[32px]">{formatHrsMins(today.minutes)}</p>
            <p className="mt-2 text-sm text-muted strip:mt-1">
                <span className="text-focus">{formatHrsMins(today.focus)}</span> of it in focus
            </p>

            <div className="mt-5 flex min-h-[150px] flex-1 flex-col strip:mt-3 strip:min-h-0">
                <div className="mb-2 flex items-center gap-4 text-[13px] text-muted strip:hidden">
                    <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-sea" aria-hidden="true" /> Screen
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-focus" aria-hidden="true" /> Focus
                    </span>
                </div>

                <ol className="relative grid flex-1 grid-cols-7 items-end gap-1.5 sm:gap-2.5" aria-label="Last 7 days">
                    {days.map((d, i) => {
                        const isToday = i === 6;
                        const height = d.minutes > 0 ? Math.max(4, (d.minutes / max) * 100) : 0;
                        const focusShare = d.minutes > 0 ? (d.focus / d.minutes) * 100 : 0;
                        return (
                            <li key={d.key} className="group relative flex h-full flex-col items-center justify-end">
                                <div
                                    tabIndex={0}
                                    aria-label={`${d.long}: ${formatHrsMins(d.minutes)} on screen, ${formatHrsMins(d.focus)} focus`}
                                    className="relative w-full max-w-9 rounded-t-full rounded-b-md outline-none transition-[height] duration-500 ease-out focus-visible:ring-2 focus-visible:ring-sun focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                    style={{ height: `${height}%`, minHeight: 6 }}
                                >
                                    <div
                                        className={`absolute inset-0 rounded-t-full rounded-b-md ${
                                            d.minutes === 0 ? "bg-line/60" : isToday ? "bg-sun/30" : "bg-sea/25"
                                        }`}
                                    />
                                    <div
                                        className={`absolute inset-x-0 bottom-0 rounded-b-md ${focusShare > 92 ? "rounded-t-full" : ""} ${
                                            isToday ? "bg-linear-to-b from-sun to-rose" : "bg-sea"
                                        }`}
                                        style={{ height: `${d.minutes > 0 ? 100 - focusShare : 0}%`, opacity: isToday ? 1 : 0.85 }}
                                    />
                                    {focusShare > 0 && (
                                        <div
                                            className="absolute inset-x-0 rounded-t-full bg-focus"
                                            style={{ bottom: `${100 - focusShare}%`, height: `${focusShare}%` }}
                                        />
                                    )}
                                    <div
                                        role="tooltip"
                                        className={`pointer-events-none absolute bottom-full z-10 mb-2 ${
                                            i < 2 ? "left-0" : i > 4 ? "right-0" : "left-1/2 -translate-x-1/2"
                                        } translate-y-1 rounded-lg border border-line bg-night px-2.5 py-1.5 text-xs whitespace-nowrap opacity-0 shadow-lg transition duration-150 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100`}
                                    >
                                        <span className="font-semibold text-ink">{d.long}</span>
                                        <br />
                                        <span className="text-sea">{formatHrsMins(d.minutes)}</span>
                                        <span className="text-muted"> · </span>
                                        <span className="text-focus">{formatHrsMins(d.focus)} focus</span>
                                    </div>
                                </div>
                                <span
                                    className={`mt-2 text-xs ${isToday ? "font-semibold text-sun" : "text-muted"}`}
                                    aria-hidden="true"
                                >
                                    {d.short}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            </div>

            <p className="mt-4 border-t border-line pt-3 text-sm text-muted strip:mt-2 strip:pt-2">
                {hasData ? (
                    <>
                        This week <span className="text-ink tnum">{formatHrsMins(total)}</span>
                        <span aria-hidden="true"> · </span>
                        avg <span className="text-ink tnum">{formatHrsMins(total / Math.max(1, activeDays))}</span> a day
                    </>
                ) : (
                    "Time in to start filling your week."
                )}
            </p>
        </section>
    );
}
