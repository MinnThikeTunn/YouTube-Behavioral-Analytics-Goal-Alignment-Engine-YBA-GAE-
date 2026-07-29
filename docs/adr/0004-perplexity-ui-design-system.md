# 4. Adopt Perplexity-Style Design System with Dark/Light Contrast & Metric Badges

* **Status:** Accepted
* **Date:** 2026-07-29

## Context and Problem Statement
The user dashboard must present complex analytical proxy metrics, time-series charts, and goal alignment recommendations in an intuitive, visual, and highly polished interface.

## Decision Drivers
- Modern high-end minimalist design aesthetic (Perplexity-inspired).
- Visual clarity and transparency regarding data types (distinguishing observed data from derived estimates).
- Seamless dark and light ambient contrast modes.

## Decision Outcome
Chosen Option: **1. Perplexity Aesthetic with Dark/Light Theme Toggle & Metric Badges**.

### UI Specifications
- **Containers**: `rounded-[32px]` with soft borders (`border border-slate-200/60 dark:border-zinc-800/80`) and subtle backdrop blur/shadow.
- **Typography**: `font-black` headings, sans-serif body text (Inter / Outfit).
- **Theme**: Light & Dark mode support with toggle control and system preference detection.
- **Data Transparency Badges**:
  - `[Directly Observed]` (Blue/Slate) for click timestamps, total counts.
  - `[Estimated Metric]` (Amber/Indigo) for Completion Probability, Focus Ratio, Goal Alignment Score.
- **Micro-Animations**: Framer Motion entry fades and hover elevation.
- **Data Visualization**: Customized SVG Recharts (AreaChart, BarChart, RadialProgress).
