# AI Contribution Guidelines / Agent Instructions

Guidelines for AI assistants contributing to the DMARCo dashboard.

## Project Structure & Design
- The dashboard is the React single-page frontend of DMARCo; it talks to the
  DMARCo backend over the `/v1` REST API.
- React 18, TypeScript, Vite, Tailwind CSS and shadcn/ui.
- `src/pages`: routed screens. `src/components`: shared components, with the
  unmodified shadcn/ui primitives under `src/components/ui`.
- `src/services`: one module per API area; components call services, never
  `fetch` directly.
- `src/lib`: API client, runtime configuration, parsing and formatting helpers.
- `src/contexts` and `src/hooks`: cross-screen state such as authentication.
- Do not edit files in `src/components/ui` to add product behavior; wrap them.

## Configuration
- The production image is generic and reads its settings at runtime from
  `config.js` (`src/lib/runtime-config.ts`); build-time `VITE_*` variables are
  the development fallback.
- Never bake an API URL, domain or secret into the bundle.
- New settings must work in both places, and belong in the README table.

## UI Conventions
- Use the `drawer` component instead of `modal` on mobile viewports.
- Keep screens usable at phone width; the app is used on both desktop and mobile.
- Use the design tokens from `src/index.css` and Tailwind classes; no hard-coded
  colors, and the UI must work in both light and dark themes.
- Use `lucide-react` for icons, and the existing toast and form patterns rather
  than new ones.

## Coding Standards & Tooling
- TypeScript everywhere, no `any` that can be avoided, and no new `@ts-ignore`.
- 2 spaces for indentation, double quotes in `.ts`/`.tsx`, and the import order
  already used in the file.
- Components are function components with typed props; file names match the
  exported component.
- Keep mock mode working: `src/lib/mock-data.ts` must cover any new screen so
  the UI can run without a backend.
- Run `npm run lint` and `npm run build` before proposing a change; both must
  pass with no errors.

## Compatibility & Security
- Do not add a dependency for something the existing stack already does.
- Tokens live in the API client; do not copy them into component state or logs.
- Never log report contents, email addresses or tokens to the console.
