---
version: alpha
name: YouTube
description: >-
  A global video platform designed for discovery, sharing, and community engagement. The design system prioritizes
  content-first layouts with a clean, accessible interface that scales from mobile to desktop.
logo:
  src: https://www.youtube.com/s/desktop/8a76fb04/img/favicon_144x144.png
colors:
  surface: '#ffffff'
  surface-dim: '#f5f5f5'
  surface-bright: '#ffffff'
  surface-container-lowest: '#fafafa'
  surface-container-low: '#f9f9f9'
  surface-container: '#f5f5f5'
  surface-container-high: '#eeeeee'
  surface-container-highest: '#e8e8e8'
  on-surface: '#0f0f0f'
  on-surface-variant: '#606060'
  inverse-surface: '#0f0f0f'
  inverse-on-surface: '#f5f5f5'
  outline: '#dbdbdb'
  outline-variant: '#9b9b9b'
  surface-tint: '#e1002d'
  primary: '#e1002d'
  on-primary: '#ffffff'
  primary-container: '#ffcccc'
  on-primary-container: '#8b0000'
  inverse-primary: '#ff5577'
  secondary: '#2ba640'
  on-secondary: '#ffffff'
  secondary-container: '#c8e6c9'
  on-secondary-container: '#1b5e20'
  tertiary: '#3ea6ff'
  on-tertiary: '#ffffff'
  tertiary-container: '#b3e5fc'
  on-tertiary-container: '#01579b'
  error: '#dd2c00'
  on-error: '#ffffff'
  error-container: '#ffcccc'
  on-error-container: '#8b0000'
  primary-fixed: '#ffcccc'
  primary-fixed-dim: '#ff9999'
  on-primary-fixed: '#8b0000'
  on-primary-fixed-variant: '#b30000'
  secondary-fixed: '#c8e6c9'
  secondary-fixed-dim: '#a5d6a7'
  on-secondary-fixed: '#1b5e20'
  on-secondary-fixed-variant: '#2e7d32'
  tertiary-fixed: '#b3e5fc'
  tertiary-fixed-dim: '#81d4fa'
  on-tertiary-fixed: '#01579b'
  on-tertiary-fixed-variant: '#0277bd'
  background: '#ffffff'
  on-background: '#0f0f0f'
  surface-variant: '#e6e6e6'
typography:
  display:
    fontFamily: YouTube Sans, Roboto, Arial, sans-serif
    fontSize: 60px
    fontWeight: '700'
    lineHeight: 68px
    letterSpacing: '-0.04em'
  headline-lg:
    fontFamily: YouTube Sans, Roboto, Arial, sans-serif
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: '-0.02em'
  headline-md:
    fontFamily: YouTube Sans, Roboto, Arial, sans-serif
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: '-0.01em'
  title-lg:
    fontFamily: YouTube Sans, Roboto, Arial, sans-serif
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0em
  body-lg:
    fontFamily: Roboto, Arial, sans-serif
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Roboto, Arial, sans-serif
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Roboto, Arial, sans-serif
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Roboto, Arial, sans-serif
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  container-max: 1440px
elevation:
  sm: 0 1px 2px rgba(0, 0, 0, 0.06)
  md: 0 4px 12px rgba(0, 0, 0, 0.08)
  lg: 0 16px 40px rgba(0, 0, 0, 0.12)
layout:
  containerMaxWidth: 1440px
  gridColumns: 12
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label-md}'
    rounded: '{rounded.full}'
    padding: 8px 16px
    height: 40px
    border: none
  button-primary-hover:
    backgroundColor: '#cc0026'
    textColor: '{colors.on-primary}'
  button-primary-active:
    backgroundColor: '#b30000'
    textColor: '{colors.on-primary}'
  button-secondary:
    backgroundColor: '{colors.surface-container-high}'
    textColor: '{colors.on-surface}'
    typography: '{typography.label-md}'
    rounded: '{rounded.full}'
    padding: 8px 16px
    height: 40px
    border: 1px solid {colors.outline}
  button-secondary-hover:
    backgroundColor: '{colors.surface-container-highest}'
    textColor: '{colors.on-surface}'
  button-ghost:
    backgroundColor: transparent
    textColor: '{colors.on-surface}'
    typography: '{typography.label-md}'
    rounded: '{rounded.full}'
    padding: 8px 16px
    height: 40px
    border: none
  button-ghost-hover:
    backgroundColor: '{colors.surface-container-high}'
    textColor: '{colors.on-surface}'
  search-input:
    backgroundColor: '{colors.surface-container-high}'
    textColor: '{colors.on-surface}'
    typography: '{typography.body-md}'
    rounded: '{rounded.full}'
    padding: 10px 16px
    height: 40px
    border: 1px solid {colors.outline}
  search-input-focus:
    backgroundColor: '{colors.surface}'
    border: 2px solid {colors.primary}
    boxShadow: 0 2px 8px rgba(225, 0, 45, 0.12)
  card:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.md}'
    padding: '{spacing.md}'
    border: 1px solid {colors.outline}
    boxShadow: '{elevation.sm}'
  card-hover:
    backgroundColor: '{colors.surface-container-low}'
    boxShadow: '{elevation.md}'
  chip:
    backgroundColor: '{colors.surface-container-high}'
    textColor: '{colors.on-surface}'
    typography: '{typography.label-md}'
    rounded: '{rounded.full}'
    padding: 8px 12px
    height: 32px
    border: 1px solid {colors.outline}
  chip-selected:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    border: none
  list-item:
    backgroundColor: transparent
    textColor: '{colors.on-surface}'
    typography: '{typography.body-md}'
    rounded: '{rounded.md}'
    padding: '{spacing.sm}'
    border: none
  list-item-hover:
    backgroundColor: '{colors.surface-container-high}'
    textColor: '{colors.on-surface}'
  badge:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label-sm}'
    rounded: '{rounded.full}'
    padding: 4px 8px
    height: 20px
  icon-button:
    backgroundColor: transparent
    textColor: '{colors.on-surface}'
    rounded: '{rounded.full}'
    width: 40px
    height: 40px
    padding: 8px
  icon-button-hover:
    backgroundColor: '{colors.surface-container-high}'
    textColor: '{colors.on-surface}'
---

## Overview

YouTube is a global video platform built on a content-first design philosophy that prioritizes discovery, accessibility, and user agency. The design system embodies "Functional Minimalism"—a aesthetic that strips away visual noise to create a clear, predictable interface where video content remains the hero. The brand personality is approachable, authoritative, and community-driven: the UI speaks in imperative, action-oriented language ("Try searching to get started", "Sign in") that invites participation without friction. The emotional response is one of clarity and possibility—users should feel confident navigating a vast library while discovering new content tailored to their interests. Voice example: "Start watching videos to help us build a feed of videos you'll love."

## Colors

The color palette is rooted in a light, neutral foundation with a bold red accent that signals urgency and brand identity. Primary (#e1002d) is YouTube's signature red, deployed on CTAs, play buttons, and interactive highlights to drive engagement; it appears in 52+ instances across the DOM, making it the most frequent accent. Secondary (#2ba640) is a vibrant green used for positive actions and status indicators (e.g., verified badges, success states). Tertiary (#3ea6ff) is a bright blue reserved for informational elements and secondary interactive states. The surface stack is anchored in pure white (#ffffff) for the main canvas, with subtle grays (#f5f5f5 for surface-container, #e8e8e8 for surface-container-highest) creating visual separation without harsh contrast. On-surface text is a d

## Typography

The type system uses a two-font strategy: YouTube Sans (weights 300–900) for headlines and display text, providing a distinctive, modern voice; Roboto (weights 300–700) for body and label text, ensuring legibility at small sizes. Display (60px, 700 weight, -0.04em letter-spacing) is reserved for hero statements and major section titles. Headline-lg (40px, 600 weight) anchors page sections; headline-md (28px, 600 weight) organizes subsections. Title-lg (20px, 600 weight) labels cards and modals. Body-lg (18px, 400 weight, 28px line-height) is used for descriptive text in cards and modals; body-md (16px, 400 weight, 24px line-height) is the default for input fields and list items. Label-md (14px, 500 weight) and label-sm (12px, 500 weight) are applied to buttons, chips, and metadata. All hea

## Layout

The layout system uses a 12-column grid with a maximum container width of 1440px, enabling responsive scaling from mobile (single column) to desktop (multi-column). The primary navigation sidebar occupies 240px on desktop (collapsible to 72px), leaving the main content area fluid. Horizontal padding follows the gutter token (24px) on desktop, reducing to 16px on tablets and 8px on mobile. Vertical rhythm is maintained through the spacing scale: lg (40px) separates major sections, md (24px) separates cards and components, sm (12px) separates inline elements. The search bar and header occupy a fixed 56px height, creating a stable anchor for navigation. Content cards are laid out in a responsive grid: 1 column on mobile, 2 columns on tablet (600–1023px), and 3+ columns on desktop (1600px+). E

## Elevation & Depth

Depth is achieved through a restrained shadow system that avoids visual heaviness while maintaining clear layer separation. Level 1 (Base): flat surfaces with no shadow; used for the main canvas and sidebar. Level 2 (Standard Card): box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), applied to cards, chips, and input fields at rest; this subtle shadow defines the card boundary without drawing attention. Level 3 (Elevated/Hover): box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), applied on card hover and modal overlays; the increased blur radius (12px) and offset (4px) create a sense of lift. Level 4 (Modal/

## Shapes

The shape philosophy is "Geometric Accessibility"—rounded corners are applied strategically to soften the interface and improve touch targets without sacrificing clarity. Buttons and chips use full (9999px) border-radius to create pill-shaped elements that feel friendly and clickable; this is the most frequent radius (245 instances). Cards and modals use lg (1rem / 16px) border-radius, providing subtle rounding that feels modern without being playful. Input fields and search boxes use md (0.75rem / 12px) border-radius, balancing usability with visual consistency. Icon buttons and avatar contai

## Components

### Action Elements
Buttons are the primary interaction mechanism. Primary buttons (button-primary) use the brand red (#e1002d) background with white text, 40px height, 8px vertical / 16px horizontal padding, and full border-radius. On hover (button-primary-hover), the background darkens to #cc0026 with a 200ms transition. On active (button-primary-active), the background is #b30000. Secondary buttons (button-secondary) use a light gray background ({colors.surface-container-high}), dark text, and a 1px outline border; on hover, the background shifts to {colors.surface-container-highest}. Ghost buttons (button-ghost) have no background or border, only text; on hover, a light gray background appears. All buttons use label-md typography (14px, 500 weight) and apply transition: background-colo

## Do's and Don'ts

**Do**
- Do use the brand red (#e1002d) exclusively for primary CTAs and interactive highlights—it signals action and drives engagement.
- Do maintain 24px gutter spacing between major content sections and 12px spacing between inline components to create visual breathing room.
- Do apply full border-radius (9999px) to all buttons and chips to create a friendly, inviting interface that encourages interaction.
- Do use YouTube Sans for all headline text (display, headline-lg, headline-md) to reinforce brand identity and create visual hierarchy.
- Do apply the shadow system consistently: sm shadow for cards at rest, md shadow on hover, lg shadow for modals—never mix shadow levels.
- Do ensure all text meets WCAG AA contrast ratios (4.5:1 for body text, 3:1 for large text) by using #0f0f0f on light backgrounds and #f5f5f5 on dark backgrounds.

**Don't**
- Don't use secondary colors (green #2ba640, blue #3ea6ff) for primary CTAs—reserve them for status indicators, success states, and informational elements.
- Don't apply border-radius values smaller than md (12px) to cards or containers; sharp corners feel cold and reduce perceived interactivity.
- Don't hardcode shadow values in component styles—always reference the elevation tokens (sm, md, lg) to maintain consistency.
- Don't use Roboto for headlines or display text; YouTube Sans is the brand typeface and must be used for all h1–h3 elements.
- Don't exceed 1440px container width on desktop, even on ultra-wide screens—content becomes difficult to scan and loses visual hierarchy.
- Don't apply opacity or transparency to primary red (#e1002d) for hover states; instead, shift to darker or lighter hex values (#cc0026 for hover, #b30000 for active) to maintain color integrity.
