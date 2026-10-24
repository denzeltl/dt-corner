import { Bell, FlaskConical, MonitorSmartphone, Moon, Trash2, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type SettingsSheetProps = {
    open: boolean;
    onClose: () => void;
    audioEnabled: boolean;
    onAudioChange: (on: boolean) => void;
    notificationsEnabled: boolean;
    notificationError: string | null;
    onNotificationsChange: (on: boolean) => void;
    autoTrackingAvailable: boolean;
    autoTrackingEnabled: boolean;
    onAutoTrackingChange: (on: boolean) => void;
    autoTrackingMinutes: number;
    onAutoTrackingMinutesChange: (mins: number) => void;
    waterInterval: number;
    onWaterIntervalChange: (mins: number) => void;
    eyeInterval: number;
    onEyeIntervalChange: (mins: number) => void;
    lockoutHour: number;
    onLockoutHourChange: (hour: number) => void;
    onClearLogs: () => void;
    onLoadSampleData: () => void;
    onPreviewLockout: () => void;
};

export function SettingsSheet(props: SettingsSheetProps) {
    const { open, onClose } = props;
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [confirmClear, setConfirmClear] = useState(false);

    // Native <dialog> gives focus trapping, Escape to close and focus return for free.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
        if (!open) setConfirmClear(false);
    }, [open]);

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            onClick={(e) => e.target === dialogRef.current && onClose()}
            aria-labelledby="settings-heading"
            className="settings-sheet m-0 mt-auto h-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-[22px] border border-b-0 border-line bg-surface p-0 text-ink backdrop:bg-night/70 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-lg sm:rounded-[22px] sm:border-b"
        >
            <div className="flex max-h-[88dvh] flex-col">
                <header className="flex items-center justify-between border-b border-line px-5 py-3">
                    <h2 id="settings-heading" className="font-display text-xl font-semibold">
                        Settings
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close settings"
                        className="press -mr-2 grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5 pb-[max(2rem,env(safe-area-inset-bottom))] [mask-image:linear-gradient(to_bottom,#000_calc(100%-2rem),transparent)]">
                    <Group title="Alerts">
                        <Switch
                            icon={<Volume2 size={18} />}
                            label="Sounds"
                            description="A soft chime for reminders and actions."
                            checked={props.audioEnabled}
                            onChange={props.onAudioChange}
                        />
                        <Switch
                            icon={<Bell size={18} />}
                            label="Desktop notifications"
                            description="Reminders show up even when this window is hidden."
                            checked={props.notificationsEnabled}
                            onChange={props.onNotificationsChange}
                        />
                        {props.notificationError && (
                            <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
                                {props.notificationError}
                            </p>
                        )}
                    </Group>

                    <Group title="Reminders">
                        <Segmented
                            label="Water every"
                            value={props.waterInterval}
                            options={[30, 45, 60, 90].map((m) => ({ value: m, label: `${m} min` }))}
                            onChange={props.onWaterIntervalChange}
                        />
                        <Segmented
                            label="Eye rest every"
                            value={props.eyeInterval}
                            options={[20, 30, 45].map((m) => ({ value: m, label: `${m} min` }))}
                            onChange={props.onEyeIntervalChange}
                        />
                    </Group>

                    <Group title="Tracking">
                        <Switch
                            icon={<MonitorSmartphone size={18} />}
                            label="Auto tracking"
                            description={
                                props.autoTrackingAvailable
                                    ? "Time in when you use the computer and time out when you step away. Only idle time is read, never keys or apps."
                                    : "Available in the Windows desktop app. A browser can't see activity outside this tab."
                            }
                            checked={props.autoTrackingEnabled}
                            disabled={!props.autoTrackingAvailable && !props.autoTrackingEnabled}
                            onChange={props.onAutoTrackingChange}
                        />
                        {props.autoTrackingEnabled && props.autoTrackingAvailable && (
                            <Segmented
                                label="Time out after"
                                value={props.autoTrackingMinutes}
                                options={[5, 10, 15, 30].map((m) => ({ value: m, label: `${m} min` }))}
                                onChange={props.onAutoTrackingMinutesChange}
                            />
                        )}
                    </Group>

                    <Group title="Bedtime">
                        <Segmented
                            label="Lock the screen from"
                            icon={<Moon size={16} />}
                            value={props.lockoutHour}
                            options={[
                                { value: 23, label: "11 PM" },
                                { value: 0, label: "12 AM" },
                                { value: 1, label: "1 AM" },
                            ]}
                            onChange={props.onLockoutHourChange}
                        />
                        <p className="text-sm text-muted">The lockout lifts at 5 AM.</p>
                    </Group>

                    <Group title="Data">
                        <p className="text-sm text-muted">Everything is stored on this device only. Nothing is sent anywhere.</p>
                        {confirmClear ? (
                            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-danger/40 bg-danger/10 p-3">
                                <p className="mr-auto text-sm text-ink">Delete all screen time, focus and water logs?</p>
                                <button
                                    type="button"
                                    onClick={() => setConfirmClear(false)}
                                    className="press min-h-11 rounded-full px-4 text-sm font-semibold text-muted hover:text-ink"
                                >
                                    Keep
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        props.onClearLogs();
                                        setConfirmClear(false);
                                    }}
                                    className="press min-h-11 rounded-full bg-danger px-4 text-sm font-semibold text-night"
                                >
                                    Delete logs
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setConfirmClear(true)}
                                className="press flex min-h-11 items-center gap-2 self-start rounded-full border border-line px-4 text-sm font-semibold text-muted hover:border-danger/50 hover:text-danger"
                            >
                                <Trash2 size={16} /> Clear all logs
                            </button>
                        )}
                    </Group>

                    {import.meta.env.DEV && (
                        <Group title="Developer">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={props.onLoadSampleData}
                                    className="press flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-muted hover:text-ink"
                                >
                                    <FlaskConical size={16} /> Load sample week
                                </button>
                                <button
                                    type="button"
                                    onClick={props.onPreviewLockout}
                                    className="press flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-muted hover:text-ink"
                                >
                                    <Moon size={16} /> Preview lockout
                                </button>
                            </div>
                        </Group>
                    )}
                </div>
            </div>
        </dialog>
    );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <h3 className="text-[13px] font-semibold text-faint">{title}</h3>
            {children}
        </section>
    );
}

type SwitchProps = {
    icon: ReactNode;
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (on: boolean) => void;
};

function Switch({ icon, label, description, checked, disabled, onChange }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className="press group flex w-full items-start gap-3 rounded-2xl text-left disabled:cursor-not-allowed disabled:opacity-55"
        >
            <span className="mt-0.5 text-muted" aria-hidden="true">
                {icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block font-semibold">{label}</span>
                <span className="block text-sm text-muted">{description}</span>
            </span>
            <span
                className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
                    checked ? "bg-sun" : "bg-surface-2 ring-1 ring-line ring-inset"
                }`}
                aria-hidden="true"
            >
                <span
                    className={`absolute top-1 left-1 size-5 rounded-full shadow transition-transform duration-200 ease-[var(--ease-out)] group-active:scale-x-110 ${
                        checked ? "translate-x-5 bg-sun-ink" : "bg-muted"
                    }`}
                />
            </span>
        </button>
    );
}

type SegmentedProps = {
    label: string;
    icon?: ReactNode;
    value: number;
    options: { value: number; label: string }[];
    onChange: (value: number) => void;
};

function Segmented({ label, icon, value, options, onChange }: SegmentedProps) {
    const index = Math.max(0, options.findIndex((o) => o.value === value));
    return (
        <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 flex items-center gap-2 font-semibold">
                {icon && <span className="text-muted">{icon}</span>}
                {label}
            </legend>
            <div className="relative grid rounded-full bg-night p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
                <span
                    aria-hidden="true"
                    className="absolute inset-y-1 left-1 rounded-full bg-surface-2 ring-1 ring-line transition-transform duration-200 ease-[var(--ease-out)]"
                    style={{
                        width: `calc((100% - 0.5rem) / ${options.length})`,
                        transform: `translateX(${index * 100}%)`,
                    }}
                />
                {options.map((o) => (
                    <label
                        key={o.value}
                        className={`relative grid min-h-10 cursor-pointer place-items-center rounded-full text-sm font-semibold transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-sun ${
                            o.value === value ? "text-ink" : "text-muted hover:text-ink"
                        }`}
                    >
                        <input
                            type="radio"
                            name={label}
                            value={o.value}
                            checked={o.value === value}
                            onChange={() => onChange(o.value)}
                            className="sr-only"
                        />
                        {o.label}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}
