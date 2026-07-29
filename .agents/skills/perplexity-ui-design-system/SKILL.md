---
name: perplexity-ui-design-system
description: High-end minimalist 'Perplexity' aesthetic design system guidance for React, Vite, and Tailwind CSS. Use this skill whenever building or styling UI components, dashboard layouts, file upload dropzones, circular progress meters, metric cards, dark/light contrast modes, font-black headings, `rounded-[32px]` containers, or micro-animations.
---

# Perplexity UI Design System

This skill provides comprehensive rules and component guidelines for crafting a high-end, minimalist **'Perplexity' design aesthetic** using React, Vite, and Tailwind CSS.

## 1. Aesthetic Core Principles

The Perplexity visual language is built on extreme intentionality, generous whitespace, pill/bubble container shapes, subtle micro-animations, and high-contrast typography.

### Design System Tokens
- **Container Radius**: `rounded-[32px]` for outer card containers; `rounded-2xl` or `rounded-full` for inner interactive elements.
- **Headings**: `font-black` (font-weight 900) or `font-extrabold` with tight letter spacing (`tracking-tight`).
- **Color Palette (Dark Mode Base)**:
  - Background: `bg-zinc-950` / `bg-black`
  - Container Surfaces: `bg-zinc-900/80` with `border border-zinc-800/80` and `backdrop-blur-xl`
  - Accent Color: Emerald / Teal (`bg-emerald-500`, `text-emerald-400`, `shadow-emerald-500/20`)
  - Subtle Text: `text-zinc-400` / `text-zinc-500`
- **Micro-animations**: Smooth hover scaling (`hover:scale-[1.01] active:scale-[0.99]`), subtle borders glow, fading transitions (`transition-all duration-300 ease-out`).

---

## 2. Key UI Component Templates

### Template A: Perplexity-Style Container (`rounded-[32px]`)
```tsx
import React from "react";

interface ContainerProps {
  title: string;
  children: React.ReactNode;
  actionBadge?: string;
}

export const PerplexityCard: React.FC<ContainerProps> = ({ title, children, actionBadge }) => {
  return (
    <div className="relative w-full bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/80 rounded-[32px] p-8 shadow-2xl transition-all duration-300 hover:border-zinc-700/80">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black tracking-tight text-white">{title}</h2>
        {actionBadge && (
          <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {actionBadge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};
```

### Template B: Drag & Drop Takeout Ingestion Zone
```tsx
export const DropZone: React.FC = () => {
  return (
    <div className="border-2 border-dashed border-zinc-700/80 hover:border-emerald-500/60 rounded-[28px] p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 bg-zinc-950/40 hover:bg-zinc-900/50 group">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
        <svg className="w-7 h-7 text-zinc-400 group-hover:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <p className="text-lg font-bold text-zinc-200 mb-1">Upload watch-history.json</p>
      <p className="text-xs text-zinc-500">Drag and drop your Google Takeout JSON export here</p>
    </div>
  );
};
```

---

## 3. Preservation Rules

When refactoring or styling existing UI features:
1. **Preserve All Fields**: Never remove existing data fields, forms, or status indicators during visual redesigns.
2. **Surgical Styling**: Apply utility classes to wrapper containers without altering underlying event listeners or DOM structure.
3. **No Generic Colors**: Avoid raw `red`, `blue`, or `green`. Use curated zinc/emerald contrast tones.
