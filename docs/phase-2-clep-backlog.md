# Phase 2 CLEP Backlog — Multi-Course Dashboard

**Status**: Not started
**Prerequisite**: Phase 1 (Beta 1.15) shipped and CLEP demand validated
**Estimated effort**: 5–8 days

---

## Context

Phase 1 added CLEP courses to the existing single-course architecture (sidebar + practice engine + AI tutor). Phase 2 gives users the ability to **enroll in multiple courses at once** and see a consolidated multi-course dashboard with CLEP visually separated from AP/SAT/ACT.

---

## P0 — Multi-Course Selection Infrastructure (must-have for Phase 2)

### DB-1: Add `selectedCourses` to User model
**File**: `prisma/schema.prisma`
```prisma
model User {
  // ... existing fields ...
  selectedCourses ApCourse[]  // stores enrolled courses; empty = uses cookie default
}
```
**Migration**: `npx prisma migrate dev --name add-selected-courses`
**Backward compat**: Empty array = fall back to `ap_selected_course` cookie (existing behavior)

### API-1: New `GET/PUT /api/user/courses` route
**File**: `src/app/api/user/courses/route.ts` (new file)
- `GET` → returns `{ selectedCourses: ApCourse[] }`
- `PUT` → body `{ selectedCourses: ApCourse[] }`, validates against `VALID_AP_COURSES`, updates DB
- Auth-gated, `export const dynamic = "force-dynamic"`

### AUTH-1: Add `selectedCourses` to JWT
**File**: `src/lib/auth.ts`
- In `jwt` callback: look up `user.selectedCourses` and set `token.selectedCourses`
- In `session` callback: expose as `session.user.selectedCourses`
- Purpose: avoids DB round-trip on every server component render

---

## P1 — Onboarding Overhaul

### ONBOARD-1: Goal selection step (new Step 0)
**File**: `src/app/(dashboard)/onboarding/page.tsx`

Add a new Step 1 before the existing course selection:

**Three goal cards**:
- "Score Higher on AP, SAT or ACT" → show existing AP/SAT/ACT selector
- "Earn College Credit (CLEP)" → show CLEP 6-exam selector
- "Both" → show all exam types

**CLEP card copy**: "Skip introductory college courses. Pass a $93 CLEP exam → earn ~$1,200 in credit."

### ONBOARD-2: Multi-select course selection (replaces single-select)
**File**: `src/app/(dashboard)/onboarding/page.tsx`

- Checkbox grid instead of radio buttons
- CLEP courses show ROI badge: "Saves ~$1,200"
- "Recommended" pre-selects 1 course per category chosen
- User can pick 1–N courses
- On completion: `PUT /api/user/courses` with selected courses

### ONBOARD-3: Persist to DB on completion
Replace `localStorage['onboarding_completed']` write with API call + localStorage flag:
```typescript
await fetch("/api/user/courses", { method: "PUT", body: JSON.stringify({ selectedCourses }) });
localStorage.setItem("onboarding_completed", "true");
```

---

## P1 — Dashboard Multi-Course View

### DASH-1: Read `selectedCourses` from DB
**File**: `src/app/(dashboard)/dashboard/page.tsx`

```typescript
const userWithCourses = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { selectedCourses: true, ...existingFields },
});
const selectedCourses = userWithCourses?.selectedCourses ?? [];
// fallback: if empty, use cookie course (backward compat)
```

### DASH-2: Multi-course tab bar
If `selectedCourses.length > 1`:
- Show course chip tabs at top of dashboard for quick switching
- CLEP courses grouped under "College Credit (CLEP)" with emerald accent
- AP/SAT/ACT courses grouped under "AP · SAT · ACT" with indigo accent
- Active course drives the rest of the dashboard data (mastery, sessions, etc.)

### DASH-3: CLEP-specific ROI card
For each selected CLEP course, show a card:
```
"Passing CLEP [course] can save ~$1,200 in tuition"
[Progress bar: X% ready to pass]
[CTA: Practice Now]
```

### DASH-4: "Add More Courses" button
- Bottom of dashboard
- Opens `/onboarding?step=courses` or a `/settings/courses` modal
- Lets users expand their enrolled course list without re-onboarding

---

## P2 — Sidebar Enrolled Courses View

### SIDEBAR-1: Replace dropdown with enrolled-only list
**File**: `src/components/layout/sidebar.tsx`

When `selectedCourses.length > 0`:
- Show enrolled courses grouped by category (AP/SAT/ACT and CLEP separate)
- Non-enrolled courses hidden by default
- "Browse all courses" link at bottom to add more

### SIDEBAR-2: CLEP visual distinction
- CLEP section header: emerald accent color
- Badge: "College Credit" next to CLEP section heading
- Keep AP/SAT/ACT as indigo

---

## P3 — Per-Exam CLEP Pricing (optional, later)

### BILLING-1: `ClepAccess` model
**File**: `prisma/schema.prisma`
```prisma
model ClepAccess {
  id        String   @id @default(cuid())
  userId    String
  course    ApCourse
  grantedAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, course])
  @@map("clep_access")
}
```

### BILLING-2: Per-exam Stripe pricing
- New env vars: `STRIPE_CLEP_SINGLE_PRICE_ID`, `STRIPE_CLEP_3PACK_PRICE_ID`, `STRIPE_CLEP_5PACK_PRICE_ID`
- Update `/api/checkout` to handle `?plan=clep_single&exam=CLEP_COLLEGE_ALGEBRA`
- `checkout.session.completed` webhook: create `ClepAccess` record for purchased exam(s)

### BILLING-3: Gate CLEP practice in `/api/practice`
```typescript
// When clep_per_exam_enabled flag is ON:
if (isClepCourse(course)) {
  const access = await prisma.clepAccess.findUnique({ where: { userId_course: { userId, course } } });
  if (!access && tier !== "PREMIUM") return 403 "CLEP access required";
}
```

### BILLING-4: CLEP pricing page section
- Add CLEP pricing card to `/pricing` page below existing Free/Premium cards
- Single exam: $14.99, 3-exam bundle: $34.99 (22% off), 5-exam bundle: $49.99 (34% off)
- ROI callout: "Pay $14.99 — skip a $1,200 course. 99% savings."

---

## Completion Criteria

All P0 + P1 items = Phase 2 shippable. P2 = sidebar polish. P3 = revenue unlock (deferred).

| Item | Priority | Effort |
|------|----------|--------|
| DB-1 selectedCourses schema | P0 | 30 min |
| API-1 /api/user/courses | P0 | 1 hr |
| AUTH-1 JWT update | P0 | 1 hr |
| ONBOARD-1/2/3 | P1 | 1 day |
| DASH-1/2/3/4 | P1 | 1.5 days |
| SIDEBAR-1/2 | P2 | 0.5 day |
| BILLING-1/2/3/4 | P3 | 2 days |
