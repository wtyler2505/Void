# Repository Guidelines

## Project Structure & Module Organization
The app is a Vite + React + TypeScript project centered at the repository root.
- Core entry/state files: `index.tsx`, `App.tsx`, `ThemeContext.tsx`, `types.ts`, `constants.tsx`, `utils.tsx`
- UI modules: `components/` (editor, sidebar, overlays, calendar, kanban, onboarding)
- Service layer: `services/` (`gemini.ts`, `store.ts`, `drive.ts`, `shortcuts.ts`)
- Documentation: `docs/` (architecture, component and service references)
- Static/build artifacts: `public/` (served assets), `dist/` (production output, generated)

Architecture note: state is centralized in `App.tsx` and passed down via props.

## Build, Test, and Development Commands
- `npm install` - install dependencies.
- `npm run dev` - start Vite dev server with HMR.
- `npm run build` - create a production build in `dist/`.
- `npm run preview` - serve the built app locally for verification.

There are currently no committed `lint` or `test` scripts; if you add them, document them in `package.json` and this file.
Tailwind is loaded via CDN in `index.html`; do not add Tailwind as an npm/package build pipeline without team approval.

## Coding Style & Naming Conventions
- Use TypeScript React functional components.
- Match existing style: 2-space indentation, single quotes, semicolons.
- Component filenames are `PascalCase.tsx`; service files use lowercase names (for example, `store.ts`).
- Prefer named exports for components; current exceptions are default exports in `components/CalendarView.tsx` and `components/KanbanBoard.tsx`.
- Use Tailwind utility classes and `useTheme()` for styling.
- Follow the established UI rules: no `rounded-*` classes (angular cyberpunk style), do not hardcode accent colors (use `useTheme().accentColor`), and keep custom CSS in `index.html`’s `<style>` block.

## Testing Guidelines
Automated tests are not yet present. When adding coverage:
- Unit: Vitest
- Component: React Testing Library
- E2E: Playwright or Cypress
- Naming: `*.test.ts(x)` or `*.spec.ts(x)`

Prioritize tests around `services/store.ts`, `utils.tsx`, shortcut handling, and note CRUD/state transitions in `App.tsx`.

## Commit & Pull Request Guidelines
- Use short, imperative commit subjects consistent with history (`Add ...`, `Update ...`, `Fix ...`).
- Keep commits scoped to one change area.
- PRs should include:
  - What changed and why
  - Verification steps (`npm run build`, key UI flows)
  - Screenshots/GIFs for UI updates
  - Linked issue/task when available
  - Documentation updates when architecture or behavior changes (at minimum `CLAUDE.md` and relevant `docs/` pages)

## Security & Configuration Tips
- Never commit secrets. Configure `GEMINI_API_KEY` via environment or `.env`.
- Do not hand-edit `dist/`; regenerate with `npm run build`.
