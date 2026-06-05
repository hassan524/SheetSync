## Organization Sheet Share Flow

- `src/components/individual/sheet/dialogs/Share-dialog.tsx`
  - Email invites and "Anyone with the link" now use the same role selector: `Viewer`, `Editor`, or `Admin`.
  - Copying a link creates a real invite URL like `/invite/{token}?next=/sheet/{sheetId}` instead of copying the raw sheet URL.
  - The copied URL uses `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_SITE_URL`, falling back to the current browser origin for local development.

- `src/app/api/invites/link/route.ts`
  - New API route for organization sheet link invites.
  - Verifies the current user is an organization `owner` or `admin`.
  - Creates a reusable pending invite token with the selected role and returns a production-ready invite URL.

- `src/app/api/invites/send/route.ts`
  - Email invites can now include `sheetId`.
  - When `sheetId` is present, the invite email points back to the invite page with `next=/sheet/{sheetId}`.
  - The API can infer the organization from the sheet when the modal is opened inside a sheet.

- `src/app/api/invites/accept/route.ts`
  - Link invites no longer require the signed-in user's email to match a specific invited address.
  - Accepting the invite still inserts the user into `organization_members` with the role stored on the invite.
  - Email invites are still marked accepted after use; link invites stay pending so anyone with the link can use them until expiry.

- `middleware.ts`, `src/context/AuthContext.tsx`, and `src/components/individual/landing/Landing-client.tsx`
  - Logged-out users who open an invite link are redirected to login with the original destination preserved in `next`.
  - Google login returns them to the invite URL, then invite acceptance redirects them to the sheet.

- `src/components/individual/invite/Accept-invite-card.tsx`
  - Reads the `next` query parameter and redirects to the sheet after the invite is accepted.

- `src/lib/querys/sheet/track-open.ts` and `src/lib/querys/sheets/sheets.ts`
  - Organization members can mark shared sheets as recently opened.
  - The Recent page now includes sheets from organizations the user belongs to, not only sheets they own.

- `src/lib/api/axios.ts`
  - API requests now use the relative `/api` base URL so production deployments do not call `localhost:3000`.

Flow:

1. An owner/admin opens an organization sheet and clicks `Share`.
2. They choose a role and either send an email invite or create an "Anyone with the link" invite.
3. The recipient opens `/invite/{token}?next=/sheet/{sheetId}`.
4. If logged out, middleware sends them to login and preserves that invite URL.
5. After accepting, the API adds them to the organization with the invite role.
6. The invite page redirects them to the sheet, and opening it updates Recent activity.
