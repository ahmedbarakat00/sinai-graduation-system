# نظام إدارة مشاريع التخرج — جامعة سيناء

React + Vite frontend starter, Arabic RTL interface, with Supabase integration points.

## Requirements
- Node.js LTS
- npm
- Supabase project (free tier is sufficient for development within its limits)

## Run locally
```bash
npm install
npm run dev
```
Open the local URL shown by Vite.

## Supabase setup
1. Create a Supabase project.
2. Review `supabase/schema.sql` carefully before running it in SQL Editor.
3. Create `.env` in the project root by copying `.env.example`.
4. Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the project URL and publishable/anon key.
5. Never place a service-role key in frontend code or any `VITE_` variable.
6. Before real use, implement and test trusted RPC functions for project submission, accepting/rejecting reviews, reassignment, and closure. The current `submit_project` RPC call is a frontend integration point and the function is not yet included in the starter SQL.
7. Configure an admin profile through a trusted process; do not expose public admin or doctor registration.
8. Test RLS using separate student/doctor/admin sessions before deployment.

## Current implementation status
- Student form UI, team member fields and team-leader selection: implemented.
- Print project report after successful database submission: implemented, but actual submission needs the secure RPC function.
- Doctor/admin dashboard layouts and print actions: implemented as UI scaffolding.
- Real Supabase reads are attempted when environment variables are configured.
- Authentication screens, decision workflows, admin doctor management actions, reassignment/closure RPCs, and final production RLS verification are not complete.
- The top navigation is a UI preview switch only, not a security mechanism. Do not deploy this preview as a production system until authentication and authorization are completed.

## Deploy
Build with `npm run build`. Deploy the `dist` folder to a static hosting provider such as Netlify. Configure the same environment variables in the host. Free plans have usage limits and terms that can change.

## Printing
Use the dashboard print buttons or the student report print button. The browser print dialog can save to PDF.
