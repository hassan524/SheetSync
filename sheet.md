# SheetSync Sheet Flow

This document explains how the sheet editor works, where the main code lives, and how rows, columns, panels, hooks, persistence, and activity are connected.

## Latest Realtime And Permission Work

- Organization sheet sharing is owner-only in the sheet title bar, collaborators panel, organization header, organization table action menu, and invite/share-link API routes.
- Editors can edit sheets; viewers can see the sheet and controls but edit actions are blocked with a clear viewer-access message.
- Collaborators panel member management is owner-only. Owners can change a member between editor/viewer or remove them.
- Live tracking now sends pointer coordinates through Supabase presence and renders collaborator mouse cursors over the sheet.
- Collaborator selected cells are sent through presence too. Other users see the selected cell outlined and can hover it to see who selected it.
- Sheet data now uses a `sheet-collab:{sheetId}` Supabase channel. Cell edits broadcast the latest rows immediately to other open clients, and database realtime changes on `rows`, `columns`, `formulas`, `cell_formats`, `protected_rows`, and `sheets` still trigger a full snapshot refresh when Supabase table realtime is enabled.
- For realtime database updates to work in production, Supabase Realtime must be enabled for those tables and RLS policies must allow organization members to select the changed rows.

## Entry Points

- `src/app/sheet/[id]/page.tsx` loads the route for a single sheet.
- `src/components/individual/sheet/Sheet-client.tsx` is the main editor component. It owns the visible sheet experience and wires every hook, toolbar, dialog, panel, grid callback, and persistence action together.
- `src/app/sheet.css` contains global sheet styles for the grid, menus, popovers, mobile behavior, toolbar controls, and Radix dropdown portals.

## Data Loading Flow

1. `Sheet-client.tsx` reads the sheet id from the route.
2. It calls `loadSheet` from `src/lib/querys/sheet/sheet.ts`.
3. `loadSheet` loads:
   - sheet metadata from `sheets`
   - columns from `columns`
   - rows from `rows`
   - formats from `cell_formats`
   - formulas from `cell_formulas`
   - row locks from `protected_rows`
   - forks/snapshots where needed
4. The loaded values are normalized into `SheetState`, `ColumnDef[]`, and `SheetRow[]`.
5. `Sheet-client.tsx` seeds local history state for rows and columns.

## Main State Model

The editor uses `useSheetStateVars` from `src/hooks/sheets/use-sheet-state-vars.tsx`.

Important state values:

- `sheetState`: title, ownership, organization, role, rows, columns, starred state, and live tracking state.
- `selectedCell`: current `{ row, col }`.
- `selectedRows`: selected row ids.
- `activeCell`: current cell used for edit and file upload flows.
- `filterValue` and advanced filters.
- `rightPanel`: the currently open side panel.
- `saveStatus`: saved, saving, or error.
- `currentUser`: local user/member context.

Rows and columns also use `useHistory`:

- `rowsHistory` tracks undo/redo state for row changes.
- `columnsHistory` tracks undo/redo state for column changes.
- `Sheet-client.tsx` syncs `rowsHistory.currentState` and `columnsHistory.currentState` back into `sheetState`.

## Grid Rendering

The grid is `react-data-grid` inside `Sheet-client.tsx`.

The grid receives:

- `gridColumns`: generated from the active `columns`.
- `gridRows`: generated from filtered rows and hidden/frozen state.
- `topSummaryRows`: used for frozen top rows.
- `onRowsChange`: validates and persists edited rows.
- `onColumnResize`: updates column width.
- `rowHeight`: calculates wrapped/manual row heights.

Each data cell renders through `src/components/individual/sheet/CellRenderer.tsx`.

## Cell Editing And Types

Cell type comes from the column definition unless a row stores a per-cell override in `__cellTypes`.

Supported visible types include:

- `text`: free text input.
- `number`: numeric text input; decimals are preserved while typing.
- `currency`: numeric input rendered with `Intl.NumberFormat` and the column `currencyCode`.
- `date`: date input when editing.
- `checkbox`: boolean toggle.
- `select`: dropdown using `column.selectOptions` or cell-level select options.
- `status` and `priority`: preset dropdown-style badge values.
- `progress`: numeric input clamped to 0-100 for display.
- `image`: image upload/render flow.
- `url`: rendered as a link.

Currency columns support decimal values. During edit, the cell keeps valid decimal text such as `1.`, `1.25`, or `-4.50`; on display it formats through the column currency code.

## Formatting

Formatting is handled by `useSheetFormatting` and persisted through `cell_formats`.

Cell-level formatting supports:

- bold, italic, underline, strikethrough
- font size and font family
- text color and background color
- alignment
- wrapping
- borders

Column-level formatting is stored in `column.conditional_formatting.columnFormat` and is applied in `getEffectiveCellStyle`. It now includes font family, font size, bold, italic, color, and background. Conditional formatting rules are applied after normal and column formatting so matching rules can override visual styles.

Formatting from the toolbar applies to:

- the selected column when a whole column is selected
- every cell in a rectangular selection when a range is selected
- the active selected cell otherwise

## Column Header Menu

The column header menu lives in `src/components/individual/sheet/Column-header-menu.tsx`.

It controls:

- column rename
- type changes
- currency code changes for currency columns
- insert left/right
- duplicate
- sort
- fill numbers
- clear values
- column formula
- select options
- freeze/unfreeze
- validation panel opening
- delete column

On mobile, the column type submenu stays open after a type is selected so the user can keep working in the same menu position.

## Row Flow

Rows are managed through:

- `src/hooks/sheets/use-row-operations.ts`
- `src/hooks/sheets/use-sheet-row-ops.tsx`
- row handling inside `Sheet-client.tsx`

Main row actions:

- Insert row: `sheetRowOps.handleInsertRow`
- Delete row: `sheetRowOps.handleDeleteRow`
- Sort selected column: `sheetRowOps.handleSortByColumn`
- Update row data: `handleUpdateRow`
- Resize row: `beginRowResize`, `onRowResizeMove`, `endRowResize`
- Pin row: `handleTogglePinRow`
- Lock row editing: `toggleRowProtectionById`

Row edits are validated before save, pushed to row history, saved with `saveAllRows`, and logged for organization sheets.

## Column Flow

Columns are managed through:

- `src/hooks/sheets/use-column-operations.ts`
- `src/hooks/sheets/use-sheet-col-ops.tsx`
- `src/components/individual/sheet/Column-header-menu.tsx`

Main column actions:

- Insert column: `sheetColOps.handleInsertColumn`
- Insert left/right: `sheetColOps.insertColumnAt`
- Duplicate column: `sheetColOps.insertColumnAt` with duplicate mode
- Delete column: `sheetColOps.handleDeleteColumn`
- Rename column: `sheetColOps.handleRenameColumn`
- Change type: `sheetColOps.handleChangeColumnType`
- Resize column: `sheetColOps.handleColumnResize`
- Hide column: `sheetColOps.handleHideColumn`
- Freeze column position: `handleToggleFreezeColumn`
- Clear values: `sheetColOps.clearColumnValues`
- Select options: `handleApplySelectOptions`
- Validation rules: `handleApplyValidation`

Columns persist through `saveAllColumns` in `src/lib/querys/sheet/columns.ts`.

## Cell Types

Cell and column types are handled by:

- `src/hooks/sheets/use-cell-types.ts`
- `src/components/individual/sheet/Cell-type-selector.tsx`
- `src/components/individual/sheet/Cell-context-menu.tsx`

Column types are stored in `ColumnDef.type`.

Per-cell overrides are stored in row metadata keys:

- `ROW_CELL_TYPES_KEY`
- `ROW_CELL_SELECT_OPTIONS_KEY`

When a column becomes `select`, the select options panel opens so the dropdown values can be configured.

## Validation Rules

Validation is configured from `src/components/individual/sheet/panels/Data-validation-panel.tsx`.

Rules are saved through `handleApplyValidation` in `Sheet-client.tsx`.

Supported validation types:

- Dropdown list: `{ type: "dropdown", options: string[] }`
- Number range: `{ type: "number", min?: number, max?: number }`

Validation behavior:

- Rules are saved on the target column as `column.validation_rules`.
- Existing invalid values are cleaned when a rule is saved.
- Future edits are checked by `validateRows`.
- Invalid dropdown values are rejected.
- Number validation rejects non-numbers and clamps saved existing values to min/max when the rule is first applied.

## Automation Rules

Automation currently runs local built-in rules from `runAutomationsForRow` in `Sheet-client.tsx`.

The panel is `src/components/individual/sheet/panels/Automation-panel.tsx`.

Current rules:

- Archive completed rows: finds a status-like column by type/name/key and changes Done, Completed, or Finished to Archived.
- Mark overdue reminders: finds a due-date-like column and marks `_reminderSent` when the date is in the past.

Automation runs:

- after `handleUpdateRow`
- manually from the Automation panel for the selected row

## Freeze vs Lock

Freeze and lock are different.

- Freeze top row: keeps the top row visible while scrolling. It does not block editing.
- Freeze column position: keeps a column visually pinned.
- Lock row: prevents edits to the selected row.
- Lock cell: prevents edits to a specific cell.

Row and cell locks are handled by `src/hooks/sheets/use-protected-cells.ts` and persisted through `src/lib/querys/sheet/protection.ts`.

## Formatting Flow

Formatting is handled by:

- `src/hooks/sheets/use-sheet-formatting.ts`
- `src/components/individual/sheet/Formatting-toolbar.tsx`
- `src/components/individual/sheet/toolbars/FormattingBar.tsx`

Cell formatting persists with:

- `saveCellFormat`
- `saveAllCellFormats`

Supported formatting includes bold, italic, underline, strike, font size, colors, alignment, wrapping, and borders.

## Text Wrap Flow

Text wrap is handled by `src/hooks/sheets/use-text-wrap.ts`.

Text wrap can be toggled for a selected cell or column. `Sheet-client.tsx` uses wrapped content to calculate row height.

## Formula Flow

Formulas are handled by `src/hooks/sheets/use-formulas.ts`.

Formula entry points:

- Formula bar: `src/components/individual/sheet/toolbars/FormulaBar.tsx`
- Formula dialog: `src/components/individual/sheet/dialogs/Formula-dialog.tsx`
- Column formulas from `Column-header-menu.tsx`

Persistence:

- `saveFormula`
- `deleteFormula`
- `saveColumnFormula`
- `deleteColumnFormula`

Formula values are evaluated during cell render when a formula starts with `=`.

## Clipboard Flow

Clipboard behavior is handled by `src/hooks/sheets/use-clipboard.ts`.

Supported operations:

- copy
- cut
- paste single cell
- paste range

Paste checks row protection and validation before persisting.

## Charts Flow

Charts are handled by:

- `src/hooks/sheets/use-charts.ts`
- `src/components/individual/sheet/Charts-picker.tsx`
- `src/components/individual/sheet/Charts-widget.tsx`
- `src/components/individual/sheet/panels/Charts-panel.tsx`

Charts are stored on the sheet through `updateSheetCharts`.

The chart picker inserts a chart. The chart widget renders and supports select, move, resize, minimize, edit, and remove.

## Right Panel Flow

The side panel shell is `src/components/individual/sheet/Right-panel.tsx`.

Panel types:

- comments
- collaborators
- developer
- timetravel
- charts
- shortcuts
- conditional
- columns
- select-options
- row-details
- validation
- automation
- aiassistant

`Right-panel.tsx` owns the shared panel header. Individual panels should avoid repeating the same title at the top.

## AI Assistant Panel

The AI panel is currently a disabled chat-style UI in `src/components/individual/sheet/panels/Ai-assistant-panel.tsx`.

It shows a coming-soon assistant message and a disabled chat input. No backend AI call is made.

## Comments Flow

Comments are shown through:

- `src/components/individual/sheet/panels/Comments-panel.tsx`
- `src/lib/querys/sheet/firebase-realtime.ts`

Main functions:

- `addComment`
- `resolveComment`
- realtime comment subscription in `Sheet-client.tsx`

Comments can be cell-specific or row-specific.

## Collaborators and Presence

Organization sheet collaboration uses:

- `src/components/individual/sheet/panels/Collaborators-panel.tsx`
- `src/lib/querys/organization/get-sheet-members.ts`
- `src/lib/querys/organization/track-active.ts`
- Firebase realtime cursor tracking in `src/lib/querys/sheet/firebase-realtime.ts`

Collaborator cursors are rendered with `CollabCursor` from `sheet-ui-helpers.tsx`.

## Time Travel

Time travel is handled by:

- `src/hooks/use-time-travel.ts`
- `src/components/individual/sheet/panels/TimeTravel-panel.tsx`
- `src/lib/querys/sheet/snapshots.ts`

It supports snapshots, replay, restore, and fork-oriented flows.

## Conditional Formatting

Conditional formatting is handled by:

- `src/components/individual/sheet/panels/Conditional-formatting-panel.tsx`
- `handleSaveConditionalRule`
- `handleDeleteConditionalRule`
- `getEffectiveCellStyle`

Rules are stored on columns under `conditional_formatting.rules`.

## Import and Export

Import:

- `src/app/import/page.tsx`
- `src/components/import/Import-dropzone.tsx`
- `src/lib/import-sheet.ts`

Export:

- `src/lib/querys/export.ts`
- export actions are triggered from sheet toolbars/panels.

## Persistence Modules

Sheet persistence lives under `src/lib/querys/sheet`.

Important files:

- `sheet.ts`: load sheet, update sheet metadata, update charts, update row heights.
- `rows.ts`: save row, save all rows, delete rows.
- `columns.ts`: save all columns, update column type, delete column.
- `format.ts`: save cell formatting.
- `formulas.ts`: save and delete formulas.
- `protection.ts`: protect and unprotect rows.
- `firebase-realtime.ts`: comments, history, and cursor realtime helpers.
- `snapshots.ts`: time travel snapshots.

## Activity Logging

Activity is logged through:

- `src/lib/querys/activity/activity.ts`
- `logActivity`
- Firebase helpers such as `logRowAdd`, `logRowDelete`, `logColAdd`, `logColDelete`, and `logColumnRename`

Organization sheets log more collaborative activity than personal sheets.

## Toolbar Map

Toolbar components:

- `TitleBar.tsx`: sheet title, navigation, file-level actions.
- `ActionBar.tsx`: row/column actions, filters, chart, panel toggles, freeze, lock, pin.
- `FormulaBar.tsx`: formula entry and selected cell display.
- `FormattingBar.tsx`: formatting controls.
- `FilterBar.tsx`: filters and saved filter views.
- `StatusBar.tsx`: counts, selected cell status, chart count, and shortcut access.

## Dialog Map

Dialogs:

- `Share-dialog.tsx`
- `Select-options-dialog.tsx`
- `Keyboard-shortcuts-dialog.tsx`
- `Formula-dialog.tsx`
- `Chart-builder-dialog.tsx`

## Common Debug Checklist

If row edits do not save:

1. Check `handleRowsChange`.
2. Check `validateRows`.
3. Check row protection through `protection.isRowProtected`.
4. Check `saveAllRows`.

If column changes do not save:

1. Check `sheetColOps.persistColumns`.
2. Check `saveAllColumns`.
3. Check whether `columnsHistory.currentState` is up to date.

If dropdown menus flicker:

1. Check `Column-header-menu.tsx`.
2. Check Radix submenu portal styles in `src/app/sheet.css`.
3. Check whether the parent menu is scrollable and stealing focus.

If validation does not apply:

1. Confirm `focusedColumnKey` is set.
2. Confirm `DataValidationPanel` calls `onSave`.
3. Confirm `handleApplyValidation` writes `validation_rules`.
4. Confirm `validateRows` sees the latest columns.

If automation does not apply:

1. Confirm a row is selected for manual run.
2. Confirm a status-like or due-date-like column exists.
3. Confirm `handleUpdateRow` completes.
4. Confirm `runAutomationsForRow` receives the updated row.
