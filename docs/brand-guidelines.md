# ResourceHub — Brand Guidelines v2

## Quick Reference
- **Theme:** Lumina Modern
- **Primary:** `#0F172A` (Slate 900)
- **Surface:** `#F8FAFC` / `#FFFFFF`
- **Border:** `#E2E8F0` (Slate 200)
- **Font:** Geist (headings + body), JetBrains Mono (mono)
- **Shape:** rounded-2xl cards, rounded-xl inputs/buttons, rounded-full badges

---

## 1. Color Palette

### Primary
| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#0F172A` | Headings, primary buttons, sidebar |
| Primary Container | `#131B2E` | Hover states, dark surfaces |
| On Primary Container | `#7C839B` | Text on dark surfaces |

### Secondary / Surface
| Name | Hex | Usage |
|------|-----|-------|
| Surface | `#F8FAFC` | Page background |
| Surface Card | `#FFFFFF` | Cards, modals, inputs |
| Surface Hover | `#F1F5F9` | Table row hover |
| Surface Dim | `#E2E8F0` | Dividers, borders |

### Semantic
| Name | Hex | Usage |
|------|-----|-------|
| Success | `#059669` | Available, approved |
| Warning | `#F59E0B` | Pending, reserved |
| Danger | `#EF4444` | Error, lost, rejected |
| Info | `#3B82F6` | Assigned, links |

### Text
| Name | Hex | Usage |
|------|-----|-------|
| Text Primary | `#161C22` | Body, headings |
| Text Secondary | `#475569` | Metadata, captions |
| Text Muted | `#94A3B8` | Placeholders, disabled |

---

## 2. Typography

Font stack: `'Geist', 'Inter', system-ui, -apple-system, sans-serif`
Mono stack: `'JetBrains Mono', 'Courier New', monospace`

| Element | Font | Weight | Size | Letter Spacing | Line Height |
|---------|------|--------|------|-----------------|--------------|
| H1 (page) | Geist | 600 | 24px | -0.01em | 1.3 |
| H2 (section) | Geist | 600 | 18px | -0.005em | 1.35 |
| Body | Geist | 400 | 14px | 0 | 1.5 |
| Label | Geist | 500 | 12px | 0.02em | 1.2 |
| Mono | JetBrains Mono | 400 | 13px | 0 | 1.5 |

---

## 3. Shape & Radius

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| Card | 16px | `rounded-2xl` | Main containers, modals |
| Input/Button | 12px | `rounded-xl` | Form elements, action buttons |
| Small | 6px | `rounded-md` | Tooltips, small badges |
| Pill | 9999px | `rounded-full` | Status badges, tags |

---

## 4. Elevation & Depth

- **Base:** White or `#F8FAFC` background
- **Card:** White + 1px `#E2E8F0` border + soft shadow
- **Shadow:** `0 4px 24px rgba(15, 23, 42, 0.04)` — large blur, slate tint, low opacity
- **Hover:** Lift 1px, shadow intensifies to 6% opacity
- **Transition:** `transition-all duration-200 ease-out`

---

## 5. Components

### Buttons
- Primary: `bg-[#0F172A] text-white rounded-xl px-5 py-2.5 text-sm font-medium`
- Secondary: `bg-white border border-[#E2E8F0] text-[#475569] rounded-xl px-5 py-2.5`
- Danger: `bg-[#EF4444] text-white rounded-xl px-5 py-2.5`

### Inputs
- Base: `bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm`
- Focus: `border-[#0F172A] ring-1 ring-[#0F172A]/10`
- Placeholder: `text-[#94A3B8]`
- Label: 8px above field, 12px, weight 500, `#475569`

### Cards
- Base: `bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_24px_rgba(15,23,42,0.04)]`
- Padding: 1.5rem (p-6)

### Badges / Status
- Shape: `rounded-full px-3 py-1 text-xs font-medium`
- Available/Active: `bg-emerald-50 text-emerald-700`
- Assigned/Info: `bg-blue-50 text-blue-700`
- Pending/Warning: `bg-amber-50 text-amber-700`
- Error/Lost: `bg-red-50 text-red-700`
- Neutral: `bg-slate-100 text-slate-600`

### Tables
- Header: `bg-[#F8FAFC] text-xs font-medium text-[#94A3B8] uppercase tracking-wide`
- Row: bordered-bottom 1px `#E2E8F0`, hover `bg-[#F8FAFC]`
- Cell padding: `px-5 py-3`

### Sidebar
- Background: `#0F172A`
- Nav text: `text-white/70`, hover `text-white bg-white/5`
- Brand text: `text-white font-semibold`
- Subtle: `text-white/40`

### Modals
- Overlay: `bg-black/40 backdrop-blur-sm`
- Panel: `bg-white rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.12)] p-6`

---

## 6. Voice

- Tone: Direct, helpful, data-driven
- No marketing fluff, no startup hype
- Actions: clear imperative verbs (Assign, Return, Submit, Approve)
- Labels: uppercase 12px, spaced 0.02em

## 7. Consistency Checklist

- [ ] All colors from palette above — no raw gray/blue/red classes
- [ ] Geist font loaded, fallback to Inter
- [ ] Cards use `rounded-2xl` + 1px border + designated shadow
- [ ] Inputs/buttons use `rounded-xl`
- [ ] Badges use `rounded-full`
- [ ] Sidebar: dark slate, no border
- [ ] Transitions: 200ms ease-out on interactive elements
- [ ] Text contrast ≥ 4.5:1
