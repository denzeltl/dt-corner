import { useCallback, useEffect, useRef, useState } from "react";
import { ClockCard } from "./components/ClockCard";
import { LockdownScreen } from "./components/LockdownScreen";
import { RemindersCard } from "./components/RemindersCard";
import { SettingsSheet } from "./components/SettingsSheet";
import { WeekCard } from "./components/WeekCard";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useSystemIdle } from "./hooks/useSystemIdle";
import { playChime, playSuccess } from "./utils/audio";
import {
    BREAK_DURATION,
    FOCUS_DURATION,
    MAGNESIUM_HOUR,
    SITTING_DURATION,
    STANDING_DURATION,
    type FocusState,
    type Posture,
} from "./utils/config";
import { getDateKey, isLockoutHour } from "./utils/time";

// An auto time-out followed by activity within this window resumes the same session.
const RESUME_WINDOW_MS = 4 * 60 * 60 * 1000;
// Gaps longer than this between ticks (sleep, hibernate) are not counted as screen time.
const MAX_TICK_GAP_SECONDS = 90;

/** Countdowns for the current session, persisted so a reload does not lose them. */
type SessionTimers = {
    elapsed: number;
    posture: number;
    water: number;
    eye: number;
};

const freshTimers = (posture: Posture, waterMins: number, eyeMins: number): SessionTimers => ({
    elapsed: 0,
    posture: posture === "sitting" ? SITTING_DURATION : STANDING_DURATION,
    water: waterMins * 60,
    eye: eyeMins * 60,
});

const addMinutes = (logs: Record<string, number>, key: string, seconds: number) => ({
    ...logs,
    [key]: Math.max(0, +((logs[key] || 0) + seconds / 60).toFixed(4)),
});

function App() {
    const [now, setNow] = useState(() => new Date());
    const todayKey = getDateKey(now);

    // --- PERSISTED DATA ---
    const [isTimedIn, setIsTimedIn] = useLocalStorage<boolean>("dt_corner_is_timed_in", false);
    const [dailyLogs, setDailyLogs] = useLocalStorage<Record<string, number>>("dt_corner_daily_logs", {});
    const [dailyFocusLogs, setDailyFocusLogs] = useLocalStorage<Record<string, number>>("dt_corner_focus_logs", {});
    const [waterCount, setWaterCount] = useLocalStorage<number>("dt_corner_water_count", 0);
    const [lastWaterResetDate, setLastWaterResetDate] = useLocalStorage<string>("dt_corner_last_water_reset", todayKey);
    const [magnesiumTaken, setMagnesiumTaken] = useLocalStorage<boolean>("dt_corner_magnesium_taken", false);
    const [lastMagnesiumResetDate, setLastMagnesiumResetDate] = useLocalStorage<string>(
        "dt_corner_last_magnesium_reset",
        todayKey,
    );
    const [posture, setPosture] = useLocalStorage<Posture>("dt_corner_posture", "sitting");
    const [focusState, setFocusState] = useLocalStorage<FocusState>("dt_corner_focus_state", "idle");
    const [isBreak, setIsBreak] = useLocalStorage<boolean>("dt_corner_is_break", false);
    const [focusTimer, setFocusTimer] = useLocalStorage<number>("dt_corner_focus_timer", FOCUS_DURATION);
    // When the computer went idle before an automatic time-out. Activity soon after resumes the session.
    const [autoPausedAt, setAutoPausedAt] = useLocalStorage<number | null>("dt_corner_auto_paused_at", null);

    // --- SETTINGS ---
    const [waterInterval, setWaterInterval] = useLocalStorage<number>("dt_corner_water_interval", 45);
    const [eyeInterval, setEyeInterval] = useLocalStorage<number>("dt_corner_eye_interval", 20);
    const [lockoutHour, setLockoutHour] = useLocalStorage<number>("dt_corner_lockout_hour", 0);
    const [audioEnabled, setAudioEnabled] = useLocalStorage<boolean>("dt_corner_audio_enabled", true);
    const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage<boolean>(
        "dt_corner_notifications_enabled",
        false,
    );
    const [autoTrackingEnabled, setAutoTrackingEnabled] = useLocalStorage<boolean>(
        "dt_corner_auto_tracking_enabled",
        false,
    );
    const [autoTrackingMinutes, setAutoTrackingMinutes] = useLocalStorage<number>(
        "dt_corner_auto_tracking_minutes",
        10,
    );

    const [timers, setTimers] = useLocalStorage<SessionTimers>(
        "dt_corner_session_timers",
        freshTimers("sitting", waterInterval, eyeInterval),
    );

    // --- RUNTIME ---
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [previewLockout, setPreviewLockout] = useState(false);
    const [notificationError, setNotificationError] = useState<string | null>(null);
    // A manual time-out stays off until the computer has first been idle again.
    const [autoTrackingArmed, setAutoTrackingArmed] = useState(true);
    const { available: systemIdleAvailable, idleSeconds: systemIdleSeconds } = useSystemIdle();
    const notifiedRef = useRef<Record<string, string>>({});
    const lastTickRef = useRef(Date.now());

    const lockdownActive = isLockoutHour(now.getHours(), lockoutHour) || previewLockout;

    // --- NOTIFICATIONS ---
    const sendNotification = useCallback(
        (title: string, body: string, soundType: "chime" | "success" = "chime") => {
            if (notificationsEnabled) {
                if ("__TAURI_INTERNALS__" in window) {
                    void import("@tauri-apps/plugin-notification")
                        .then(({ sendNotification: sendNativeNotification }) => sendNativeNotification({ title, body }))
                        .catch((error) => console.warn("Native notification failed:", error));
                } else if ("Notification" in window && Notification.permission === "granted") {
                    try {
                        new Notification(title, { body, icon: "/icon-192.png" });
                    } catch (err) {
                        console.warn("Notification failed:", err);
                    }
                }
            }
            if (audioEnabled) {
                if (soundType === "chime") playChime();
                else playSuccess();
            }
        },
        [audioEnabled, notificationsEnabled],
    );

    /** Fire a notification once per key per day. */
    const notifyOnce = useCallback(
        (key: string, title: string, body: string, soundType: "chime" | "success" = "chime") => {
            const stamp = getDateKey();
            if (notifiedRef.current[key] === stamp) return;
            notifiedRef.current[key] = stamp;
            sendNotification(title, body, soundType);
        },
        [sendNotification],
    );

    const requestNotificationPermission = async () => {
        setNotificationError(null);
        if ("__TAURI_INTERNALS__" in window) {
            try {
                const { isPermissionGranted, requestPermission, sendNotification: sendNative } = await import(
                    "@tauri-apps/plugin-notification"
                );
                const granted = (await isPermissionGranted()) || (await requestPermission()) === "granted";
                setNotificationsEnabled(granted);
                if (granted) {
                    sendNative({ title: "Alerts on", body: "DT Corner will remind you here." });
                    if (audioEnabled) playSuccess();
                } else {
                    setNotificationError("Windows blocked notifications. Allow them in Windows Settings, then try again.");
                }
            } catch (error) {
                console.warn("Native notification permission failed:", error);
                setNotificationsEnabled(false);
                setNotificationError("Couldn't turn on Windows notifications. Reinstall the desktop app and try again.");
            }
            return;
        }

        if (!("Notification" in window)) {
            setNotificationError("This browser can't show desktop notifications.");
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            setNotificationsEnabled(true);
            new Notification("Alerts on", { body: "DT Corner will remind you here.", icon: "/icon-192.png" });
            if (audioEnabled) playSuccess();
        } else {
            setNotificationsEnabled(false);
            setNotificationError("Notifications are blocked for this site. Allow them in your browser's site settings.");
        }
    };

    // --- SESSION CONTROL ---

    /** Time in. Resumes the paused session when the time-out was automatic and recent. */
    const timeIn = useCallback(
        (source: "manual" | "auto") => {
            const resumable =
                autoPausedAt !== null &&
                getDateKey(new Date(autoPausedAt)) === getDateKey() &&
                Date.now() - autoPausedAt < RESUME_WINDOW_MS;

            if (resumable) {
                // Being away from the screen counts as an eye break; every other timer carries on.
                setTimers((t) => ({ ...t, eye: eyeInterval * 60 }));
                if (focusState === "paused" && source === "auto") setFocusState("running");
            } else {
                setTimers(freshTimers(posture, waterInterval, eyeInterval));
            }
            setAutoPausedAt(null);
            setIsTimedIn(true);
            lastTickRef.current = Date.now();

            if (source === "auto") {
                sendNotification(
                    resumable ? "Welcome back" : "Timed in",
                    resumable ? "Picked up your session where you left it." : "Activity detected. Tracking started.",
                    "success",
                );
            } else if (audioEnabled) {
                playChime();
            }
        },
        [
            audioEnabled,
            autoPausedAt,
            eyeInterval,
            focusState,
            posture,
            sendNotification,
            setAutoPausedAt,
            setFocusState,
            setIsTimedIn,
            setTimers,
            waterInterval,
        ],
    );

    const resetFocus = useCallback(() => {
        setFocusState("idle");
        setIsBreak(false);
        setFocusTimer(FOCUS_DURATION);
    }, [setFocusState, setIsBreak, setFocusTimer]);

    const timeOutManually = () => {
        setIsTimedIn(false);
        setAutoPausedAt(null);
        setAutoTrackingArmed(false);
        resetFocus();
        if (audioEnabled) playChime();
    };

    // Computer-wide activity monitor (desktop app only). Uses the Windows last-input timestamp, so
    // activity in any application counts.
    useEffect(() => {
        if (!autoTrackingEnabled || !systemIdleAvailable || systemIdleSeconds === null) return;

        const limit = autoTrackingMinutes * 60;
        if (systemIdleSeconds >= limit) {
            setAutoTrackingArmed(true);
            if (!isTimedIn) return;

            // Time out at the moment activity stopped: the idle stretch was not screen time, so give it back.
            const idle = systemIdleSeconds;
            const wasFocusing = focusState === "running" && !isBreak;
            setIsTimedIn(false);
            setAutoPausedAt(Date.now() - idle * 1000);
            setTimers((t) => ({
                ...t,
                elapsed: Math.max(0, t.elapsed - idle),
                posture: Math.min(posture === "sitting" ? SITTING_DURATION : STANDING_DURATION, t.posture + idle),
                water: Math.min(waterInterval * 60, t.water + idle),
            }));
            setDailyLogs((logs) => addMinutes(logs, getDateKey(), -idle));
            if (wasFocusing) setDailyFocusLogs((logs) => addMinutes(logs, getDateKey(), -idle));
            if (focusState === "running") {
                setFocusState("paused");
                setFocusTimer((t) => Math.min(isBreak ? BREAK_DURATION : FOCUS_DURATION, t + idle));
            }
            sendNotification("Timed out", `No activity for ${autoTrackingMinutes} minutes. Move the mouse to pick up again.`);
            return;
        }

        // A session begins only after activity follows an armed state, so a manual time-out is not
        // immediately reversed while you are still at the computer.
        if (autoTrackingArmed && systemIdleSeconds <= 60 && !isTimedIn && !lockdownActive) {
            setAutoTrackingArmed(false);
            timeIn("auto");
        }
    }, [
        autoTrackingArmed,
        autoTrackingEnabled,
        autoTrackingMinutes,
        focusState,
        isBreak,
        isTimedIn,
        lockdownActive,
        posture,
        sendNotification,
        setAutoPausedAt,
        setDailyFocusLogs,
        setDailyLogs,
        setFocusState,
        setFocusTimer,
        setIsTimedIn,
        setTimers,
        systemIdleAvailable,
        systemIdleSeconds,
        timeIn,
        waterInterval,
    ]);

    // --- TICK ---
    // One interval; the latest render's closure is read through a ref so the interval never restarts.
    // Elapsed time comes from the wall clock, so throttled background tabs still count correctly.
    const tick = () => {
        const current = new Date();
        const nowMs = current.getTime();
        let seconds = Math.floor((nowMs - lastTickRef.current) / 1000);
        if (seconds < 1) return;
        lastTickRef.current += seconds * 1000;
        if (seconds > MAX_TICK_GAP_SECONDS) {
            lastTickRef.current = nowMs;
            seconds = 0;
        }
        setNow(current);
        const dayKey = getDateKey(current);

        // Daily resets
        if (dayKey !== lastWaterResetDate) {
            setWaterCount(0);
            setLastWaterResetDate(dayKey);
        }
        if (dayKey !== lastMagnesiumResetDate) {
            setMagnesiumTaken(false);
            setLastMagnesiumResetDate(dayKey);
        }

        const locked = isLockoutHour(current.getHours(), lockoutHour) || previewLockout;
        if (locked && isTimedIn) notifyOnce("bedtime", "Bedtime", "Lockout is on. Time out for the night.");

        if (isTimedIn && !locked && seconds > 0) {
            setTimers((t) => ({
                elapsed: t.elapsed + seconds,
                posture: Math.max(0, t.posture - seconds),
                water: Math.max(0, t.water - seconds),
                eye: Math.max(0, t.eye - seconds),
            }));
            setDailyLogs((logs) => addMinutes(logs, dayKey, seconds));
            if (focusState === "running" && !isBreak) {
                setDailyFocusLogs((logs) => addMinutes(logs, dayKey, seconds));
            }

            // Reminders fire once when their countdown reaches zero.
            if (timers.posture > 0 && timers.posture - seconds <= 0) {
                sendNotification("Posture", `Time to ${posture === "sitting" ? "stand up" : "sit down"}.`);
            }
            if (timers.water > 0 && timers.water - seconds <= 0) {
                sendNotification("Water", "Time for a glass of water.");
            }
            if (timers.eye > 0 && timers.eye - seconds <= 0) {
                sendNotification("Eye rest", "Look at something 20 feet away for 20 seconds.");
            }
            if (current.getHours() >= MAGNESIUM_HOUR && !magnesiumTaken) {
                notifyOnce("magnesium", "Magnesium", "Take your magnesium before bed.");
            }
        }

        if (focusState === "running" && seconds > 0) {
            if (focusTimer > 0 && focusTimer - seconds <= 0) {
                setFocusState("completed");
                if (isBreak) sendNotification("Break over", "Back to focus.", "success");
                else sendNotification("Focus done", "Take a 5-minute break.", "chime");
            }
            setFocusTimer((t) => t - seconds);
        } else if (focusState === "completed" && seconds > 0) {
            setFocusTimer((t) => t - seconds);
        }
    };
    const tickRef = useRef(tick);
    tickRef.current = tick;

    useEffect(() => {
        const id = window.setInterval(() => tickRef.current(), 1000);
        return () => window.clearInterval(id);
    }, []);

    // Keep the page behind the lockout from scrolling.
    useEffect(() => {
        document.body.classList.toggle("is-locked", lockdownActive);
        return () => document.body.classList.remove("is-locked");
    }, [lockdownActive]);

    // --- ACTIONS ---
    const togglePosture = () => {
        const next: Posture = posture === "sitting" ? "standing" : "sitting";
        setPosture(next);
        setTimers((t) => ({ ...t, posture: next === "sitting" ? SITTING_DURATION : STANDING_DURATION }));
        if (audioEnabled) playSuccess();
    };

    const restartEye = () => {
        setTimers((t) => ({ ...t, eye: eyeInterval * 60 }));
        if (audioEnabled) playChime();
    };

    const logWater = () => {
        setWaterCount((c) => c + 1);
        setTimers((t) => ({ ...t, water: waterInterval * 60 }));
        if (audioEnabled) playChime();
    };

    const toggleMagnesium = () => {
        setMagnesiumTaken((taken) => {
            if (!taken && audioEnabled) playSuccess();
            return !taken;
        });
    };

    const handleFocusClick = () => {
        if (focusState === "idle") {
            setIsBreak(false);
            setFocusTimer(FOCUS_DURATION);
            setFocusState("running");
        } else if (focusState === "running") {
            setFocusState("paused");
        } else if (focusState === "paused") {
            setFocusState("running");
        } else {
            const nextIsBreak = !isBreak;
            setIsBreak(nextIsBreak);
            setFocusTimer(nextIsBreak ? BREAK_DURATION : FOCUS_DURATION);
            setFocusState("running");
        }
        if (audioEnabled) playChime();
    };

    const changeWaterInterval = (mins: number) => {
        setWaterInterval(mins);
        setTimers((t) => ({ ...t, water: mins * 60 }));
    };

    const changeEyeInterval = (mins: number) => {
        setEyeInterval(mins);
        setTimers((t) => ({ ...t, eye: mins * 60 }));
    };

    const clearAllLogs = () => {
        setDailyLogs({});
        setDailyFocusLogs({});
        setWaterCount(0);
        resetFocus();
    };

    const loadSampleData = () => {
        const sample = [150, 420, 290, 510, 180, 360, 45];
        const sampleFocus = [60, 120, 80, 240, 90, 150, 20];
        const logs: Record<string, number> = {};
        const focusLogs: Record<string, number> = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            logs[getDateKey(d)] = sample[i];
            focusLogs[getDateKey(d)] = sampleFocus[i];
        }
        setDailyLogs(logs);
        setDailyFocusLogs(focusLogs);
    };

    return (
        <div className="relative min-h-dvh w-full">
            {lockdownActive && (
                <LockdownScreen
                    now={now}
                    lockoutHour={lockoutHour}
                    isTimedIn={isTimedIn}
                    audioEnabled={audioEnabled}
                    todayMinutes={dailyLogs[todayKey] || 0}
                    magnesiumDue={!magnesiumTaken}
                    onTimeOut={timeOutManually}
                    onTakeMagnesium={() => setMagnesiumTaken(true)}
                    onExitPreview={previewLockout ? () => setPreviewLockout(false) : undefined}
                />
            )}

            <main
                inert={lockdownActive}
                className="flex min-h-dvh w-full items-start justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4 strip:p-3 tall:items-stretch"
            >
                <h1 className="sr-only">DT Corner</h1>
                <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 wide:h-[min(calc(100dvh-2rem),46rem)] wide:max-w-6xl wide:grid-cols-[1.1fr_1fr_1fr] wide:grid-rows-[minmax(0,1fr)] strip:h-[calc(100dvh-1.5rem)] tall:h-[calc(100dvh-2rem)] tall:max-w-4xl tall:grid-rows-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <ClockCard
                    now={now}
                    lockoutHour={lockoutHour}
                    isTimedIn={isTimedIn}
                    sessionSeconds={timers.elapsed}
                    isAutoPaused={autoPausedAt !== null && !isTimedIn}
                    focusState={focusState}
                    isBreak={isBreak}
                    focusTimer={focusTimer}
                    autoTracking={autoTrackingEnabled ? { available: systemIdleAvailable, minutes: autoTrackingMinutes } : null}
                    onToggleSession={() => (isTimedIn ? timeOutManually() : timeIn("manual"))}
                    onFocusClick={handleFocusClick}
                    onFocusReset={() => {
                        resetFocus();
                        if (audioEnabled) playChime();
                    }}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    className="sm:col-span-2 wide:col-span-1"
                />
                <WeekCard now={now} dailyLogs={dailyLogs} dailyFocusLogs={dailyFocusLogs} />
                <RemindersCard
                    now={now}
                    isTimedIn={isTimedIn}
                    posture={posture}
                    postureSeconds={timers.posture}
                    eyeSeconds={timers.eye}
                    waterSeconds={timers.water}
                    waterCount={waterCount}
                    magnesiumTaken={magnesiumTaken}
                    onTogglePosture={togglePosture}
                    onRestartEye={restartEye}
                    onLogWater={logWater}
                    onToggleMagnesium={toggleMagnesium}
                />
                </div>
            </main>

            <SettingsSheet
                open={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                audioEnabled={audioEnabled}
                onAudioChange={setAudioEnabled}
                notificationsEnabled={notificationsEnabled}
                notificationError={notificationError}
                onNotificationsChange={(on) => (on ? void requestNotificationPermission() : setNotificationsEnabled(false))}
                autoTrackingAvailable={systemIdleAvailable}
                autoTrackingEnabled={autoTrackingEnabled}
                onAutoTrackingChange={(on) => {
                    setAutoTrackingEnabled(on);
                    setAutoTrackingArmed(true);
                }}
                autoTrackingMinutes={autoTrackingMinutes}
                onAutoTrackingMinutesChange={setAutoTrackingMinutes}
                waterInterval={waterInterval}
                onWaterIntervalChange={changeWaterInterval}
                eyeInterval={eyeInterval}
                onEyeIntervalChange={changeEyeInterval}
                lockoutHour={lockoutHour}
                onLockoutHourChange={setLockoutHour}
                onClearLogs={clearAllLogs}
                onLoadSampleData={loadSampleData}
                onPreviewLockout={() => {
                    setIsSettingsOpen(false);
                    setPreviewLockout(true);
                }}
            />
        </div>
    );
}

export default App;
