<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- The landing is a static HTML file (public/mesa-creativa.html, mirrored in public/index.html). The old public AI routes (generate-brief, generate-preview) were removed; do not re-create them.
- AI assistant: public/asistente/asistente.js (chat widget) calls the Supabase Edge Function "asistente" (source copy in supabase/functions/asistente). It uses Cloudflare Workers AI with daily caps so it stays inside the free tier. Do not add AI routes to the TanStack app.
- Reservations: public forms call the Supabase RPC crear_reserva; owners manage them in public/admin-reservas.html.
