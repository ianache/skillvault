# Design Spec: Inline Category Selection and Update on SkillCard

**Date:** 2026-07-27  
**Status:** Approved  
**Author:** Antigravity  

---

## 1. Overview & Context

In SkillVault's main catalog, users browse skills organized by category. Currently, updating a skill's category is a manual, multi-step process that requires going to the edit page or administrative views. 

To improve efficiency, authorized users—specifically those with the **`editor`**, **`reviewer`**, or **`admin`** roles—should be able to change a skill's category directly from the catalog page.

This spec outlines:
1. Creating a secure backend endpoint `PUT /api/skills/[slug]/category` to update a published skill's type.
2. Updating `src/components/SkillCard.tsx` to detect authorized users, show a pencil edit icon on hover when the card is selected, and open an inline combobox (`select`) on click.
3. Propagating real-time state changes in `src/components/CatalogClient.tsx` so the grid updates instantly.

---

## 2. Detailed Architecture & Design

### 2.1 Backend Endpoint: `PUT /api/skills/[slug]/category`

A new Next.js App Router handler will be created at `src/app/api/skills/[slug]/category/route.ts`:

- **Method:** `PUT`
- **Request Body Schema:**
  ```json
  {
    "type": "string"
  }
  ```
- **Authorization Checks:**
  1. Retrieve the session using NextAuth's `auth()`.
  2. Map roles. Access is permitted if `session.user.roles` contains at least one of: `"admin"`, `"reviewer"`, `"editor"`.
  3. If unauthorized, return `401 Unauthorized`.
- **Validation:**
  - Verify that the target category slug exists in the database `categories` table.
  - Return `400 Bad Request` if the category is invalid or missing.
- **Database Operation:**
  - Update the `type` column in the `skills` table for the matching published skill:
    ```sql
    UPDATE skills SET type = ? WHERE slug = ? AND status = 'published'
    ```
- **Response:**
  - `200 OK` on success:
    ```json
    {
      "success": true,
      "type": "new-category-slug"
    }
    ```

### 2.2 UI Integration: `SkillCard.tsx`

We will modify `src/components/SkillCard.tsx` to add support for inline editing:

1. **Props Extension:**
   ```typescript
   interface Props {
     skill: SkillRow;
     selected: boolean;
     onClick: () => void;
     userRoles?: string[];
     categories?: Category[];
     onCategoryUpdate?: (slug: string, newType: string) => void;
   }
   ```
2. **Local State:**
   - `isEditingCategory`: `boolean`, defaults to `false`.
   - `isHoveredCategory`: `boolean`, defaults to `false`.
3. **Role Check:**
   - `const canEdit = selected && (userRoles?.includes("admin") || userRoles?.includes("reviewer") || userRoles?.includes("editor"));`
4. **Interactive Category Badge Render:**
   - When `isEditingCategory` is `false`:
     - Render the badge. If `canEdit` is true, add hover events to toggle `isHoveredCategory`.
     - When `isHoveredCategory` is true, show a small pencil icon (`✏️`) next to the category label.
     - On click of the badge or pencil icon:
       - Invoke `e.stopPropagation()` and `e.preventDefault()` to prevent deselecting the parent card.
       - Set `isEditingCategory(true)`.
   - When `isEditingCategory` is `true`:
     - Render a `<select>` drop-down containing options mapped from `categories`.
     - On click/mouse down of the select dropdown:
       - Invoke `e.stopPropagation()` to prevent event bubbling to the parent clickable card.
     - On `<select>` change:
       - Fetch `/api/skills/[slug]/category` via PUT.
       - Trigger `onCategoryUpdate?.(skill.slug, selectedValue)`.
       - Revert `isEditingCategory(false)`.
     - On `<select>` blur:
       - Revert `isEditingCategory(false)`.

### 2.3 Catalog Wiring: `CatalogClient.tsx` & `page.tsx`

1. **`src/app/page.tsx`:**
   - Pass `session?.user` into `<CatalogClient user={session?.user} ... />`.
2. **`src/components/CatalogClient.tsx`:**
   - Accept `user?: { roles: string[] } | null` in Props.
   - Implement `handleCategoryUpdate` to update the reactive `skills` and `selected` state on category change:
     ```typescript
     const handleCategoryUpdate = (slug: string, newType: string) => {
       setSkills(prev => prev.map(s => s.slug === slug ? { ...s, type: newType } : s));
       setSelected(prev => prev && prev.slug === slug ? { ...prev, type: newType } : prev);
     };
     ```
   - Pass `userRoles={user?.roles}`, `categories={categories}`, and `onCategoryUpdate={handleCategoryUpdate}` to `<SkillCard ... />`.

---

## 3. Verification & Testing Strategy

1. **API Integration Tests:**
   - Verify that non-authorized roles (e.g., pure `user`, `author`, or unauthenticated requests) receive `401 Unauthorized` on `PUT /api/skills/[slug]/category`.
   - Verify that an authorized role can successfully change a skill's category.
2. **UI Smoke Tests (`src/lib/review/ui-smoke.test.ts`):**
   - Add assertion verifying that the category badge in `SkillCard` handles propagation stop, displays the pencil icon when authorized, and triggers the PUT endpoint on change.
3. **Manual Verification:**
   - Log in with a user having the `admin`, `reviewer`, or `editor` role.
   - Select a card, hover over its category badge, click the pencil, and select a new category.
   - Verify the category badge color, label, and card grid update instantly.
