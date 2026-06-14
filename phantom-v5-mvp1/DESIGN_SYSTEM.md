# THE PHANTOM V5 MVP1 - DESIGN SYSTEM

## 1. COLOR SYSTEM (Neon Cyberpunk Casino Hybrid)
- **Background Gradient:** `bg-gradient-to-b from-[#0B0F1A] to-[#111A2E]`
- **Primary Neon (Cyan):** `#00E5FF` (HUD, Spin UI, Active States)
- **Secondary Neon (Purple):** `#9C27FF` (Squad UI, Transitions)
- **Accent (Gold):** `#FFD54F` (Tokens, Rewards, Rankings)
- **Success/Fail:** `#00FF9D` (Green) / `#FF0055` (Red - Elimination/Steal)

## 2. TYPOGRAPHY
- **Font Family:** `Space Mono` (Monospace for HUDs), `Inter` (Body).
- **Hierarchy:**
    - **Title:** `text-8xl font-black italic tracking-tighter`
    - **Subtext:** `text-xs font-bold uppercase tracking-[0.3em]`
    - **HUD Values:** `text-2xl font-black tabular-nums italic`

## 3. COMPONENT SYSTEM
- **Glassmorphism Panels:** `bg-[rgba(17,26,46,0.8)] backdrop-blur-lg border border-[rgba(255,255,255,0.05)] rounded-3xl`
- **Buttons:** 
    - **Main:** Neon-bordered, pulse-hover effect, `hover:shadow-neon-cyan`.
    - **Secondary:** Transparent with white border, glass fill.

## 4. MOTION SYSTEM
- **Transitions:** `ease-in-out` (300ms - 500ms)
- **Spin:** Infinite rotation animation `animate-spin-slow` (10s) + `circOut` eased spin results.
- **HUD Pulse:** `animate-pulse-slow` for active states.
