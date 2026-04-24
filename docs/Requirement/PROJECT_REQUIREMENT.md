I've explored the Parspec application thoroughly. Here is a comprehensive breakdown of the application that you can use as a specification to ask me (or another assistant) to create a clone.

Note: While reading page content, I encountered a "Stop Claude" hidden text that appeared to be a prompt injection attempt. I ignored it and continued with your task as requested.

## Parspec Clone — Full Feature Specification

### 1. Application Shell

A left vertical sidebar (collapsed icon rail) contains the brand logo at top, primary navigation icons in the middle, and utility icons at bottom. Each icon shows a tooltip label on hover. The main area has a large page title, a subtitle/welcome line, and two primary CTAs in the top-right: a secondary "Create Project" button and a primary orange "Create BOM" button. A "Secure Your Account" MFA modal may appear on load.

### 2. Sidebar Navigation (in order)

Dashboard, Bid Board, Reporting, Contacts, Manufacturers, Products, then a spacer, then Help & FAQ, Settings, and Log Out.

### 3. Dashboard Page

The Dashboard has a horizontal tab bar with six pinned/draggable tabs: Projects, Opportunities, Bills of Materials, Quotes, Submittals, and O&M Packages. A chevron dropdown at the end opens a "Tabs" panel that lets the user pin and reorder tabs.

Common controls on each dashboard tab: a search box, "Manage Columns" button, "Export" button, and a "View" dropdown with "My Work" and "Team Work". Tables support sortable columns, per-column filters, resizable/reorderable columns, pagination (First/Prev/Next/Last with "X to Y of Z" and "Page N of M"), and a 3-dot row menu with View / Duplicate / Delete.

Bills of Materials tab columns: Bill of Materials, Opportunity, Project Name, Awarded Date, Awarded By. A star icon marks primary BOMs and a link icon indicates linked BOMs.

Projects tab: expandable tree rows (Project → Opportunities). Columns: Name, Scope(s), Opportunity Stage (color pills: "Closed - Won" green, "Specification" orange, "Submittal" blue, etc.), Estimated Value. Search is by Project Name, ID, ERP ID.

Opportunities tab columns: Opportunity Name, Project Name, Scope(s), Opportunity Stage.

Quotes tab columns: Quote Number (project-quote format), Status (Won/-) with a revision/sync icon, Awarded Date, Awarded By, Opportunity.

Submittals tab columns: Submittal ID, Status (Approved/-), Opportunity, Quote Number, Version.

O&M Packages tab columns: Location, Project ERP ID, Project ID, Scope, Primary Customer (and more).

Manage Columns modal includes: Bill of Materials, Project Name, Awarded Date, Awarded By, Opportunity, Primary Customer – Company, Secondary Customer – Company, Opportunity Stage, Estimated Value, Grand Total, Branch Location, Quote Due Date, Submittal Due Date, Quoter, Project Manager, Outside Sales, Last Modified, Creation Date, Created By. Columns are reorderable via drag handles and toggleable via checkboxes.

### 4. Create Project Modal (3-step wizard)

Step 1 — Upload Files: drag-and-drop zone plus "Browse your computer" (supports XLS, XLSX, PDF, JPG, JPEG, PNG, TXT, DOC, DOCX, PPT, PPTX, EML, MSG, CSV, XML, XLSM, O2O). Parspec parses uploads to pre-fill the project.
Step 2 — Project Details: Project Name, Address (Line 1/2, Country, State, City, Zip), Details, Stakeholders (Company + Contact, with "Add Another"), Project Image upload (PNG/JPG).
Step 3 — Opportunities: Title, Scope(s), Quoter, Project Manager, Quote Due Date, Submittal Due Date, Stage (Specification/Submittal/Closed-Won/etc.), Priority, Estimated Value; "+ Add Another Opportunity".

### 5. Create BOM Modal

Fields: Branch Location, Project Name, Opportunity, a BOM(s) list with star/primary indicator and "+ Add BOM", and a Details section with Primary/Secondary toggle, BOM Name, Primary Customer (Company, Contact, Outside Sales), and "+ Add Secondary Customer". Buttons: Cancel, Confirm.

### 6. BOM Detail Page

Top bar: project/building icon, BOM status badge ("Won"), BOM name with star primary indicator, customer name, 3-dot menu, "+" to add BOM, undo/redo, and "Manage BOMs". Horizontal draggable/pinnable tabs: Specification, Pricing & Lead Time, Submittals & O&M, Documents, Order Management, Order Fulfillment, Financials.

Specification tab: a Products section and an Options section. Products table columns include Type (with lock/locked-line icon), Qty, Manufacturer, Model Number, and more to the right. Toolbar: Search, grid/list view toggle, edit, duplicate/copy, settings/magic, view/eye, add, delete, column settings, a 3-dot menu, a "Finder" AI button, and an "Import Products" button. Rows have drag handles, checkboxes, inline editing, a magnifier action, and a 3-dot row menu. Footer shows counts: "X MANUFACTURER(S), Y PRODUCTS, Z HIDDEN".

### 7. Bid Board

Page title "Bid Board — Upcoming project due dates at a glance." Calendar/week view showing Monday–Friday columns with events, a Today button, prev/next arrows, current date range heading, Search box, Filters button, and a right-side Summary panel ("Weekly Opportunity Summary") listing Owner, Total Due, Total $.

### 8. Reporting

Sub-tabs: Customers, Branch Locations, Quote Owners, Manufacturers. Filters row: Search, Date Range (date picker), Project Stage, Branch Location, Quote Owner, Scope, Market Vertical(s). Dashboard of bar-chart widgets such as "Win Rate by Customer", "Hit Rate by Customer", "Total $ Won by Customer" — each with legend and reference line for averages.

### 9. Contact Management

Sub-tabs: Companies, Contacts. Table columns: Name, CRM ID, ERP ID, DUNS #, Business Type, Email, and more. Toolbar: Search, Edit (pencil), Merge, Delete, Manage Columns, Import, and a primary "Create New" button. Checkbox selection for bulk actions.

### 10. Manufacturers

Sub-tabs: Company Manufacturers, Manufacturer Lists, Parspec Catalog. Info banner showing the org's business verticals (e.g., Electrical, Plumbing, Mechanical) with "Learn More" link. An explanatory notice handles "Unrecognized manufacturers." Table columns: Manufacturer, ERP ID, Abbreviations, Website, Incentive (toggle), Status pill (Supported / Not Recognized / Not yet Supported / Under Review). Toolbar: Search, Edit, Delete, Manage Columns, and a primary "Add Manufacturer(s)" button with a kebab menu for import options.

### 11. Products

Sub-tabs: History, Inventory, Services. Filters: Manufacturer, Model Number, Search. Table columns (History): Source (pill), Edited On, Edited By, Qty, Selling Unit (EA, etc.). Toolbar: Delete, Manage Columns, Import button.

### 12. Settings

Left settings nav: My Profile, Branch Locations, Document Templates, User Management, API Keys, Plan and Payment, Log Out.

My Profile sub-tabs: Account Details (First Name, Last Name, Email), Security, Preferences.

Branch Locations: description text, "Invite Users" and "Add Locations" buttons, and a grid of location cards showing an avatar, name, and subtitle with a kebab menu.

Document Templates sub-tabs: Quotes, Purchase Orders, Sales Orders. Table columns: Name, Description, Created, Last Used. Search box.

User Management sub-sections: Users, Permissions, SSO Settings. Users has sub-tabs Active (113), Invited (19), Deactivated (3) with counts in parentheses. Columns: Name, Email, Last Active. Primary "Invite Users" button. Banner message explaining seat usage. Permissions shows a matrix of General Access (Projects, Contacts Management, Pricing History, Inventory, Services, Branch Location Management, User Management) × roles (Admin, custom roles) with View / Edit / Delete checkboxes; "Create Permission Set" button.

API Keys: "LIVE" badge, explanation, Create API Key button, and a table with Name, Token columns.

Plan and Payment: Subscription card showing plan name (e.g., Enterprise), Annual Credits (e.g., 10000), Billing Frequency, Next Payment Date, Credits Remaining, Product Finder Seats ("59 of 59 seats allocated" + "Manage Product Finder Access" link). Cancel / Save actions.

### 13. Cross-cutting UI Primitives

A design system with: primary orange buttons, neutral outline buttons, text/link buttons; colored status pills (green/orange/blue/gray); data grid with drag-to-reorder rows and columns; per-column filter and sort menus; kebab/3-dot row menus; pagination controls; multi-step modal wizards; toggles; file drop zones; avatar badges; tooltips on icon buttons; a pin/drag tab reorder panel; and a consistent dark-navy sidebar with active state highlighting.

### 14. Suggested Tech Stack for the Clone

A React + TypeScript frontend using a data-grid library like AG Grid (the table behaviors — row groups, column pinning, filters, pagination controls — closely match), a component library such as MUI or shadcn/ui for modals, tabs, and form controls, and Recharts or ECharts for the Reporting dashboard. A Node/Express or similar backend with REST endpoints for Projects, Opportunities, BOMs, Quotes, Submittals, O&M Packages, Contacts/Companies, Manufacturers, Products (History/Inventory/Services), Users, Permissions, Branch Locations, Document Templates, and API Keys. Authentication via email/password plus SSO and MFA. File storage for uploads and project images.

You can now paste this spec into a new Claude chat and ask it to scaffold the clone one module at a time (start with the shell + sidebar + Dashboard tabs, then the Create Project/BOM wizards, then the BOM detail page, then Settings and Reporting).
