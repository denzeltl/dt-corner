import { useEffect, useRef } from "react";
import { playAlarm } from "../utils/audio";
import { formatHour, formatHrsMins, LOCKOUT_END_HOUR } from "../utils/time";

type LockdownScreenProps = {
    now: Date;
    lockoutHour: number;
    isTimedIn: boolean;
    audioEnabled: boolean;
    todayMinutes: number;
    magnesiumDue: boolean;
    onTimeOut: () => void;
    onTakeMagnesium: () => void;
    /** Present only while previewing the lockout from developer settings. */
    onExitPreview?: () => void;
};

export function LockdownScreen({
    now,
    lockoutHour,
    isTimedIn,
    audioEnabled,
    todayMinutes,
    magnesiumDue,
    onTimeOut,
    onTakeMagnesium,
    onExitPreview,
}: LockdownScreenProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);

    // A low alarm every 8 seconds until you time out.
    useEffect(() => {
        if (!isTimedIn || !audioEnabled) return;
        playAlarm();
        const interval = window.setInterval(playAlarm, 8000);
        return () => window.clearInterval(interval);
    }, [audioEnabled, isTimedIn]);

    useEffect(() => {
        buttonRef.current?.focus();
    }, [isTimedIn]);

    const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    return (
        <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="lockout-heading"
            aria-describedby="lockout-body"
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[radial-gradient(ellipse_at_50%_120%,#1d2550_0%,#070a16_65%)] p-6 text-center animate-fade-up"
        >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                {STARS.map(([x, y, s], i) => (
                    <span
                        key={i}
                        className="absolute rounded-full bg-white"
                        style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, opacity: 0.25 + (i % 4) * 0.15 }}
                    />
                ))}
                <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-24 w-full">
                    <path d="M0 40 60 26 120 36 190 18 260 32 330 22 400 34V60H0Z" fill="#141a30" />
                    <path d="M0 50 80 42 170 50 250 40 330 48 400 44V60H0Z" fill="#0b1020" />
                </svg>
            </div>

            <div className="relative flex w-full max-w-md flex-col items-center">
                <span
                    aria-hidden="true"
                    className="mb-6 block size-16 -rotate-20 rounded-full shadow-[inset_-16px_-6px_0_0_#f4ecd6]"
                />
                <h1 id="lockout-heading" className="max-w-full font-display text-[clamp(2.25rem,9vw,3.75rem)] font-semibold tracking-[-0.02em] text-balance [overflow-wrap:anywhere]">
                    {isTimedIn ? "Time to stop." : "Goodnight."}
                </h1>
                <p className="mt-3 font-mono text-lg text-sun tnum">{time}</p>

                <p id="lockout-body" className="mt-5 max-w-[38ch] text-base text-muted text-balance [overflow-wrap:anywhere]">
                    {isTimedIn
                        ? `It's past ${formatHour(lockoutHour)}. Finish what you're doing, then step away and rest your eyes.`
                        : `Session closed. You were on screen for ${formatHrsMins(todayMinutes)} today. The screen unlocks at ${LOCKOUT_END_HOUR} AM.`}
                </p>

                {magnesiumDue && (
                    <button
                        type="button"
                        onClick={onTakeMagnesium}
                        className="press mt-5 min-h-11 max-w-full rounded-full border border-line bg-surface/80 px-4 text-sm font-semibold text-muted backdrop-blur-sm [overflow-wrap:anywhere] hover:border-faint hover:text-ink"
                    >
                        Took my magnesium
                    </button>
                )}

                {isTimedIn && (
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={onTimeOut}
                        className="press mt-7 min-h-12 w-full max-w-xs rounded-full bg-linear-to-r from-sun to-rose px-6 text-[15px] font-semibold text-sun-ink"
                    >
                        Time out for the night
                    </button>
                )}

                {onExitPreview && (
                    <button
                        type="button"
                        onClick={onExitPreview}
                        className="press mt-4 min-h-11 rounded-full px-4 text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
                    >
                        Exit preview
                    </button>
                )}
            </div>
        </div>
    );
}

const STARS: [number, number, number][] = [
    [6, 12, 2], [14, 30, 1], [22, 8, 2], [31, 44, 1], [38, 18, 1], [47, 6, 2], [55, 34, 1], [63, 14, 2],
    [71, 40, 1], [78, 9, 1], [86, 26, 2], [93, 48, 1], [9, 58, 1], [27, 66, 1], [52, 60, 2], [69, 62, 1],
    [88, 64, 1], [42, 28, 1], [97, 16, 2], [3, 40, 1],
];
