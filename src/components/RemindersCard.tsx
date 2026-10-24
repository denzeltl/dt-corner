import { Armchair, Check, Eye, GlassWater, PersonStanding, Pill, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { MAGNESIUM_HOUR, WATER_GOAL, type Posture } from "../utils/config";
import { formatCountdown, formatHour } from "../utils/time";

type RemindersCardProps = {
    now: Date;
    isTimedIn: boolean;
    posture: Posture;
    postureSeconds: number;
    eyeSeconds: number;
    waterSeconds: number;
    waterCount: number;
    magnesiumTaken: boolean;
    onTogglePosture: () => void;
    onRestartEye: () => void;
    onLogWater: () => void;
    onToggleMagnesium: () => void;
};

export function RemindersCard({
    now,
    isTimedIn,
    posture,
    postureSeconds,
    eyeSeconds,
    waterSeconds,
    waterCount,
    magnesiumTaken,
    onTogglePosture,
    onRestartEye,
    onLogWater,
    onToggleMagnesium,
}: RemindersCardProps) {
    const magnesiumDue = !magnesiumTaken && now.getHours() >= MAGNESIUM_HOUR;
    const dueCount = [postureSeconds <= 0, eyeSeconds <= 0, waterSeconds <= 0].filter((due) => due && isTimedIn).length + (magnesiumDue ? 1 : 0);

    return (
        <section
            aria-labelledby="reminders-heading"
            className="card flex min-w-0 flex-col p-4 animate-rise [animation-delay:120ms] sm:p-5"
        >
            <div className="flex items-baseline justify-between gap-3">
                <h2 id="reminders-heading" className="text-sm font-medium text-muted">
                    Look after yourself
                </h2>
                <p className="text-[13px] text-muted" aria-live="polite">
                    {!isTimedIn ? "Paused until you time in" : dueCount > 0 ? <span className="text-sun">{dueCount} due now</span> : "All good"}
                </p>
            </div>

            <ul className="mt-3 flex flex-1 flex-col gap-1.5 wide:justify-center wide:gap-2 tall:justify-center tall:gap-2 strip:mt-2 strip:gap-1">
                <Reminder
                    icon={posture === "sitting" ? Armchair : PersonStanding}
                    label="Posture"
                    title={
                        postureSeconds <= 0 && isTimedIn
                            ? `Time to ${posture === "sitting" ? "stand up" : "sit down"}`
                            : posture === "sitting"
                              ? "Sitting"
                              : "Standing"
                    }
                    hint={`Tap when you ${posture === "sitting" ? "stand up" : "sit down"}`}
                    value={formatCountdown(postureSeconds)}
                    due={isTimedIn && postureSeconds <= 0}
                    paused={!isTimedIn}
                    onClick={onTogglePosture}
                />
                <Reminder
                    icon={Eye}
                    label="Eye rest"
                    title={eyeSeconds <= 0 && isTimedIn ? "Look 20 ft away" : "20-20-20 break"}
                    hint="Look at something 20 feet away for 20 seconds, then tap"
                    value={formatCountdown(eyeSeconds)}
                    due={isTimedIn && eyeSeconds <= 0}
                    paused={!isTimedIn}
                    onClick={onRestartEye}
                />
                <Reminder
                    icon={GlassWater}
                    label="Water"
                    title={
                        <>
                            <span key={waterCount} className="inline-block animate-pop tnum">
                                {waterCount}
                            </span>{" "}
                            {waterCount === 1 ? "glass" : "glasses"} today
                        </>
                    }
                    hint="Tap to log a glass"
                    value={formatCountdown(waterSeconds)}
                    due={isTimedIn && waterSeconds <= 0}
                    paused={!isTimedIn}
                    onClick={onLogWater}
                />
                <Reminder
                    icon={magnesiumTaken ? Check : Pill}
                    label="Magnesium"
                    title={magnesiumTaken ? "Taken today" : magnesiumDue ? "Take it now" : `Due at ${formatHour(MAGNESIUM_HOUR)}`}
                    hint={magnesiumTaken ? "Tap to undo" : "Tap when taken"}
                    value={magnesiumTaken ? "done" : magnesiumDue ? "now" : formatHour(MAGNESIUM_HOUR).toLowerCase()}
                    due={magnesiumDue}
                    done={magnesiumTaken}
                    pressed={magnesiumTaken}
                    onClick={onToggleMagnesium}
                />
            </ul>

            <div className="mt-4 border-t border-line pt-3 strip:mt-2 strip:pt-2">
                <div className="flex items-baseline justify-between text-sm text-muted">
                    <span>Water today</span>
                    <span className="tnum">
                        <span className="text-ink">{waterCount}</span> of {WATER_GOAL} glasses
                    </span>
                </div>
                <div
                    role="progressbar"
                    aria-label="Water today"
                    aria-valuemin={0}
                    aria-valuemax={WATER_GOAL}
                    aria-valuenow={Math.min(waterCount, WATER_GOAL)}
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"
                >
                    <div
                        className="h-full origin-left rounded-full bg-sea transition-transform duration-500 ease-out"
                        style={{ transform: `scaleX(${Math.min(waterCount, WATER_GOAL) / WATER_GOAL})` }}
                    />
                </div>
            </div>
        </section>
    );
}

type ReminderProps = {
    icon: LucideIcon;
    label: string;
    title: ReactNode;
    hint: string;
    value: string;
    due: boolean;
    paused?: boolean;
    done?: boolean;
    pressed?: boolean;
    onClick: () => void;
};

function Reminder({ icon: Icon, label, title, hint, value, due, paused, done, pressed, onClick }: ReminderProps) {
    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                aria-pressed={pressed}
                title={hint}
                className={`press flex min-h-14 w-full items-center gap-3 rounded-2xl border px-2.5 py-2 text-left strip:min-h-12 strip:py-1 ${
                    due ? "border-sun/45 bg-sun/10" : "border-transparent hover:bg-surface-2"
                }`}
            >
                <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl strip:size-9 transition-colors duration-200 ${
                        due ? "bg-sun text-sun-ink" : done ? "bg-success/15 text-success" : "bg-surface-2 text-muted"
                    }`}
                    aria-hidden="true"
                >
                    <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[13px] leading-tight text-muted">{label}</span>
                    <span className={`block truncate text-[15px] font-semibold leading-snug ${due ? "text-sun" : "text-ink"}`}>
                        {title}
                    </span>
                    <span className="sr-only">. {hint}</span>
                </span>
                <span className={`chip ${due ? "border-sun/40 text-sun" : paused || done ? "text-muted" : "text-ink"}`}>
                    {due ? "now" : value}
                </span>
            </button>
        </li>
    );
}
