import { useState, useEffect, useRef } from "react";
import { LockdownScreen } from "./components/LockdownScreen";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { playChime, playSuccess } from "./utils/audio";
import { Play, Pause, RotateCcw } from "lucide-react";

// Pose durations (seconds)
const SITTING_DURATION = 25 * 60; // 25 minutes
const STANDING_DURATION = 15 * 60; // 15 minutes
// Pomodoro focus and break durations
const FOCUS_DURATION = 25 * 60; // 25 minutes focus
const BREAK_DURATION = 5 * 60; // 5 minutes break

// Helper to get today's key string YYYY-MM-DD in local time
const getTodayKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const date = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${date}`;
};

function App() {
    // --- CLOCK STATES ---
    const [time, setTime] = useState(new Date());

    // --- PERSISTED APP STATES ---
    const [isTimedIn, setIsTimedIn] = useLocalStorage<boolean>("dt_corner_is_timed_in", false);
    const [dailyLogs, setDailyLogs] = useLocalStorage<Record<string, number>>("dt_corner_daily_logs", {});
    const [dailyFocusLogs, setDailyFocusLogs] = useLocalStorage<Record<string, number>>("dt_corner_focus_logs", {});
    const [waterCount, setWaterCount] = useLocalStorage<number>("dt_corner_water_count", 0);
    const [lastWaterResetDate, setLastWaterResetDate] = useLocalStorage<string>(
        "dt_corner_last_water_reset",
        getTodayKey(),
    );
    const [magnesiumTaken, setMagnesiumTaken] = useLocalStorage<boolean>("dt_corner_magnesium_taken", false);
    const [lastMagnesiumResetDate, setLastMagnesiumResetDate] = useLocalStorage<string>(
        "dt_corner_last_magnesium_reset",
        getTodayKey(),
    );

    // --- REMINDER CONFIGURATION ---
    const [waterInterval] = useLocalStorage<number>("dt_corner_water_interval", 45);
    const [eyeInterval] = useLocalStorage<number>("dt_corner_eye_interval", 20);
    const [audioEnabled, setAudioEnabled] = useLocalStorage<boolean>("dt_corner_audio_enabled", true);
    const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage<boolean>(
        "dt_corner_notifications_enabled",
        false,
    );

    // --- RUNTIME STATES ---
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [currentStandingState, setCurrentStandingState] = useState<"sitting" | "standing">("sitting");
    // Pomodoro focus timer states
    const [focusState, setFocusState] = useLocalStorage<"idle" | "running" | "paused" | "completed">(
        "dt_corner_focus_state",
        "idle",
    );
    const [isBreak, setIsBreak] = useLocalStorage<boolean>("dt_corner_is_break", false);
    const [focusTimer, setFocusTimer] = useLocalStorage<number>("dt_corner_focus_timer", FOCUS_DURATION);

    // Remaining seconds for timers
    // Sit/stand timer starts at sitting duration
    const [sitStandTimer, setSitStandTimer] = useState(SITTING_DURATION);
    const [waterTimer, setWaterTimer] = useState(waterInterval * 60);
    const [eyeTimer, setEyeTimer] = useState(eyeInterval * 60);

    // Active alerts (glowing/notified)
    const [sitStandAlert, setSitStandAlert] = useState(false);
    const [waterAlert, setWaterAlert] = useState(false);
    const [eyeAlert, setEyeAlert] = useState(false);
    const [magnesiumAlert, setMagnesiumAlert] = useState(false);

    // Avoid duplicate push notifications for same event
    const notifiedEvents = useRef<Record<string, boolean>>({});

    // --- LOCKDOWN STATES ---
    const [lockdownActive, setLockdownActive] = useState(false);
    const [lockdownBypassUntil, setLockdownBypassUntil] = useState<number | null>(null);
    const [testLockdownActive, setTestLockdownActive] = useState(false);

    // Update Clock every second
    useEffect(() => {
        const clockTimer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(clockTimer);
    }, []);

    // Sync Timer limits when water/eye intervals change

    useEffect(() => {
        setWaterTimer(waterInterval * 60);
        setWaterAlert(false);
    }, [waterInterval]);

    useEffect(() => {
        setEyeTimer(eyeInterval * 60);
        setEyeAlert(false);
    }, [eyeInterval]);

    // Helper to trigger standard notification (push + audio)
    const sendNotification = (title: string, body: string, soundType: "chime" | "success" = "chime") => {
        if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
            try {
                new Notification(title, { body });
            } catch (err) {
                console.warn("Notification failed:", err);
            }
        }
        if (audioEnabled) {
            if (soundType === "chime") playChime();
            else if (soundType === "success") playSuccess();
        }
    };

    // Request browser Notification Permission
    const requestNotificationPermission = () => {
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notifications.");
            return;
        }
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                setNotificationsEnabled(true);
                sendNotification("Notifications Enabled", "You will receive reminders from Screen Time Hub!");
                if (audioEnabled) playSuccess();
            } else {
                setNotificationsEnabled(false);
            }
        });
    };

    // Main Core Tick Loop (runs every second)
    useEffect(() => {
        const tick = setInterval(() => {
            const now = new Date();
            const currentHrs = now.getHours();
            const todayKey = getTodayKey();

            // 1. Check Date Transitions (Reset daily records)
            // Reset daily focus logs if date changed
            if (todayKey !== lastWaterResetDate) {
                // water reset handled elsewhere
            }
            if (todayKey !== lastMagnesiumResetDate) {
                // magnesium reset handled elsewhere
            }
            // Reset focus logs on new day
            if (todayKey !== getTodayKey()) {
                setDailyFocusLogs((prev) => {
                    const newLogs = { ...prev };
                    // optional cleanup, keep as is
                    return newLogs;
                });
            }

            // 2. Bedtime Lockout evaluation
            if (todayKey !== lastWaterResetDate) {
                setWaterCount(0);
                setLastWaterResetDate(todayKey);
            }
            if (todayKey !== lastMagnesiumResetDate) {
                setMagnesiumTaken(false);
                setLastMagnesiumResetDate(todayKey);
                setMagnesiumAlert(false);
                notifiedEvents.current["magnesium"] = false;
            }

            // 2. Bedtime Lockout evaluation
            const isMidnightTime = currentHrs === 0;
            const isCircadianLockout = isMidnightTime || (currentHrs >= 1 && currentHrs < 5);

            // Reset test lockdown after normal lockout period ends
            if (!isCircadianLockout && testLockdownActive) {
                setTestLockdownActive(false);
            }

            const isBypassed = lockdownBypassUntil !== null && Date.now() < lockdownBypassUntil;

            const shouldLock = (isCircadianLockout || testLockdownActive) && !isBypassed;
            setLockdownActive(shouldLock);

            if (shouldLock && isTimedIn) {
                if (!notifiedEvents.current["bedtime"]) {
                    notifiedEvents.current["bedtime"] = true;
                    sendNotification("Bedtime", "Lockout active, time out for the day.", "chime");
                }
            } else {
                notifiedEvents.current["bedtime"] = false;
            }

            // 3. Screen Time accumulation & reminders (if Timed In)
            if (isTimedIn && !lockdownActive) {
                setSessionSeconds((prev) => prev + 1);

                setDailyLogs((prev) => {
                    const currentMinsLogged = prev[todayKey] || 0;
                    return {
                        ...prev,
                        [todayKey]: +(currentMinsLogged + 1 / 60).toFixed(4),
                    };
                });
                // Increment focus logs when focus timer is active/completed and in focus mode (not on break)
                const isFocusing = (focusState === "running" || focusState === "completed") && !isBreak;
                if (isFocusing) {
                    setDailyFocusLogs((prev) => {
                        const currentMins = prev[todayKey] || 0;
                        return {
                            ...prev,
                            [todayKey]: +(currentMins + 1 / 60).toFixed(4),
                        };
                    });
                }

                // A. Sit / Stand Timer
                setSitStandTimer((prev) => {
                    if (prev <= 1) {
                        if (!sitStandAlert) {
                            setSitStandAlert(true);
                            const targetPose = currentStandingState === "sitting" ? "standing" : "sitting";
                            sendNotification("Posture Change", `Time to switch to ${targetPose}!`);
                        }
                        return 0;
                    }
                    return prev - 1;
                });

                // B. Water Timer
                setWaterTimer((prev) => {
                    if (prev <= 1) {
                        if (!waterAlert) {
                            setWaterAlert(true);
                            sendNotification("Hydration", "Time to take a sip of water.");
                        }
                        return 0;
                    }
                    return prev - 1;
                });

                // C. Eye Rest Timer
                setEyeTimer((prev) => {
                    if (prev <= 1) {
                        if (!eyeAlert) {
                            setEyeAlert(true);
                            sendNotification("Eye Rest", "Look 20 feet away for 20 seconds!");
                        }
                        return 0;
                    }
                    return prev - 1;
                });

                // D. Magnesium Reminder (at 11:00 PM)
                const isElevenPM = currentHrs === 23;
                if (isElevenPM && !magnesiumTaken) {
                    setMagnesiumAlert(true);
                    if (!notifiedEvents.current["magnesium"]) {
                        sendNotification("Magnesium", "Don't forget to take your Magnesium supplement!");
                        notifiedEvents.current["magnesium"] = true;
                    }
                } else {
                    setMagnesiumAlert(false);
                }
            }
            // Focus Pomodoro Timer handling
            if (focusState === "running") {
                setFocusTimer((prev) => {
                    if (prev <= 1) {
                        // Timer finished
                        setFocusState("completed");
                        if (isBreak) {
                            sendNotification("Break Over", "Back to focus!", "success");
                        } else {
                            sendNotification("Focus Complete", "Time for a short break.", "chime");
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            } else if (focusState === "completed") {
                setFocusTimer((prev) => prev - 1);
            }
        }, 1000);

        return () => clearInterval(tick);
    }, [
        isTimedIn,
        lockdownActive,
        lockdownBypassUntil,
        testLockdownActive,
        currentStandingState,
        sitStandAlert,
        waterAlert,
        eyeAlert,
        magnesiumTaken,
        lastWaterResetDate,
        lastMagnesiumResetDate,
        focusState,
        isBreak,
        FOCUS_DURATION,
        BREAK_DURATION,
    ]);

    // --- ACTIONS ---

    const handleTimeToggle = () => {
        const nextState = !isTimedIn;
        setIsTimedIn(nextState);
        if (audioEnabled) playChime();
        if (nextState) {
            setSessionSeconds(0);
            setSitStandTimer(currentStandingState === "sitting" ? SITTING_DURATION : STANDING_DURATION);
            setWaterTimer(waterInterval * 60);
            setEyeTimer(eyeInterval * 60);
            setSitStandAlert(false);
            setWaterAlert(false);
            setEyeAlert(false);
            // sendNotification("Session Started", "Screen time monitoring is now active.", "success");
        } else {
            handleFocusReset();
            // sendNotification("Session Ended", "Screen time monitoring is deactivated.", "success");
        }
    };

    const toggleStandingState = () => {
        const nextPose = currentStandingState === "sitting" ? "standing" : "sitting";
        setCurrentStandingState(nextPose);
        // Duration alternates: 25 min sitting, 15 min standing
        setSitStandTimer(nextPose === "sitting" ? SITTING_DURATION : STANDING_DURATION);
        setSitStandAlert(false);
        sendNotification(
            "Posture Change",
            `${nextPose === "standing" ? "🧍 Stand up" : "🪑 Sit down"} — ${nextPose === "standing" ? "15 min standing" : "25 min sitting"} starts now.`,
            "success",
        );
    };

    const resetTimer = (type: "sitStand" | "water" | "eye") => {
        if (type === "sitStand") {
            // Reset to the current pose's allotted duration
            setSitStandTimer(currentStandingState === "sitting" ? SITTING_DURATION : STANDING_DURATION);
            setSitStandAlert(false);
        } else if (type === "water") {
            setWaterTimer(waterInterval * 60);
            setWaterAlert(false);
        } else if (type === "eye") {
            setEyeTimer(eyeInterval * 60);
            setEyeAlert(false);
        }
        if (audioEnabled) playChime();
    };

    const incrementWater = () => {
        setWaterCount((prev) => prev + 1);
        resetTimer("water");
    };

    const dismissMagnesium = () => {
        setMagnesiumTaken(true);
        setMagnesiumAlert(false);
        sendNotification("Magnesium Taken", "Logged supplement intake for today.", "success");
    };

    const triggerBypass = () => {
        setLockdownBypassUntil(Date.now() + 15 * 60 * 1000);
        setTestLockdownActive(false);
        setLockdownActive(false);
        sendNotification("Lockout Bypassed", "You have 15 minutes of emergency grace time.", "success");
    };

    const handleTimeOutAndSleep = () => {
        setIsTimedIn(false);
    };

    const handleFocusClick = () => {
        if (focusState === "idle") {
            setFocusState("running");
            setIsBreak(false);
            setFocusTimer(FOCUS_DURATION);
        } else if (focusState === "running") {
            setFocusState("paused");
        } else if (focusState === "paused") {
            setFocusState("running");
        } else if (focusState === "completed") {
            if (!isBreak) {
                // Focus completed, start break
                setIsBreak(true);
                setFocusState("running");
                setFocusTimer(BREAK_DURATION);
            } else {
                // Break completed, start focus
                setIsBreak(false);
                setFocusState("running");
                setFocusTimer(FOCUS_DURATION);
            }
        }
        if (audioEnabled) playChime();
    };

    const handleFocusReset = () => {
        setFocusState("idle");
        setIsBreak(false);
        setFocusTimer(FOCUS_DURATION);
        if (audioEnabled) playChime();
    };

    // --- TIME STRINGS ---
    const timeString = time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
    const timeParts = timeString.split(" ");
    const clockTime = timeParts[0] ?? timeString;
    const meridiem = timeParts[1] ?? "";
    const dateString = time.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    // --- TIMER FORMATTING HELPERS ---
    const formatTimer = (totalSecs: number) => {
        const isNegative = totalSecs < 0;
        const absSecs = Math.abs(totalSecs);
        const mins = Math.floor(absSecs / 60);
        const secs = absSecs % 60;
        return `${isNegative ? "-" : ""}${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getPastSevenDays = () => {
        const days = [];
        const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);

            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, "0");
            const date = d.getDate().toString().padStart(2, "0");
            const dateKey = `${year}-${month}-${date}`;
            const dayName = weekdayNames[d.getDay()];

            days.push({
                key: dateKey,
                label: `${dayName}`,
                rawDate: d,
            });
        }
        return days;
    };

    const pastDays = getPastSevenDays();
    const chartData = pastDays.map((day) => ({
        ...day,
        minutes: dailyLogs[day.key] || 0,
        focusMinutes: dailyFocusLogs[day.key] || 0,
    }));

    const maxMinutes = Math.max(...chartData.map((d) => Math.max(d.minutes, d.focusMinutes)), 120);

    const formatHrsMins = (totalMins: number) => {
        const hrs = Math.floor(totalMins / 60);
        const mins = Math.floor(totalMins % 60);
        if (hrs === 0) return `${mins}m`;
        return `${hrs}h ${mins}m`;
    };

    return (
        <div className="relative min-h-screen bg-[#070709] w-full flex flex-col font-sans select-none overflow-x-hidden">
            {/* Bedtime Lockdown Enforcer Overlay */}
            {lockdownActive && (
                <LockdownScreen
                    timeString={timeString}
                    onBypass={triggerBypass}
                    onTimeOutAndSleep={handleTimeOutAndSleep}
                    audioEnabled={audioEnabled}
                    setAudioEnabled={setAudioEnabled}
                    isTimedIn={isTimedIn}
                />
            )}

            {/* Main Layout — responsive grid, full viewport height on desktop */}
            <main className="flex-grow flex flex-col min-h-screen md:h-screen md:overflow-hidden p-3 relative w-full select-none justify-center">
                {/* Glow backdrop decorative */}
                <div className="absolute w-[300px] h-[300px] bg-cyan-950/5 rounded-full blur-[100px] top-1/4 left-1/3 pointer-events-none"></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-5xl mx-auto items-stretch md:h-full">
                    {/* Column 1: Clock */}
                    <div className="glass-panel-light rounded-xl p-3 flex flex-col justify-between relative overflow-hidden min-h-[220px] md:h-full">
                        {/* Top: Clock & Session toggle */}
                        <div className="flex justify-between flex-col my-2 gap-10">
                            <div>
                                <div className="flex items-end gap-2 font-mono leading-none">
                                    <div className="text-5xl font-medium text-zinc-100">{clockTime}</div>
                                    {meridiem ? (
                                        <div className="text-2xl font-medium uppercase tracking-[0.2em] text-zinc-100">
                                            {meridiem}
                                        </div>
                                    ) : null}
                                </div>
                                <div className="text-xl text-zinc-300 font-medium uppercase tracking-wide mt-1">
                                    {dateString}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 w-full">
                                {/* Session toggle */}
                                <button
                                    onClick={handleTimeToggle}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer border h-12 ${isTimedIn
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:bg-emerald-500/20"
                                            : "bg-zinc-950/65 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {isTimedIn ? (
                                            <div className="w-4 flex items-center justify-center">
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                                </span>
                                            </div>
                                        ) : (
                                            <Play size={12} className="w-4 fill-zinc-400 stroke-zinc-400" />
                                        )}
                                        <span>{isTimedIn ? "Timed In" : "Time In"}</span>
                                    </div>
                                    {isTimedIn && (
                                        <span className="font-mono text-zinc-300 font-bold bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                                            {String(Math.floor(sessionSeconds / 3600)).padStart(2, "0")}:
                                            {String(Math.floor((sessionSeconds % 3600) / 60)).padStart(2, "0")}:
                                            {String(sessionSeconds % 60).padStart(2, "0")}
                                        </span>
                                    )}
                                </button>

                                {/* Focus Pomodoro Button Container */}
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={handleFocusClick}
                                        disabled={!isTimedIn}
                                        className={`flex-grow flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border h-12 ${!isTimedIn
                                                ? "bg-zinc-900/40 text-zinc-400 border-zinc-800/70 cursor-not-allowed opacity-70"
                                                : focusState === "running"
                                                    ? "cursor-pointer bg-indigo-500/10 text-indigo-400 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:bg-indigo-500/20"
                                                    : focusState === "paused"
                                                        ? "cursor-pointer bg-amber-500/10 text-amber-400 border-amber-500/40 hover:bg-amber-500/20"
                                                        : focusState === "completed"
                                                            ? "cursor-pointer bg-rose-500/10 text-rose-400 border-rose-500/40 animate-pulse hover:bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                                                            : "cursor-pointer bg-zinc-950/65 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {focusState === "running" ? (
                                                <Pause size={12} className="w-4 fill-indigo-400 stroke-indigo-400" />
                                            ) : focusState === "paused" ? (
                                                <Play
                                                    size={12}
                                                    className="w-4 fill-amber-400 stroke-amber-400 animate-pulse"
                                                />
                                            ) : focusState === "completed" ? (
                                                <Play
                                                    size={12}
                                                    className="w-4 fill-rose-400 stroke-rose-400 animate-pulse"
                                                />
                                            ) : (
                                                <span className="text-xs w-4">🎯</span>
                                            )}
                                            <span>
                                                {focusState === "idle"
                                                    ? "Start Focus"
                                                    : focusState === "running"
                                                        ? isBreak
                                                            ? "Break Active"
                                                            : "Focusing"
                                                        : focusState === "paused"
                                                            ? "Paused"
                                                            : isBreak
                                                                ? "Take Focus"
                                                                : "Take Break"}
                                            </span>
                                        </div>
                                        {focusState !== "idle" && (
                                            <span className="font-mono text-zinc-300 font-bold bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                                                {formatTimer(focusTimer)}
                                            </span>
                                        )}
                                    </button>

                                    {/* Reset Button when timer is active */}
                                    {focusState !== "idle" && (
                                        <button
                                            onClick={handleFocusReset}
                                            disabled={!isTimedIn}
                                            title="Reset Focus Timer"
                                            className={`px-3 py-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center h-12 ${!isTimedIn
                                                    ? "border-zinc-800/60 bg-zinc-950/40 text-zinc-700 cursor-not-allowed opacity-50"
                                                    : "cursor-pointer border-zinc-800 bg-zinc-950/65 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/5"
                                                }`}
                                        >
                                            <RotateCcw size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Stats & Chart */}
                    <div className="glass-panel-light rounded-xl p-3 flex flex-col justify-between relative overflow-hidden min-h-[300px] md:h-full">
                        {/* Mid: Today's screen time */}
                        <div>
                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                                Today's Screen Time
                            </div>
                            <div className="text-2xl font-black text-cyan-400 font-mono mt-1 animate-pulse-slow">
                                {(() => {
                                    const minutes = dailyLogs[getTodayKey()] || 0;
                                    const totalSeconds = Math.round(minutes * 60);
                                    const hrs = Math.floor(totalSeconds / 3600);
                                    const mins = Math.floor((totalSeconds % 3600) / 60);
                                    const secs = totalSeconds % 60;
                                    return hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : `${mins}m ${secs}s`;
                                })()}
                            </div>
                        </div>

                        {/* Bottom: 7-day chart */}
                        <div className="flex-grow flex flex-col mt-6 min-h-[220px]">
                            <div className="flex items-center justify-between text-[0.8rem] text-zinc-500 font-medium mb-2">
                                <span>7-Day History</span>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block w-2 h-2 rounded-sm bg-cyan-400 opacity-80"></span>
                                        <span className="text-[0.65rem] text-zinc-500 font-bold uppercase tracking-wider">
                                            Screen
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block w-2 h-2 rounded-sm bg-indigo-400"></span>
                                        <span className="text-[0.65rem] text-zinc-500 font-bold uppercase tracking-wider">
                                            Focus
                                        </span>
                                    </span>
                                </div>
                            </div>
                            <div className="flex-grow w-full relative">
                                <svg viewBox="0 0 200 100" className="w-full h-full text-zinc-600">
                                    <defs>
                                        <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
                                        </linearGradient>
                                        <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
                                        </linearGradient>
                                        <filter id="focusGlow">
                                            <feGaussianBlur stdDeviation="1.5" result="blur" />
                                            <feMerge>
                                                <feMergeNode in="blur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>
                                    {chartData.map((d, index) => {
                                        const groupWidth = 24;
                                        const spacing = (180 - groupWidth * 7) / 6;
                                        const groupX = 10 + index * (groupWidth + spacing);
                                        const halfW = groupWidth / 2 - 1;
                                        const barHeight = maxMinutes > 0 ? (d.minutes / maxMinutes) * 78 : 2;
                                        const focusBarHeight = maxMinutes > 0 ? (d.focusMinutes / maxMinutes) * 78 : 0;
                                        const screenY = 82 - barHeight;
                                        const focusY = 82 - focusBarHeight;
                                        const isToday = index === 6;

                                        return (
                                            <g key={d.key}>
                                                {/* Screen time bar */}
                                                <rect
                                                    x={groupX}
                                                    y={screenY}
                                                    width={halfW}
                                                    height={Math.max(barHeight, 2)}
                                                    rx="1.5"
                                                    ry="1.5"
                                                    fill={isToday ? "url(#screenGrad)" : "rgba(34,211,238,0.35)"}
                                                    stroke={isToday ? "rgba(34,211,238,0.5)" : "rgba(34,211,238,0.3)"}
                                                    strokeWidth="0.4"
                                                    className="transition-all duration-300 hover:brightness-125"
                                                >
                                                    <title>{`${d.label}: ${formatHrsMins(d.minutes)} screen`}</title>
                                                </rect>
                                                {/* Focus time bar */}
                                                {focusBarHeight > 0 && (
                                                    <rect
                                                        x={groupX + halfW + 2}
                                                        y={focusY}
                                                        width={halfW}
                                                        height={Math.max(focusBarHeight, 2)}
                                                        rx="1.5"
                                                        ry="1.5"
                                                        fill={isToday ? "url(#focusGrad)" : "rgba(99,102,241,0.35)"}
                                                        stroke={
                                                            isToday ? "rgba(167,139,250,0.5)" : "rgba(99,102,241,0.3)"
                                                        }
                                                        strokeWidth="0.4"
                                                        filter={isToday ? "url(#focusGlow)" : undefined}
                                                        className="transition-all duration-300 hover:brightness-125"
                                                    >
                                                        <title>{`${d.label}: ${formatHrsMins(d.focusMinutes)} focus`}</title>
                                                    </rect>
                                                )}
                                                {/* Empty focus bar placeholder so days without focus show a ghost */}
                                                {focusBarHeight === 0 && (
                                                    <rect
                                                        x={groupX + halfW + 2}
                                                        y={80}
                                                        width={halfW}
                                                        height={2}
                                                        rx="1"
                                                        ry="1"
                                                        fill="rgba(99,102,241,0.12)"
                                                    />
                                                )}
                                                <text
                                                    x={groupX + groupWidth / 2}
                                                    y={92}
                                                    textAnchor="middle"
                                                    className={`font-sans text-[0.5rem] font-bold ${isToday ? "fill-cyan-400" : "fill-zinc-500"}`}
                                                >
                                                    {d.label.substring(0, 1)}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Health Timers */}
                    <div className="glass-panel-light rounded-xl p-3 flex flex-col justify-between min-h-[300px] md:h-full">
                        <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Reminders</div>

                        <div className="space-y-1.5 flex-grow flex flex-col justify-start mt-4">
                            {/* Pose Switch Card */}
                            <button
                                onClick={toggleStandingState}
                                className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all duration-300 cursor-pointer ${sitStandAlert
                                        ? "bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse"
                                        : "bg-zinc-950/65 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm w-4 text-center">
                                        {currentStandingState === "sitting" ? "🪑" : "🧍"}
                                    </span>
                                    <div>
                                        <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider leading-none">
                                            Posture change
                                        </div>
                                        <div className="text-xs font-bold mt-0.5 capitalize">
                                            {currentStandingState}
                                        </div>
                                    </div>
                                </div>
                                <div className="font-mono text-xs font-bold bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                                    {formatTimer(sitStandTimer)}
                                </div>
                            </button>

                            {/* Eye Rest Card */}
                            <button
                                onClick={() => resetTimer("eye")}
                                className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all duration-300 cursor-pointer ${eyeAlert
                                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-pulse"
                                        : "bg-zinc-950/65 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs w-4 text-center">👁️</span>
                                    <div>
                                        <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider leading-none">
                                            Eye Rest
                                        </div>
                                        <div className="text-xs font-bold mt-0.5">20-20-20 break</div>
                                    </div>
                                </div>
                                <div className="font-mono text-xs font-bold bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                                    {formatTimer(eyeTimer)}
                                </div>
                            </button>

                            {/* Hydration Tracker Card */}
                            <button
                                onClick={incrementWater}
                                className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all duration-300 cursor-pointer ${waterAlert
                                        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)] animate-pulse"
                                        : "bg-zinc-950/65 border-zinc-800 text-zinc-300"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm w-4 text-center">💧</span>
                                    <div>
                                        <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider leading-none">
                                            Hydration
                                        </div>
                                        <div className="text-xs font-bold mt-0.5">Drink water ({waterCount})</div>
                                    </div>
                                </div>
                                <div className="font-mono text-xs font-bold bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                                    {formatTimer(waterTimer)}
                                </div>
                            </button>

                            {/* Magnesium reminder (conditional) */}
                            {magnesiumAlert ? (
                                <button
                                    onClick={dismissMagnesium}
                                    className="w-full flex items-center justify-between p-2 rounded-lg border bg-purple-500/10 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)] animate-bounce cursor-pointer transition-all"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs w-4 text-center">💊</span>
                                        <div>
                                            <div className="text-xs text-purple-400 font-bold uppercase tracking-wider leading-none">
                                                Magnesium
                                            </div>
                                            <div className="text-xs font-bold mt-0.5">Tap to confirm</div>
                                        </div>
                                    </div>
                                </button>
                            ) : (
                                <div
                                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all duration-300 cursor-not-allowed ${magnesiumTaken
                                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                                            : "bg-zinc-900/40 border-zinc-800/70 text-zinc-400 opacity-80"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 flex-grow text-left outline-none">
                                        <span className="text-xs w-4 text-center opacity-70">💊</span>
                                        <div>
                                            <div
                                                className={`text-xs font-bold uppercase tracking-wider leading-none ${magnesiumTaken ? "text-emerald-400" : "text-zinc-500"
                                                    }`}
                                            >
                                                Magnesium
                                            </div>
                                            <div className="text-xs font-bold mt-0.5">
                                                {magnesiumTaken ? "Taken" : "Take at"}
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${magnesiumTaken
                                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                                                : "bg-zinc-950/70 border-zinc-800/80 text-zinc-500"
                                            }`}
                                    >
                                        {magnesiumTaken ? "--" : "11pm"}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom util strip */}
                        <div className="mt-2 pt-1.5 border-t border-zinc-800/40 flex items-center justify-between">
                            <button
                                onClick={requestNotificationPermission}
                                className={`text-[8px] font-bold transition-colors cursor-pointer ${notificationsEnabled ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"}`}
                            >
                                {notificationsEnabled ? "🔔 Alerts On" : "🔕 Alerts Off"}
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const mockLogs: Record<string, number> = {};
                                        const mockFocusLogs: Record<string, number> = {};
                                        pastDays.forEach((day, index) => {
                                            const mockTimes = [150, 420, 290, 510, 180, 360, 45];
                                            const mockFocusTimes = [60, 120, 80, 240, 90, 150, 20];
                                            mockLogs[day.key] = mockTimes[index % mockTimes.length];
                                            mockFocusLogs[day.key] = mockFocusTimes[index % mockFocusTimes.length];
                                        });
                                        setDailyLogs(mockLogs);
                                        setDailyFocusLogs(mockFocusLogs);
                                    }}
                                    className="text-[8px] text-zinc-500 hover:text-cyan-400 transition-colors cursor-pointer font-bold"
                                >
                                    ✨ Mock
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm("Clear all logs?")) {
                                            setDailyLogs({});
                                            setDailyFocusLogs({});
                                            setWaterCount(0);
                                            setFocusState("idle");
                                            setIsBreak(false);
                                            setFocusTimer(FOCUS_DURATION);
                                            window.localStorage.removeItem("dt_corner_daily_logs");
                                            window.localStorage.removeItem("dt_corner_focus_logs");
                                            window.localStorage.removeItem("dt_corner_water_count");
                                        }
                                    }}
                                    className="text-[8px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer font-bold"
                                >
                                    🗑️ Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
