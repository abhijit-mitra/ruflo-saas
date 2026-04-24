# Parspec BOM Detail — Clone Specification (CLONE_SPEC.md)

> A single, implementation-ready specification for cloning the Parspec **BOM detail workspace** at `/v2/project/:projectId/bom/:bomId` — covering all seven sub-tabs and every observable interaction.

## 1. Tech Stack (Recommended)

- **Frontend:** React + TypeScript, Vite, React Router v6
- **State:** Zustand (or Redux Toolkit) for BOM editor, React Query for server state
- **Data grid:** AG Grid Enterprise (mandatory — the app uses AG Grid features: row groups, column pinning, column filters with funnel icons, "Drag here to set row groups", drag row reorder, inline editing, pivoting)
- **UI kit:** MUI (Material UI) or shadcn/ui — matches the visual language (outlined buttons, orange primary CTAs, pill badges)
- **Forms:** React Hook Form + Zod
- **File uploads:** react-dropzone
- **PDF/Document preview:** PDF.js
- **Backend:** Node/Express or NestJS, PostgreSQL, S3 for documents, Redis for jobs
- **Auth:** JWT + optional SSO/MFA

## 2. Routing

```
/v2/project/:projectId/bom/:bomId?tab=<tabKey>[&subpage=<sub>][&expandedTab=<panel>]

tabKey ∈ {
  specification,
  pricingAndLeadtime,
  submittalsAndOM,
  documents,
  orderManagement,
  orderFulfillment,
  financials
}
expandedTab (Pricing) ∈ { lots, services, freight, taxes }
subpage (Documents) ∈ { quotes, customerPOs, submittals, vendorPOs, sOA, changeOrders, invoices, omPackages, creditsAndReturns, creditMemos }
subpage (Financials) ∈ { vendor-summary, orders, vendor-invoices, customer-billings }
```

All sub-tabs are URL-synced so back/forward and deep links work.

## 3. Shared Header (all tabs)

A fixed top bar consisting of:

1. **Project/building icon button** — navigates to the parent Project Detail page (`/v2/project/:projectId`). On hover shows tooltip with project name.
2. **BOM pill tabs** — each open BOM shows as a pill containing: status badge (green "Won" etc.), star icon if it is the primary BOM, BOM name (top line), primary-customer name (second line), and a 3-dot menu. 3-dot menu items: **Duplicate, Close Tab, Close All Tabs, Delete** (delete is red/destructive).
3. **`+` button** after the pills to add another BOM tab.
4. **Undo / Redo** icon buttons (right side).
5. **Manage BOMs** outlined button (opens the Create BOM modal in management mode).
6. **Context action** (right-most, orange primary) — changes per tab:
   - Specification: none
   - Pricing & Lead Time: `Create Quote(s)` + kebab
   - Submittals & O&M: `Create Document ▾` (menu: Create Submittal, Create O&M)
   - Documents: none
   - Order Management: `Create ▾` (menu: Purchase & ERP Sales Order(s), Change Order(s), Credit(s) & Return(s))
   - Order Fulfillment: `Create ▾` (same submenu)
   - Financials: none

Below the header sits the **tab bar** with seven pinned/reorderable tabs. A chevron button opens a **Tabs panel** where each entry has a drag handle and pin toggle — exact tabs: Specification, Pricing & Lead Time, Submittals & O&M, Documents, Order Management, Order Fulfillment, Financials.

An MFA nag modal ("Let's Secure Your Account") may appear once per session with `Don't ask again` checkbox, `Skip`, `Set up MFA` buttons.

---

## 4. Tab 1 — Specification

### 4.1 Layout

Two collapsible sections: **Products** and **Options** (chevron toggles). Each has the same grid and toolbar.

### 4.2 Top-right actions

- 3-dot menu → `Export ▸ (Job Management, CSV, Excel, Agile XML, Send To Order System)` · `Sort by ▸ (Type A-Z, Type Z-A, Manufacturer A-Z, Manufacturer Z-A)` · `Manage Columns` · `Create Options Table` (disabled unless applicable).
- `Finder` (AI) button — opens Product Finder drawer.
- `Import Products` split button with kebab → `List of Products (Schedule, Quote, etc.)`, `Existing Submittal Package and Datasheets`, `Existing Parspec BOM`.

### 4.3 Table toolbar (left-to-right)

Search, **Create Section**, **Create Kit**, **Bulk Edit** (requires selection), **Change Section**, **Highlight**, **Hide**, **Duplicate**, **Delete**. When items are selected a `N product(s) selected ✕` badge appears.

### 4.4 Grid

- Row features: drag handle (⋮⋮), checkbox, lock icon 🔒 on protected rows.
- Inline edit on every editable cell (Qty, Manufacturer, etc.).
- Expandable section rows (e.g., "new s" parent with aggregated Qty).
- Column header features: sort, funnel filter, resize, reorder, pin.
- A magnifier search icon appears in each row on the right (open product detail).

### 4.5 Row 3-dot menu

`Add Product Below (Ctrl+I)` · `Add Option` · `Move to kit` · `Change Section` · `Highlight` · `Hide` · `Duplicate` · `Delete`.

### 4.6 Manage Columns (Specification)

Fixed columns (not toggleable): Type, Qty, Manufacturer, Model Number, Product Finder.  
Toggleable: Pricing History, Specification, Description, Product To Replace, Stock Location, ERP ID, Product ERP ID.

### 4.7 Footer counters

`N MANUFACTURER(S)` · `N PRODUCTS` · `N HIDDEN`.

---

## 5. Tab 2 — Pricing & Lead Time

### 5.1 Layout extras

- **Warning(s)** toggle in header (on = show rows with validation warnings).
- **Pricing Updates** outlined button — opens modal listing rows whose `Product ERP ID` matches a product with a newer cost/sell. Columns: Model Number, Qty, Current Cost, Latest Cost, Ext. Cost Delta, Current Sell, Latest Sell. Footer: "Updated Grand Total $N". Buttons: Cancel, Confirm.
- **Create Quote(s)** primary — if warnings exist, shows a dialog "Warnings detected in this BOM" with `Create Quote(s)` / `Review Warnings` options. Proceeding opens the **Customize Quote(s)** full-screen wizard.

### 5.2 Customize Quote(s) wizard

Tabs across the top = one per BOM. Left panel: `Select Template`, `Language`, `Pin`, `Reorder list`, a 3-dot menu, and expandable sections each with on/off toggle: **Header & Footer, Cover Page, Pricing & Lead Time, General Terms & Conditions, Manufacturer Terms & Conditions, Attachments**. Right panel: live PDF preview. Footer: Cancel / Next.

### 5.3 Bottom stack panels (horizontally scrollable)

Four collapsible edit panels, each with its own table:

**LOTS** — +, edit, delete. Cols: Lot Name, Products, Cost, Discount (%), Discounted Cost, Margin (%), Sell Price.  
**SERVICES** — +, add-alt, delete. Cols: Services Name, Description, Provider, Sell Calculation Method.  
**FREIGHT** — +, hide-all, delete. Cols: Freight Name, Freight Entity, Apply To, Calculation Method, Magnitude, Amount.  
**TAXES** — +, delete. Cols: Taxes Name, Apply To, Magnitude, Amount.

Summary bar shows: `EXT. COST · EXT. DIS. COST · MARGIN% · EXT. SELL · TOTAL`.

### 5.4 3-dot → BOM Settings submenu

`Inventory Settings`, `Rounding & Decimal Display`, `Warning Settings` (each opens its own modal).

### 5.5 Manage Columns (Pricing & Lead Time)

Fixed: Type, Qty, Manufacturer, Model Number, Product Finder.  
Toggleable: Stock Location, Quote Notes, Internal Comments, Specification, Product To Replace, Lot, Pricing History, Cost Per Selling UOM, Selling UOM, Selling UOM Conversion Factor, Discount(%), Discounted Cost, Margin(%), Sell Price, Ext. Sell Price, Ext. Discounted Cost, Ext. Cost, Add/Deduct Amount, Lead Time Value, Lead Time Unit, Source Quotes Number, Sell Price + Freight, Ext. Sell Price + Freight, Description, Stock Location ERP ID, Product ERP ID.

---

## 6. Tab 3 — Submittals & O&M

### 6.1 Header actions

`Add / Reuse Document` outlined, `Auto-Select` outlined, gear icon (Settings — requires selection), `Create Document ▾` primary with items **Create Submittal, Create O&M**.

### 6.2 Toolbar

Search · Create Section · Create Kit · Bulk Edit · Change Section · Highlight · Hide · Duplicate · Delete (same mechanics as Specification, some icons greyed until selection).

### 6.3 Manage Columns

Fixed: Type, Qty, Manufacturer, Model Number.  
Toggleable: Notes, Datasheet, Installation Guide, Drawing, Warranty, Other Document, Description.

### 6.4 Row cells

Document cells show an **Add** link when empty, replaced with a mini file chip + checkbox when populated.

### 6.5 Footer summary

`N of N DATASHEETS SELECTED · INSTAL. GUIDES SELECTED · DRAWINGS SELECTED · WRTY. SELECTED · ADD. DOCS SELECTED`.

---

## 7. Tab 4 — Documents

Page shows a **Document Type list** (no header actions). Each row is a category with an icon, name, count: **Quotes, Customer POs, Submittals, Vendor Purchase Orders, Sales Order Acknowledgement, Change Orders, Invoices, O&M Packages, Credits and Returns, Credit Memos**.

Clicking a category opens a **sub-page**:

- Back arrow, title with ▾ picker (lets you switch category).
- Orange warning banner if any doc is out of sync, with `Create New Version` link.
- Toolbar: Search, 3-dot, `Download All`, `Manage Shareable Link <Active/Inactive>`, `Create New` (orange).
- Grid columns (example — Quotes): Quote Number, Status (Won pill + sync icon), Version Status (`Latest Version` pill), Version, Project, Created By, Products Included, Grand Total, Version Notes (pencil-editable), Enable Share (toggle `Shared`), row 3-dot menu.

---

## 8. Tab 5 — Order Management

### 8.1 Toolbar

- Search, grouping icon, edit pencil, collapse-all chevron.
- Filter funnel with chip `Not in PO ▾` + `Clear`. Dropdown "Quick Filters" contains pinnable reorderable items: **Submittal Approved, Not in PO, Reserve, HFR, Released, Not Released, Bill & Hold** (and a few more — all pinnable with drag handle).
- `Inbox N` dropdown (right side) — opens a panel with inner search, a sub-filter `Invoices ▾`, section **Pending Orders** listing items like `R-1 – Returns of $0.00` each with an `Open` button.
- Main 3-dot menu (topmost right): standard Export/Sort/Manage Columns.

### 8.2 Grid

Grouped by Customer PO. Each group header shows: `Customer PO Number ▾` (editable), SO Number, PO Number (or `+ Create PO`), Margin(%).  
Row columns: Section, Manufacturer, Model Number, Description, Submittal Status (dropdown per row), row 3-dot menu.

### 8.3 Bottom summary bar (shared with Pricing)

Shows LOTS/SERVICES/FREIGHT/TAXES chips plus `TOTAL SELL · CUST. PO · AMT. BILLED · %` etc.

---

## 9. Tab 6 — Order Fulfillment

### 9.1 Toolbar

Search, edit pencil, link/shuffle icon, filter funnel with chip `Past Due ▾`. Quick Filters panel contains pinnable items: **Past Due, At Risk, Missing ESD, Missed ESD, Missing ASD, Bill & Hold, Released, Not Released, On Site** (scrollable list).

### 9.2 3-dot menu

Only `Export ▸ (CSV, Excel)` — no Manage Columns (columns are fixed).

### 9.3 Grid

Rows are grouped by PO (group label e.g. `Missing PO` or `PO-ERP-xxxx` with aggregate Qty shown on the group row). Columns: Type, Manufacturer, Model Number, Qty, Fulfillment Status, Bill & Hold, Branch. Row 3-dot for actions like receive/edit ESD, etc.

---

## 10. Tab 7 — Financials

Landing page titled **Project Summary** with four category cards: **Vendor Summary · Orders · Vendor Invoices · Customer Billings**. Clicking any opens a sub-page.

### 10.1 Vendor Summary

- Title has ▾ picker showing the four Financials sections with counts.
- Toolbar: Back, title-picker, Search, filter chip `Outstanding ▾`.
- Expandable rows by vendor. Columns: Name, Ext. Sell, Ext. Cost, Margin, Net A/P, Freight, A/P Invoiced, Net A/R, A/R Freight, A/R Billed, Net Margin, % Complete, Remaining Sell, Remaining Cost.

### 10.2 Orders

- Filter chip `Purchase Orders ▾` with Quick Filters: **Purchase Orders, Change Orders, Sales Orders**.
- Columns: Date, Vendor, Transaction Type (Purchase Order / Change Order / Vendor Change… / Sales Order), Description (Hold For Release / Reserved / Internal Rework), Order Number, Customer PO, Cost Amount, Cost Balance, Sell Amount, Sell Balance, Margin.

### 10.3 Vendor Invoices / Customer Billings

Same layout pattern — filter chip + tabular grid of documents.

---

## 11. Cross-cutting Grid Behaviors (apply to every table above)

- **Column header:** sort (tri-state), funnel filter menu, drag to reorder, drag edge to resize, pin left/right via context menu.
- **Manage Columns modal:** "Choose the columns to display" · search box · drag handles · per-column checkbox · Cancel / Confirm · locked (greyed) checkboxes for required columns.
- **Row drag handle** to reorder.
- **Sticky header** and sticky footer summary where applicable.
- **AG Grid row-group drop zones** visible when empty ("Drag here to set row groups", "Drag here to set column labels").
- **Pagination** where lists exceed one page: `X to Y of Z · Page N of M`.
- **Keyboard:** Ctrl/Cmd+I to insert row below, arrow navigation, Tab to next editable cell.
- **Undo / Redo** are global per BOM and update the header buttons' enabled state.

## 12. Design Tokens (minimum)

- **Primary action:** orange (`#F07F3C` range). Destructive: red (`#E24C4C` range). Success pill: green (`#D6F3E1` bg / dark green text). Warning pill: amber. Info pill: indigo.
- **Status pills:** rounded-full, 12px font, subtle bg, bold text.
- **Sidebar:** dark navy (`#10161F`), orange active-state.
- **Card / modal:** white bg, `border-radius: 8–12px`, soft shadow.
- **Data-grid cell heights:** ~36–40px, alternating selection/hover states.

## 13. Core Entities (data model)

```ts
Project { id, name, erpId, crmId, address, stakeholders[], image }
Opportunity { id, projectId, name, scopes[], quoter, projectManager, stage, priority, estimatedValue, quoteDueDate, submittalDueDate }
BOM { id, projectId, opportunityId, name, primary, starred, status, customerPrimary, customerSecondary, outsideSales, branchLocation }
Product (row) { id, bomId, sectionId?, type, qty, manufacturerId, modelNumber, specification, description,
  pricing: { costPerUom, uom, conversionFactor, discountPct, discountedCost, marginPct, sellPrice, extSellPrice, extCost, addDeductAmount, leadTimeValue, leadTimeUnit, sourceQuoteNumber },
  submittal: { notes, datasheetId, installGuideId, drawingId, warrantyId, otherDocIds[] },
  flags: { highlighted, hidden, locked }, productErpId, stockLocationId, pricingHistory[] }
Section { id, bomId, name }
Kit { id, bomId, name, productIds[] }
Lot { id, bomId, name, productIds[], cost, discountPct, discountedCost, marginPct, sellPrice }
Service { id, bomId, name, description, provider, sellCalculationMethod, amount }
Freight { id, bomId, name, entity, applyTo, calcMethod, magnitude, amount }
Tax { id, bomId, name, applyTo, magnitude, amount }
Order { id, projectId, bomId, type: 'PO'|'CO'|'SO'|'VendorChange', vendorId, customerPoNumber, poErpId, soNumber, description, costAmount, costBalance, sellAmount, sellBalance, marginPct, date }
Document { id, bomId, category, version, status, grandTotal, productsIncluded, createdBy, createdAt, versionNotes, shareEnabled, shareLink, fileUrl }
Warning { id, bomId, productId?, type, message, resolved }
```

## 14. Suggested Build Order

1. **Shell + routing** (shared header, tab bar, tab pin/reorder panel, +BOM, undo/redo stubs).
2. **Specification tab** (AG Grid, Products + Options sections, Manage Columns, row/drag/lock/hide/highlight, row menu, Import dropdown, Finder placeholder).
3. **Pricing & Lead Time tab** (extra columns, warnings toggle, Pricing Updates modal, LOTS/SERVICES/FREIGHT/TAXES panels, summary bar, BOM Settings modals, Customize Quote wizard).
4. **Submittals & O&M tab** (document cell editing, Create Document menu, Auto-Select, footer counters).
5. **Documents tab** (category landing, sub-pages, shareable links, version warnings, Create New Version flow).
6. **Order Management tab** (PO groupings, inline Customer PO editing, Quick Filters, Inbox panel).
7. **Order Fulfillment tab** (group by PO, Quick Filters list, fulfillment status).
8. **Financials tab** (Project Summary landing and the four sub-reports, expandable vendor rows).
9. **Global features** — MFA modal, network-level undo/redo with optimistic mutation, export jobs (CSV/Excel/Agile XML/Job Management), sharable-link generator.

## 15. Acceptance Checklist (per tab)

For each tab verify: route works, header actions render, toolbar icons show tooltips matching those above, Manage Columns lists the exact columns above, row menu matches the spec, footer summary renders, keyboard shortcuts work, URL params `tab=`, `subpage=`, `expandedTab=` round-trip cleanly, and MFA modal can be dismissed once.
