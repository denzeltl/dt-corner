---
name: "DT Corner"
direction:
  name: "Dusk"
  thesis: "A small window onto the evening sky that sits in the corner of your desk. The day is a horizon, and the sun goes down as bedtime gets closer."
  signature: "The sky panel behind the clock follows the real hour: the sun climbs, sets toward the lockout hour, and the moon rises once the lockout begins."
colors:
  background: "#0b1020"   # night
  surface: "#141a30"      # card
  surface-2: "#1b2240"    # control fill, hover
  line: "#273055"         # hairlines, borders
  ink: "#eef0f7"
  muted: "#a3abc8"        # 7.4:1 on surface
  faint: "#6d76a0"        # decorative only, never body text
  accent: "#ffb36b"       # sun: primary action, "today", due reminders
  accent-ink: "#24130a"   # text on accent
  accent-2: "#ff7a8a"     # dusk rose, end of the gradient
  sea: "#7cc4ff"          # screen-time data
  focus: "#b9a4ff"        # focus-time data, focus session
  success: "#7ee0a8"
  danger: "#ff6b7a"
typography:
  display: { family: "Fraunces Variable", weight: 650, tracking: "-0.02em" }
  body: { family: "Inter Variable", weight: 400, size: "15px", leading: 1.5 }
  mono: { family: "JetBrains Mono" }
  scale: ["12px", "14px", "16px", "20px", "28px", "40px", "64px"]
rounded: { sm: "8px", md: "14px", lg: "22px", full: "999px" }
spacing: { unit: "4px", section: "24px", gutter: "12px" }
motion:
  intensity: crisp
  personality: "Slow light, quick hands. The sky drifts over minutes; controls answer in under 160ms with a soft lift and settle. Nothing bounces or flashes."
  durations: { instant: "100ms", fast: "160ms", base: "240ms", slow: "400ms", scene: "1200ms" }
  easing:
    out: "cubic-bezier(0.23, 1, 0.32, 1)"
    in-out: "cubic-bezier(0.77, 0, 0.175, 1)"
  spring: { stiffness: 400, damping: 30 }
  reduced: "No sky drift or reveal; state changes cross-fade or are instant; due reminders keep their colour and label"
components:
  sky-panel: "SVG horizon in the clock card. Gradient stops and sun/moon position are computed from the hour."
  pill-button: "Primary session control. Full radius, 48px min height, gradient fill when active."
  reminder-row: "Icon tile + label + countdown chip. Whole row is the button. Due = sun-tinted tile, label and chip."
  chip: "Mono countdown with tabular figures."
  week-chart: "Seven rounded columns: sea for screen time, focus as an inner fill. Today in sun-to-rose."
  sheet: "Settings dialog. Bottom sheet below 640px, centred panel above."
---

# DT Corner

## Direction
DT Corner is a health dashboard that lives on a second (often vertical) monitor all day and pushes you off the computer at night. Dusk makes that arc visible: the clock card is a horizon, so you can feel the evening running out before the lockout arrives. It is calm, warm and a little poetic. It is not a neon dev dashboard and not a gamified tracker. No glows, no pulsing borders.

## Colour
Night navy is the ground. The sun (`accent`) is the only warm colour and marks what matters right now: the active session, today in the chart, a due reminder. `accent-2` only appears as the far end of a sun gradient. Data has its own two colours: `sea` for screen time, `focus` for focus time. `success` and `danger` are for state, never decoration. Colour is never the only signal: due reminders also change their label and chip text.

## Type
Fraunces for the clock and the big numbers (the "voice"), Inter for everything else, JetBrains Mono for countdowns with tabular figures. Labels are sentence case at 12–14px in `muted`. No all-caps tracking walls.

## Layout
Three cards on wide screens (clock, week, reminders), two on tablets (clock spans the top), one column on phones. On wide and short screens (a desk strip) the grid fills the viewport height without scrolling. Gutter 12px, card padding 20px (16px on phones).

## Imagery
All imagery is code: the SVG sky, the logo mark, the starfield on the lockout screen. Icons are Lucide at 18px, stroke 2.

## Motion
The sky panel is the signature. It updates every minute and eases over 1.2s. Controls lift 1px on hover, settle to 0.97 on press, and show an animated focus ring. The water count pops when it changes. A due reminder slides its tint in once and stays still. The lockout screen fades up over 400ms. Reduced motion keeps every state change and drops the movement.

## Components
- **Sky panel**: a horizon of layered hills over a gradient computed from the hour, plus a sun or moon. Includes a line that says how long until the lockout.
- **Pill button**: the session and focus controls. Active session = sun gradient; focus running = focus tint.
- **Reminder row**: a full-width button. A tap logs the action (water) or restarts the timer.
- **Week chart**: columns with accessible labels; hover or focus shows the exact time.
- **Sheet**: settings with switches, segmented choices for intervals, and destructive actions behind a confirm.
