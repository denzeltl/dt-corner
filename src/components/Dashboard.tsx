import React, { useState } from 'react';
import { 
  Sliders, Bell, Sparkles, Trash2, CheckCircle
} from 'lucide-react';

interface DashboardProps {
  isTimedIn: boolean;
  dailyLogs: Record<string, number>;
  setDailyLogs: (logs: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  
  // Settings & Setters
  sitStandInterval: number;
  setSitStandInterval: (val: number) => void;
  waterInterval: number;
  setWaterInterval: (val: number) => void;
  eyeInterval: number;
  setEyeInterval: (val: number) => void;
  
  notificationsEnabled: boolean;
  requestNotificationPermission: () => void;
  
  // Test Functions
  triggerTestReminder: (type: 'sitStand' | 'water' | 'eye' | 'magnesium') => void;
  triggerTestMidnight: () => void;
  
  // Data actions
  waterCount: number;
  resetWater: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  isTimedIn,
  dailyLogs,
  setDailyLogs,
  sitStandInterval,
  setSitStandInterval,
  waterInterval,
  setWaterInterval,
  eyeInterval,
  setEyeInterval,
  notificationsEnabled,
  requestNotificationPermission,
  triggerTestReminder,
  triggerTestMidnight,
  waterCount,
  resetWater
}) => {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Generate last 7 days list (keys like YYYY-MM-DD, labels like "Sun", "Mon")
  const getPastSevenDays = () => {
    const days = [];
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const date = d.getDate().toString().padStart(2, '0');
      const dateKey = `${year}-${month}-${date}`;
      const dayName = weekdayNames[d.getDay()];
      
      days.push({
        key: dateKey,
        label: i === 0 ? 'Today' : `${dayName} ${d.getDate()}`,
        rawDate: d
      });
    }
    return days;
  };

  const pastDays = getPastSevenDays();
  const chartData = pastDays.map(day => ({
    ...day,
    minutes: dailyLogs[day.key] || 0
  }));

  // Find max value in logs for scale, minimum 120 minutes (2 hrs) to keep structure visible
  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 120);
  
  // Chart dimensions
  const chartWidth = 520;
  const chartHeight = 150;
  const paddingBottom = 25;
  const paddingTop = 15;
  const paddingLeft = 35;
  const paddingRight = 10;
  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  // Render SVG Bars
  const barWidth = 35;
  const barSpacing = (graphWidth - barWidth * chartData.length) / (chartData.length - 1);

  // Helper to format minutes to HR / MIN
  const formatHrsMins = (totalMins: number) => {
    const hrs = Math.floor(totalMins / 60);
    const mins = Math.floor(totalMins % 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  // Helper to get color gradient based on total screen time
  const getBarColorClass = (mins: number) => {
    if (mins >= 480) return 'url(#heavyGrad)'; // 8+ hours -> Heavy
    if (mins >= 240) return 'url(#medGrad)';   // 4-8 hours -> Medium
    return 'url(#lightGrad)';                 // <4 hours -> Healthy
  };

  // Generate Mock Data for 7 days
  const loadMockData = () => {
    const mockLogs: Record<string, number> = {};
    pastDays.forEach((day, index) => {
      // Create some variance: some short days, some heavy screen-time days
      const mockTimes = [150, 420, 290, 510, 180, 360, 45]; // values in minutes
      // Shift based on index so it is somewhat random but static
      mockLogs[day.key] = mockTimes[index % mockTimes.length];
    });
    setDailyLogs(mockLogs);
  };

  // Clear all data
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all screen time and activity logs? This cannot be undone.')) {
      setDailyLogs({});
      resetWater();
      window.localStorage.removeItem('carry_corner_daily_logs');
      window.localStorage.removeItem('carry_corner_water_count');
    }
  };

  return (
    <div className="w-full glass-panel border-t-0 border-x-0 overflow-hidden transition-all duration-300">
      <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Screen Time Charts (7 columns) */}
        <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <span>📈</span> Screen Time History
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Aggregate active monitor duration for the last 7 days
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-cyan-400 opacity-80"></span>
                <span className="text-zinc-400">&lt;4h</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-400 opacity-80"></span>
                <span className="text-zinc-400">4-8h</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 opacity-80"></span>
                <span className="text-zinc-400">8h+</span>
              </span>
            </div>
          </div>

          {/* SVG Custom Chart */}
          <div className="relative w-full h-[160px] flex items-center justify-center mt-2">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-full text-zinc-600"
            >
              <defs>
                <linearGradient id="lightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="medGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="heavyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#be123c" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="gridGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#27272a" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#27272a" stopOpacity="0.6" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = paddingTop + graphHeight * (1 - ratio);
                const hrsVal = Math.round((maxMinutes * ratio) / 60);
                return (
                  <g key={index}>
                    <line 
                      x1={paddingLeft} 
                      y1={y} 
                      x2={chartWidth - paddingRight} 
                      y2={y} 
                      stroke="rgba(63, 63, 70, 0.25)" 
                      strokeDasharray="2 3"
                    />
                    <text 
                      x={paddingLeft - 8} 
                      y={y + 3} 
                      textAnchor="end" 
                      className="fill-zinc-500 font-mono text-[9px] font-medium"
                    >
                      {hrsVal}h
                    </text>
                  </g>
                );
              })}

              {/* Draw Bars */}
              {chartData.map((d, index) => {
                const barHeight = (d.minutes / maxMinutes) * graphHeight;
                const x = paddingLeft + index * (barWidth + barSpacing);
                const y = paddingTop + graphHeight - barHeight;
                const isHovered = hoveredBarIndex === index;

                return (
                  <g 
                    key={d.key} 
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Background hover highlights */}
                    <rect
                      x={x - barSpacing/3}
                      y={paddingTop}
                      width={barWidth + barSpacing * 2/3}
                      height={graphHeight + 5}
                      fill="transparent"
                    />

                    {/* Actual Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 2)} // minimal 2px height
                      rx="4"
                      ry="4"
                      fill={getBarColorClass(d.minutes)}
                      className="transition-all duration-300 hover:brightness-110"
                    />

                    {/* Hover text label above bar */}
                    {isHovered && (
                      <g>
                        <rect
                          x={x + barWidth/2 - 40}
                          y={y - 20}
                          width="80"
                          height="16"
                          rx="3"
                          fill="#18181b"
                          stroke="#3f3f46"
                          strokeWidth="0.5"
                        />
                        <text
                          x={x + barWidth/2}
                          y={y - 9}
                          textAnchor="middle"
                          className="fill-zinc-200 font-mono font-bold text-[8px]"
                        >
                          {formatHrsMins(d.minutes)}
                        </text>
                      </g>
                    )}

                    {/* X-axis date labels */}
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - 8}
                      textAnchor="middle"
                      className={`fill-zinc-500 font-sans text-[9px] font-semibold transition-colors ${
                        isHovered ? 'fill-zinc-100' : ''
                      }`}
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* MIDDLE COLUMN: Timer Controls (3 columns) */}
        <div className="lg:col-span-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-3">
              <Sliders size={13} className="text-zinc-500" /> Reminder Options
            </h2>
            
            <div className="space-y-3.5">
              {/* Sit/Stand Interval */}
              <div>
                <label className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1">
                  <span className="flex items-center gap-1">🪑 Standing Pose Switch</span>
                  <span className="font-mono text-amber-400 text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded">{sitStandInterval}m</span>
                </label>
                <select
                  value={sitStandInterval}
                  onChange={(e) => setSitStandInterval(Number(e.target.value))}
                  className="w-full text-xs bg-zinc-950/80 border border-zinc-800 text-zinc-300 rounded px-2 py-1 outline-none focus:border-zinc-700 transition-colors"
                >
                  <option value="2">2 minutes (Debug/Demo)</option>
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              {/* Water Interval */}
              <div>
                <label className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1">
                  <span className="flex items-center gap-1">💧 Hydration Alarm</span>
                  <span className="font-mono text-cyan-400 text-[10px] bg-cyan-500/10 px-1.5 py-0.5 rounded">{waterInterval}m</span>
                </label>
                <select
                  value={waterInterval}
                  onChange={(e) => setWaterInterval(Number(e.target.value))}
                  className="w-full text-xs bg-zinc-950/80 border border-zinc-800 text-zinc-300 rounded px-2 py-1 outline-none focus:border-zinc-700 transition-colors"
                >
                  <option value="3">3 minutes (Debug/Demo)</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>

              {/* Eye Rest Interval */}
              <div>
                <label className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1">
                  <span className="flex items-center gap-1">👁️ Eye Rest Sweep</span>
                  <span className="font-mono text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">{eyeInterval}m</span>
                </label>
                <select
                  value={eyeInterval}
                  onChange={(e) => setEyeInterval(Number(e.target.value))}
                  className="w-full text-xs bg-zinc-950/80 border border-zinc-800 text-zinc-300 rounded px-2 py-1 outline-none focus:border-zinc-700 transition-colors"
                >
                  <option value="4">4 minutes (Debug/Demo)</option>
                  <option value="10">10 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="40">40 minutes</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between text-[10px] text-zinc-500">
            <span>Water logged today:</span>
            <span className="font-bold text-zinc-300">{waterCount} glasses ({(waterCount * 0.25).toFixed(2)}L)</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Permissions & Tester (2 columns) */}
        <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-2.5">
              <Bell size={13} className="text-zinc-500" /> Notifications
            </h2>
            <button
              onClick={requestNotificationPermission}
              className={`w-full py-1 px-2.5 rounded text-[10px] font-bold tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                notificationsEnabled
                  ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700/50'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
              }`}
            >
              {notificationsEnabled ? (
                <>
                  <CheckCircle size={10} className="text-emerald-400" />
                  <span>DESKTOP ON</span>
                </>
              ) : (
                <>
                  <Bell size={10} />
                  <span>REQUEST PUSH</span>
                </>
              )}
            </button>
          </div>

          <div className="border-t border-zinc-850 pt-2 flex-grow">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-2">
              <Sparkles size={13} className="text-zinc-500" /> Diagnostics
            </h2>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() => triggerTestReminder('eye')}
                disabled={!isTimedIn}
                className="w-full text-left text-[9px] py-1 px-2 rounded bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                🔔 Test Eye Rest Alert
              </button>
              <button
                onClick={() => triggerTestReminder('water')}
                disabled={!isTimedIn}
                className="w-full text-left text-[9px] py-1 px-2 rounded bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                🔔 Test Water Alert
              </button>
              <button
                onClick={() => triggerTestReminder('sitStand')}
                disabled={!isTimedIn}
                className="w-full text-left text-[9px] py-1 px-2 rounded bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                🔔 Test Pose switch
              </button>
              <button
                onClick={() => triggerTestReminder('magnesium')}
                disabled={!isTimedIn}
                className="w-full text-left text-[9px] py-1 px-2 rounded bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                💊 Test Magnesium (11PM)
              </button>
              <button
                onClick={triggerTestMidnight}
                className="w-full text-left text-[9px] py-1 px-2 rounded bg-red-950/30 hover:bg-red-900/20 border border-red-900/30 hover:border-red-800/40 text-red-400 transition-all duration-200 cursor-pointer"
              >
                🚨 Test Midnight Lockout
              </button>
            </div>
          </div>

          <div className="border-t border-zinc-850 pt-2.5 flex items-center justify-between gap-2 text-[10px]">
            <button
              onClick={loadMockData}
              title="Populate past week with random screen time data for demonstration"
              className="text-zinc-500 hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles size={10} />
              <span>Fill Mock</span>
            </button>
            <button
              onClick={clearAllData}
              title="Wipe local storage and data"
              className="text-zinc-500 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={10} />
              <span>Reset All</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
