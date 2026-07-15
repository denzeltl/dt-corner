import React, { useState, useEffect } from "react";
// import { ShieldAlert, Moon, Unlock, VolumeX, Volume2 } from "lucide-react";
import { playAlarm } from "../utils/audio";

interface LockdownScreenProps {
    timeString: string;
    onBypass: () => void;
    onTimeOutAndSleep: () => void;
    audioEnabled: boolean;
    setAudioEnabled: (val: boolean) => void;
    isTimedIn: boolean;
}

export const LockdownScreen: React.FC<LockdownScreenProps> = ({
    timeString,
    onBypass: _onBypass,
    onTimeOutAndSleep,
    audioEnabled,
    setAudioEnabled: _setAudioEnabled,
    isTimedIn,
}) => {
    // const [bypassInput, setBypassInput] = useState("");
    // const [cooldownRemaining, setCooldownRemaining] = useState(60);
    const [lockedOutForDay, setLockedOutForDay] = useState(!isTimedIn);

    // const targetPhrase = "I understand that staying up late damages my health";
    const showLockedOutState = lockedOutForDay || !isTimedIn;

    // Alarm sound looping when active
    useEffect(() => {
        if (lockedOutForDay || !isTimedIn) return; // Mute alarm if they timed out or are not timed in

        // Play sound every 8 seconds
        const interval = setInterval(() => {
            if (audioEnabled) {
                playAlarm();
            }
        }, 8000);

        // Play once initially
        if (audioEnabled) {
            playAlarm();
        }

        return () => clearInterval(interval);
    }, [audioEnabled, lockedOutForDay, isTimedIn]);

    // Cooldown countdown timer
    // useEffect(() => {
    //     if (cooldownRemaining <= 0) return;
    // 
    //     const timer = setInterval(() => {
    //         setCooldownRemaining((prev) => prev - 1);
    //     }, 1000);
    // 
    //     return () => clearInterval(timer);
    // }, [cooldownRemaining]);
    // 
    // const handleBypassSubmit = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     if (bypassInput.trim() === targetPhrase) {
    //         onBypass();
    //     }
    // };

    const handleCloseSession = () => {
        onTimeOutAndSleep();
        setLockedOutForDay(true);
    };

    useEffect(() => {
        setLockedOutForDay(!isTimedIn);
    }, [isTimedIn]);

    return (
        <div className="fixed inset-0 z-[9999] bg-[#030303] text-zinc-100 flex flex-col items-center justify-center p-6 overflow-hidden select-none">
            {/* Main Lock Box */}
            <div className="max-w-md w-full glass-panel border-zinc-800/80 rounded-2xl p-8 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10 transition-all duration-500">
                {/* Header and warnings */}
                <div className="text-center">
                    <h1 className="text-lg font-extrabold uppercase tracking-widest text-zinc-100 flex items-center justify-center gap-2">
                        {showLockedOutState ? "Goodnight!" : "Bedtime Lockout"}
                    </h1>
                    <p className="text-zinc-500 font-mono font-semibold mt-1">
                        Current Time: <span className="text-rose-400 font-bold text-xl">{timeString}</span>
                    </p>
                </div>

                {showLockedOutState ? (
                    // Sleep locked state
                    <div className="text-center space-y-4 w-full">
                        <p className="text-sm text-zinc-400 leading-relaxed px-4">
                            Session closed. Excellent self-discipline! The computer is timed out for the night. Sleep
                            well and recover.
                        </p>
                    </div>
                ) : (
                    // Active enforcement warning
                    <div className="text-center space-y-4 w-full">
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            It is past 12:00 Midnight. Finish what you are doing then step away and rest your eyes.
                        </p>

                        <button
                            onClick={handleCloseSession}
                            className="w-full py-2.5 px-4 my-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-xs font-bold tracking-wider shadow-lg shadow-rose-950/40 hover:shadow-rose-900/40 transition-all duration-300 cursor-pointer"
                        >
                            Time Out for the Night
                        </button>

                        {/* <div className="flex items-center gap-3 my-4">
                            <div className="h-px flex-grow bg-zinc-800"></div>
                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                Emergency Bypass
                            </span>
                            <div className="h-px flex-grow bg-zinc-800"></div>
                        </div> */}

                        {/* Bypass Input Test */}
                        {/* <form onSubmit={handleBypassSubmit} className="space-y-3 w-full">
                            <div className="text-left">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                                    Type this sentence to unlock:
                                </label>
                                <div className="text-[10px] text-zinc-400 font-mono italic select-text bg-zinc-950 px-2 py-1.5 rounded border border-zinc-900 mt-1">
                                    {targetPhrase}
                                </div>
                            </div>

                            <input
                                type="text"
                                value={bypassInput}
                                onChange={(e) => setBypassInput(e.target.value)}
                                placeholder="Type the exact sentence..."
                                className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 transition-colors"
                            />

                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={bypassInput.trim() !== targetPhrase}
                                    className="flex-grow py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:text-zinc-600 border border-zinc-800 disabled:border-zinc-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <Unlock size={12} />
                                    <span>Unlock (15m)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAudioEnabled(!audioEnabled)}
                                    title={audioEnabled ? "Mute alert chime" : "Unmute alert chime"}
                                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                >
                                    {audioEnabled ? (
                                        <Volume2 size={14} />
                                    ) : (
                                        <VolumeX size={14} className="text-zinc-700" />
                                    )}
                                </button>
                            </div>
                        </form>

                        {cooldownRemaining > 0 ? (
                            <p className="text-[9px] text-zinc-600 font-mono pt-1">
                                Lock countdown active: {cooldownRemaining}s
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={onBypass}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-semibold transition-colors cursor-pointer"
                            >
                                Skip writing and bypass for 15 minutes
                            </button>
                        )} */}
                    </div>
                )}
            </div>
        </div>
    );
};
