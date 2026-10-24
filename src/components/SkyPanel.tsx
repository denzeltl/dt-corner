import { LOCKOUT_END_HOUR } from "../utils/time";

type Rgb = [number, number, number];
type Keyframe = { at: number; top: Rgb; mid: Rgb; bottom: Rgb };

const hex = (h: string): Rgb => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
const mix = (a: Rgb, b: Rgb, t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;

const NIGHT = { top: hex("#070a18"), mid: hex("#141a3a"), bottom: hex("#2a2f5c") };

/**
 * Sky colours across a "desk day" measured in hours from 5 AM to the lockout hour (which may be past
 * midnight, so it is expressed as 23, 24 or 25). The sun sets as the lockout gets close.
 */
const keyframes = (lockout: number): Keyframe[] => [
    { at: LOCKOUT_END_HOUR, ...NIGHT },
    { at: 7, top: hex("#3a3f7a"), mid: hex("#c77d9a"), bottom: hex("#ffc59a") },
    { at: 10, top: hex("#2f5fa8"), mid: hex("#6f9fd8"), bottom: hex("#b9d6f0") },
    { at: 16, top: hex("#2f5fa8"), mid: hex("#6f9fd8"), bottom: hex("#b9d6f0") },
    { at: lockout - 4, top: hex("#34408a"), mid: hex("#c07a8a"), bottom: hex("#ffbf86") },
    { at: lockout - 1.5, top: hex("#262a63"), mid: hex("#a8558a"), bottom: hex("#ffa070") },
    { at: lockout, ...NIGHT },
];

function skyAt(now: Date, lockoutStartHour: number) {
    const lockout = lockoutStartHour < 12 ? lockoutStartHour + 24 : lockoutStartHour;
    let h = now.getHours() + now.getMinutes() / 60;
    if (h < LOCKOUT_END_HOUR) h += 24;

    const isNight = h >= lockout;
    const frames = keyframes(lockout);
    let top = mix(NIGHT.top, NIGHT.top, 0);
    let mid = mix(NIGHT.mid, NIGHT.mid, 0);
    let bottom = mix(NIGHT.bottom, NIGHT.bottom, 0);
    if (!isNight) {
        for (let i = 0; i < frames.length - 1; i++) {
            const a = frames[i];
            const b = frames[i + 1];
            if (h >= a.at && h <= b.at) {
                const t = b.at === a.at ? 0 : (h - a.at) / (b.at - a.at);
                top = mix(a.top, b.top, t);
                mid = mix(a.mid, b.mid, t);
                bottom = mix(a.bottom, b.bottom, t);
                break;
            }
        }
    }

    // Sun travels a low arc from sunrise (6 AM) to the lockout, dipping behind the hills at the end.
    // It stays between the wordmark (left) and the settings button (right).
    const progress = Math.min(1, Math.max(0, (h - 6) / (lockout - 6)));
    const sunX = 46 + progress * 34;
    const sunY = 92 - Math.sin(progress * Math.PI) * 62 + (progress > 0.9 ? (progress - 0.9) * 120 : 0);
    // Moon rises across the lockout window.
    const nightProgress = isNight ? Math.min(1, (h - lockout) / (LOCKOUT_END_HOUR + 24 - lockout)) : 0;
    const moonX = 46 + nightProgress * 34;
    const moonY = 50 - Math.sin(nightProgress * Math.PI) * 22;

    return { top, mid, bottom, isNight, sunX, sunY, moonX, moonY, isBeforeSunrise: h < 6 };
}

type SkyPanelProps = {
    now: Date;
    lockoutStartHour: number;
    className?: string;
};

/**
 * The signature horizon. Purely decorative; the time-until-lockout text sits beside it.
 * Sky, sun and stars are positioned in percentages and the hills stretch, so it holds at any aspect ratio.
 */
export function SkyPanel({ now, lockoutStartHour, className = "" }: SkyPanelProps) {
    const sky = skyAt(now, lockoutStartHour);
    const drift = "left 1.2s var(--ease-out), top 1.2s var(--ease-out)";

    return (
        <div
            aria-hidden="true"
            className={`overflow-hidden ${className}`}
            style={{ background: `linear-gradient(180deg, ${sky.top} 0%, ${sky.mid} 60%, ${sky.bottom} 100%)` }}
        >
            {sky.isNight ? (
                <>
                    {STARS.map(([x, y, r], i) => (
                        <span
                            key={i}
                            className="absolute rounded-full bg-white"
                            style={{ left: `${x}%`, top: `${y}%`, width: r, height: r, opacity: 0.35 + (i % 3) * 0.2 }}
                        />
                    ))}
                    <span
                        className="absolute size-7 -translate-1/2 -rotate-20 rounded-full shadow-[inset_-7px_-3px_0_0_#f4ecd6]"
                        style={{ left: `${sky.moonX}%`, top: `max(${(sky.moonY / 110) * 100}%, 2.75rem)`, transition: drift }}
                    />
                </>
            ) : (
                !sky.isBeforeSunrise && (
                    <span
                        className="absolute size-9 -translate-1/2 rounded-full bg-[#ffe2b0] shadow-[0_0_40px_10px_rgb(255_226_176/0.15)]"
                        style={{ left: `${sky.sunX}%`, top: `max(${(sky.sunY / 110) * 100}%, 2.75rem)`, transition: drift }}
                    />
                )
            )}
            <svg
                viewBox="0 0 200 44"
                preserveAspectRatio="none"
                className="absolute inset-x-0 -bottom-px h-[min(42%,6rem)] w-full"
            >
                <path d="M0 18 30 6 58 14 92 0 124 11 156 2 200 12V44H0Z" fill="#1b2240" />
                <path d="M0 30 40 22 84 28 130 18 170 26 200 22V44H0Z" fill="#141a30" />
            </svg>
        </div>
    );
}

// [left %, top %, size px]
const STARS: [number, number, number][] = [
    [7, 11, 2], [16, 27, 1], [24, 7, 2], [33, 20, 1], [42, 36, 2], [51, 13, 1],
    [59, 31, 2], [68, 9, 1], [75, 25, 2], [84, 15, 1], [92, 33, 2], [96, 7, 1],
    [12, 42, 1], [38, 47, 1], [71, 45, 1], [88, 51, 1],
];
