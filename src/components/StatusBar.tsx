import React from 'react';
import { 
  Play, Droplet, Eye, Pill, ChevronDown, ChevronUp, 
  Activity, Check, Volume2, VolumeX
} from 'lucide-react';

interface StatusBarProps {
  timeString: string;
  dateString: string;
  isTimedIn: boolean;
  sessionSeconds: number;
  handleTimeToggle: () => void;
  isDashboardOpen: boolean;
  toggleDashboard: () => void;
  currentStandingState: 'sitting' | 'standing';
  toggleStandingState: () => void;
  
  // Timers remaining (seconds)
  sitStandTimer: number;
  waterTimer: number;
  eyeTimer: number;
  
  // Alert states
  sitStandAlert: boolean;
  waterAlert: boolean;
  eyeAlert: boolean;
  magnesiumAlert: boolean;
  
  // Interactions
  resetTimer: (type: 'sitStand' | 'water' | 'eye') => void;
  dismissMagnesium: () => void;
  magnesiumTaken: boolean;
  waterCount: number;
  incrementWater: () => void;
  
  // Settings preview
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  timeString,
  dateString,
  isTimedIn,
  sessionSeconds,
  handleTimeToggle,
  isDashboardOpen,
  toggleDashboard,
  currentStandingState,
  toggleStandingState,
  sitStandTimer,
  waterTimer,
  eyeTimer,
  sitStandAlert,
  waterAlert,
  eyeAlert,
  magnesiumAlert,
  resetTimer,
  dismissMagnesium,
  magnesiumTaken,
  waterCount,
  incrementWater,
  audioEnabled,
  setAudioEnabled
}) => {
  // Format seconds to HH:mm:ss
  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Format timer seconds to MM:SS
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="glass-panel sticky top-0 left-0 right-0 h-12 w-full flex items-center justify-between px-4 z-40 shadow-xl border-x-0 border-t-0 select-none">
      {/* LEFT: Active Session Controller */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleTimeToggle}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            isTimedIn 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:bg-emerald-500/20' 
              : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 hover:text-zinc-200 hover:border-zinc-500'
          }`}
        >
          {isTimedIn ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>TIMED IN</span>
              <span className="font-mono text-zinc-300 font-bold ml-1">{formatDuration(sessionSeconds)}</span>
            </>
          ) : (
            <>
              <Play size={10} className="fill-zinc-400" />
              <span>TIME IN</span>
            </>
          )}
        </button>

        {isTimedIn && (
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
            <span>Active monitoring</span>
          </div>
        )}
      </div>

      {/* CENTER: Digital Clock & Date */}
      <div className="flex items-center gap-3">
        <div className="text-zinc-500 text-[11px] font-medium tracking-wide uppercase hidden md:block">
          {dateString}
        </div>
        <div className="h-4 w-px bg-zinc-800 hidden md:block"></div>
        <div className="text-zinc-100 font-mono text-sm font-semibold tracking-wider flex items-center gap-1">
          <span className="text-zinc-400/50">⏰</span>
          <span>{timeString}</span>
        </div>
        <div className="h-4 w-px bg-zinc-800 md:hidden"></div>
        <div className="text-zinc-400 text-xs font-semibold md:hidden">
          {dateString.split(',')[0]}
        </div>
      </div>

      {/* RIGHT: Quick Badges & Controls */}
      <div className="flex items-center gap-2">
        {isTimedIn ? (
          <div className="flex items-center gap-1.5">
            {/* Sitting/Standing Status */}
            <button
              onClick={toggleStandingState}
              title={`Switch pose (currently ${currentStandingState}). Click to toggle.`}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all duration-300 cursor-pointer ${
                sitStandAlert
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 animate-pulse'
                  : 'bg-zinc-900/50 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <Activity size={12} className={sitStandAlert ? 'text-amber-400' : 'text-zinc-400'} />
              <span className="capitalize">{currentStandingState}</span>
              <span className="font-mono text-[10px] opacity-80">{formatTimer(sitStandTimer)}</span>
            </button>

            {/* Eye Rest Status */}
            <button
              onClick={() => resetTimer('eye')}
              title="Rest eyes. Click to reset timer."
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all duration-300 cursor-pointer ${
                eyeAlert
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 animate-pulse'
                  : 'bg-zinc-900/50 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <Eye size={12} className={eyeAlert ? 'text-emerald-400' : 'text-zinc-400'} />
              <span>Eyes</span>
              <span className="font-mono text-[10px] opacity-80">{formatTimer(eyeTimer)}</span>
            </button>

            {/* Water Tracker Status */}
            <div className="flex items-center">
              <button
                onClick={() => resetTimer('water')}
                title="Hydrate. Click to reset water interval."
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-l-full text-[11px] font-medium border border-r-0 transition-all duration-300 cursor-pointer ${
                  waterAlert
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 animate-pulse'
                    : 'bg-zinc-900/50 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <Droplet size={11} className={waterAlert ? 'text-cyan-400 fill-cyan-400/20' : 'text-cyan-500/70'} />
                <span>Water</span>
                <span className="font-mono text-[10px] opacity-80">{formatTimer(waterTimer)}</span>
              </button>
              <button
                onClick={incrementWater}
                title="Log a glass of water today"
                className="bg-cyan-950/40 text-cyan-400 border border-zinc-800 border-l-0 px-2 py-0.5 rounded-r-full text-[10px] font-bold hover:bg-cyan-900/40 transition-colors cursor-pointer"
              >
                {waterCount}L
              </button>
            </div>

            {/* Magnesium Notification Status */}
            {magnesiumAlert && (
              <button
                onClick={dismissMagnesium}
                title="Magnesium reminder active. Click to confirm intake."
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/60 animate-bounce cursor-pointer"
              >
                <Pill size={11} className="text-purple-400" />
                <span>Magnesium</span>
              </button>
            )}

            {magnesiumTaken && (
              <div 
                title="Magnesium taken for today!"
                className="hidden lg:flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-900/40 text-zinc-500 border border-zinc-800"
              >
                <Check size={11} className="text-zinc-600" />
                <span>Magnesium</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-zinc-500 italic font-medium mr-2">
            Timed out (Monitoring disabled)
          </div>
        )}

        <div className="h-4 w-px bg-zinc-800 ml-1"></div>

        {/* Audio Toggle */}
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          title={audioEnabled ? "Mute audio chimes" : "Unmute audio chimes"}
          className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors cursor-pointer"
        >
          {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} className="text-zinc-600" />}
        </button>

        {/* Expand Toggle */}
        <button
          onClick={toggleDashboard}
          title={isDashboardOpen ? "Collapse dashboard" : "Expand dashboard"}
          className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors cursor-pointer"
        >
          {isDashboardOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </header>
  );
};
