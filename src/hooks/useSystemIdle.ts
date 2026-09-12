import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 15_000;

export type SystemIdleState = {
    available: boolean;
    idleSeconds: number | null;
};

/**
 * Reads the computer-wide Windows idle time when running inside the Tauri desktop app.
 * A normal browser intentionally has no access to this information.
 */
export function useSystemIdle(): SystemIdleState {
    const [state, setState] = useState<SystemIdleState>({ available: false, idleSeconds: null });

    useEffect(() => {
        if (!("__TAURI_INTERNALS__" in window)) return;

        let cancelled = false;

        const readIdleTime = async () => {
            try {
                const { invoke } = await import("@tauri-apps/api/core");
                const idleSeconds = await invoke<number>("get_system_idle_seconds");
                if (!cancelled) setState({ available: true, idleSeconds });
            } catch (error) {
                // Keep the web version fully usable if the native bridge is unavailable.
                console.warn("System idle tracking is unavailable:", error);
                if (!cancelled) setState({ available: false, idleSeconds: null });
            }
        };

        void readIdleTime();
        const interval = window.setInterval(() => void readIdleTime(), POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, []);

    return state;
}
