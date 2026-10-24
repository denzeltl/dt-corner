import { Moon, Pause, Play, RotateCcw, Settings, Target } from "lucide-react";
import type { FocusState } from "../utils/config";
import { formatClock, formatCountdown, formatHour, formatHrsMins, minutesUntilLockout } from "../utils/time";
import { Mark } from "./Mark";
import { SkyPanel } from "./SkyPanel";

type ClockCardProps = {
    now: Date;
    lockoutHour: number;
    isTimedIn: boolean;
    sessionSeconds: number;
    isAutoPaused: boolean;
    focusState: FocusState;
    isBreak: boolean;
    focusTimer: number;
    autoTracking: { available: boolean; minutes: number } | null;
    onToggleSession: () => void;
    onFocusClick: () => void;
    onFocusReset: () => void;
    onOpenSettings: () => void;
    className?: string;
};

export function ClockCard({
    now,
    lockoutHour,
    isTimedIn,
    sessionSeconds,
    isAutoPaused,
    focusState,
    isBreak,
    focusTimer,
    autoTracking,
    onToggleSession,
    onFocusClick,
    onFocusReset,
    onOpenSettings,
    className = "",
}: ClockCardProps) {
    const hours = now.getHours();
    const clock = `${hours % 12 === 0 ? 12 : hours % 12}:${now.getMinutes().toString().padStart(2, "0")}`;
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const meridiem = hours < 12 ? "AM" : "PM";
    const date = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
    const untilLockout = minutesUntilLockout(now, lockoutHour);

    const focusLabel =
        focusState === "idle"
            ? "Start a 25-min focus"
            : focusState === "running"
              ? isBreak
                  ? "On a break"
                  : "Focusing"
              : focusState === "paused"
                ? "Paused · tap to resume"
                : isBreak
                  ? "Break over · back to focus"
                  : "Focus done · take a break";

    const focusTone =
        focusState === "running"
            ? isBreak
                ? "border-success/40 bg-success/10 text-success"
                : "border-focus/45 bg-focus/12 text-focus"
            : focusState === "completed"
              ? "border-sun/50 bg-sun/12 text-sun"
              : "border-line bg-surface-2 text-ink";

    return (
        <section aria-label="Clock and session" className={`card flex min-w-0 flex-col overflow-hidden animate-rise ${className}`}>
            <div className="relative h-32 shrink-0 sm:h-36 wide:h-auto wide:min-h-36 wide:flex-1 strip:min-h-16 tall:h-auto tall:flex-1">
                <SkyPanel now={now} lockoutStartHour={lockoutHour} className="absolute inset-0 h-full" />
                <div className="relative flex items-center justify-between p-3 pl-4">
                    <div className="flex items-center gap-2">
                        <Mark size={24} />
                        <span className="font-display text-[15px] font-semibold text-ink [text-shadow:0_1px_8px_rgb(0_0_0/0.35)]">
                            DT Corner
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onOpenSettings}
                        className="press group grid size-11 place-items-center rounded-full bg-night/45 text-ink backdrop-blur-sm hover:bg-night/65"
                        aria-label="Open settings"
                    >
                        <Settings size={18} className="transition-transform duration-300 ease-out group-hover:rotate-45" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-5 p-4 pt-1 sm:p-5 sm:pt-1 strip:gap-3 strip:p-4 strip:pt-2">
                <div>
                    <p className="flex items-baseline gap-1.5 font-display leading-none" aria-live="off">
                        <span className="tnum text-[56px] font-semibold tracking-[-0.02em] sm:text-[64px] strip:text-[44px]">{clock}</span>
                        <span className="font-mono text-base text-muted tnum">:{seconds}</span>
                        <span className="ml-1 font-sans text-base font-semibold text-muted">{meridiem}</span>
                    </p>
                    <p className="mt-2 text-base text-muted strip:mt-1 strip:text-sm">{date}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted strip:mt-0.5">
                        <Moon size={14} className="text-sun" aria-hidden="true" />
                        {untilLockout === null
                            ? "Lockout is on until 5 AM"
                            : `${formatHrsMins(untilLockout)} until the ${formatHour(lockoutHour)} lockout`}
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={onToggleSession}
                        aria-pressed={isTimedIn}
                        className={`press flex min-h-12 w-full items-center strip:min-h-11 justify-between gap-3 rounded-full border px-5 text-[15px] font-semibold ${
                            isTimedIn
                                ? "border-transparent bg-linear-to-r from-sun to-rose text-sun-ink"
                                : "border-line bg-surface-2 text-ink hover:border-faint"
                        }`}
                    >
                        <span className="flex items-center gap-2.5">
                            {isTimedIn ? (
                                <span className="relative flex size-2.5" aria-hidden="true">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-sun-ink/50 motion-reduce:hidden" />
                                    <span className="relative inline-flex size-2.5 rounded-full bg-sun-ink" />
                                </span>
                            ) : (
                                <Play size={14} className="fill-current" aria-hidden="true" />
                            )}
                            {isTimedIn ? (
                                <>
                                    Working<span className="sr-only">. Tap to time out</span>
                                </>
                            ) : isAutoPaused ? (
                                "Resume session"
                            ) : (
                                "Time in"
                            )}
                        </span>
                        {(isTimedIn || isAutoPaused) && (
                            <span className={`chip ${isTimedIn ? "border-white/30 bg-white/30 text-sun-ink" : "text-muted"}`}>
                                {formatClock(sessionSeconds)}
                            </span>
                        )}
                    </button>

                    {autoTracking && (
                        <p className="px-2 text-[13px] text-muted">
                            {!autoTracking.available
                                ? "Auto tracking runs in the desktop app only."
                                : isAutoPaused
                                  ? "Paused while you were away. Move the mouse to pick up where you left off."
                                  : `Auto tracking on · times out after ${autoTracking.minutes} min idle`}
                        </p>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onFocusClick}
                            disabled={!isTimedIn}
                            className={`press flex min-h-12 min-w-0 flex-1 strip:min-h-11 items-center justify-between gap-3 rounded-full border px-5 text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-55 ${focusTone} ${
                                focusState === "idle" ? "hover:border-faint" : ""
                            }`}
                        >
                            <span className="flex min-w-0 items-center gap-2.5">
                                {focusState === "running" ? (
                                    <Pause size={14} className="shrink-0 fill-current" aria-hidden="true" />
                                ) : focusState === "idle" ? (
                                    <Target size={16} className="shrink-0" aria-hidden="true" />
                                ) : (
                                    <Play size={14} className="shrink-0 fill-current" aria-hidden="true" />
                                )}
                                <span className="truncate">{isTimedIn || focusState !== "idle" ? focusLabel : "Time in to focus"}</span>
                            </span>
                            {focusState !== "idle" && <span className="chip text-ink">{formatCountdown(focusTimer)}</span>}
                        </button>
                        {focusState !== "idle" && (
                            <button
                                type="button"
                                onClick={onFocusReset}
                                aria-label="Reset focus timer"
                                className="press group grid size-12 shrink-0 place-items-center rounded-full border strip:size-11 border-line bg-surface-2 text-muted hover:border-danger/50 hover:text-danger"
                            >
                                <RotateCcw size={16} className="transition-transform duration-200 group-hover:-rotate-45" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
