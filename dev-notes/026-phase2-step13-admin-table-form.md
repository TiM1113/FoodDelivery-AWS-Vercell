# 026 — Phase 2 Step 13: Admin TanStack Table + React Hook Form + Zod

**Date:** 2026-03-26
**Stage:** Phase 2 Step 13 complete — Phase 2 finished
**Branch:** `phase2/step13-admin-table-form` → merged to `main` via PR #36
**Result:** All three admin components refactored with professional-grade table, form, and validation libraries

---

## Why / Why this step

Step 12 merged the admin panel into the `/admin` route group of apps/web, but the components still used manual `<table>` rendering with `useState`-driven forms. This made sorting, filtering, and pagination all hand-coded, with no client-side validation — every mistake required a server round-trip to surface errors.

Step 13 is the final piece of Phase 2: replace the manual implementations with battle-tested libraries that handle sorting, filtering, pagination, form state, and validation out of the box.

## What was done / Changes made

### 1. TanStack Table v8 integration

**food-list.tsx:**
- 5 column definitions: Image (no sort), Name (sortable), Category (sortable + filterable), Price (sortable), Actions
- `useReactTable` with `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`
- Global text search bar, category dropdown filter, 10 items per page

**order-list.tsx:**
- 5 columns: Items, Customer, Amount (sortable), Payment (filterable), Status (sortable + filterable)
- Two filter dropdowns: payment status (All/Paid/Unpaid) with custom `filterFn`, order status
- 10 orders per page

### 2. React Hook Form + Zod validation

**add-food-form.tsx:**
- Replaced 4 `useState` calls with `useForm<AddFoodInput>` + `zodResolver`
- Field-level error messages (name, description, price, category)
- Image file validation: MIME type check (JPEG/PNG/WebP/GIF), 5MB size limit
- Category options sourced from shared `FoodCategorySchema.options`

**food-list.tsx edit dialog:**
- Dialog-based edit form (replaced inline row editing)
- Same RHF + Zod pattern as add form
- Conditional rendering guard `{editItem && (...)}` to prevent Image src="" error during dialog close animation

### 3. Shared Zod schemas

- `UpdateFoodInputSchema` in `packages/shared/src/schemas/food.schema.ts`
- `UpdateOrderStatusSchema` in `packages/shared/src/schemas/order.schema.ts`

### 4. Accessibility improvements (CodeRabbit feedback)

- `aria-label` on all pagination buttons ("Previous page" / "Next page")
- `aria-label` on filter dropdowns ("Payment filter" / "Status filter")
- Zero page count edge case handled (`|| 1`)
- AlertDialogTrigger icon moved inside render prop for proper composition

### 5. Tests

- `admin-schemas.test.ts`: Schema validation (valid inputs, empty fields, negative price, invalid categories)
- `food/update/route.test.ts`: Auth (401/403), validation (400), backend proxy
- `orders/update/route.test.ts`: Same auth + proxy pattern
- Total: 141 tests, all passing

## What I learned / Takeaways

1. **`@hookform/resolvers` v5.2.2 supports Zod v4 natively** — the `as any` cast we initially added was unnecessary. Always test before assuming type incompatibility.

2. **Dialog close animation + null state = Image src="" error** — When a dialog closes, the state resets to null during the CSS animation. Any `<Image>` component using that state as `src` will briefly receive an empty string. Fix: wrap form content in a conditional guard.

3. **TanStack Table column definitions with mutable closures** — Column definitions that reference state (like `orders` array for `updateStatus`) need `useMemo` with that state in the dependency array, otherwise the closure captures stale state.

4. **CodeRabbit review cycle** — Force-pushed commits reset the review. Each push triggers a new CodeRabbit run that takes 3-5 minutes. Plan fixes in batches to minimize round-trips.

## Files changed

| File | Change |
|------|--------|
| `apps/web/package.json` | Added `@tanstack/react-table` |
| `apps/web/src/components/admin/add-food-form.tsx` | Full rewrite: RHF + Zod + image validation |
| `apps/web/src/components/admin/food-list.tsx` | Full rewrite: TanStack Table + Dialog edit |
| `apps/web/src/components/admin/order-list.tsx` | Full rewrite: TanStack Table + filters |
| `apps/web/src/components/ui/dialog.tsx` | Style token update (popover colors) |
| `apps/web/src/components/ui/button.tsx` | aria-haspopup active state fix |
| `packages/shared/src/schemas/food.schema.ts` | Added UpdateFoodInputSchema |
| `packages/shared/src/schemas/order.schema.ts` | Added UpdateOrderStatusSchema |
| `apps/web/src/lib/schemas/admin-schemas.test.ts` | New: schema validation tests |
| `apps/web/src/app/api/admin/food/update/route.test.ts` | New: food update route tests |
| `apps/web/src/app/api/admin/orders/update/route.test.ts` | New: order update route tests |

## PR

https://github.com/TiM1113/FoodDelivery-AWS-Vercell/pull/36

---

## Plain language summary

Imagine you had a restaurant order board where all the sticky notes were handwritten, and every time you wanted to sort by price or find orders from a specific customer, you had to manually rearrange everything. That was our admin panel before this step.

**What changed:**

| Before (Step 12) | After (Step 13) |
|---|---|
| Manual `<table>` with hand-coded loops | TanStack Table: click column header to sort, type to search, dropdown to filter |
| Form errors only shown after server rejects | Zod validation catches errors instantly in the browser before submission |
| 4 separate `useState` for each form field | One `useForm()` manages all fields, errors, and submission state |
| Inline row editing (complex two-state toggle) | Dialog popup: clean form in a modal, no page layout shift |
| No pagination (all items on one page) | 10 items per page with prev/next navigation |

**Why this step completes Phase 2:**

Phase 2 had three tracks: Frontend (Step 1-8), Backend (Step 9-11), Admin (Step 12-13). With Step 13 done, every component in the project now uses modern libraries instead of hand-rolled solutions. The old standalone `admin/` directory can be deleted, and we tag v0.2.0 to mark this milestone.
