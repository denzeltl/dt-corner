// Pose durations (seconds)
export const SITTING_DURATION = 25 * 60;
export const STANDING_DURATION = 15 * 60;
// Pomodoro focus and break durations
export const FOCUS_DURATION = 25 * 60;
export const BREAK_DURATION = 5 * 60;
// Hour the magnesium reminder becomes due
export const MAGNESIUM_HOUR = 23;
// Daily water goal, in glasses
export const WATER_GOAL = 8;

export type Posture = "sitting" | "standing";
export type FocusState = "idle" | "running" | "paused" | "completed";
