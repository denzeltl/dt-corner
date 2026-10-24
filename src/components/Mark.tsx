import { useId } from "react";

/** The DT Corner mark: a corner of the evening sky. Matches brand/mark.svg. */
export function Mark({ size = 28, className = "" }: { size?: number; className?: string }) {
    const id = useId().replace(/:/g, "");
    return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
            <defs>
                <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#262a63" />
                    <stop offset=".58" stopColor="#a8558a" />
                    <stop offset="1" stopColor="#ffa070" />
                </linearGradient>
                <clipPath id={`${id}-clip`}>
                    <rect width="64" height="64" rx="15" />
                </clipPath>
            </defs>
            <g clipPath={`url(#${id}-clip)`}>
                <rect width="64" height="64" fill={`url(#${id}-sky)`} />
                <circle cx="41" cy="35" r="10" fill="#ffe2b0" />
                <path d="M0 46 13 39 25 44 39 35 51 41 64 36V64H0Z" fill="#0b1020" />
            </g>
            <path d="M14 52V23a9 9 0 0 1 9-9h27" stroke="#eef0f7" strokeWidth="5" strokeLinecap="round" fill="none" />
        </svg>
    );
}
