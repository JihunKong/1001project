# Page snapshot

```yaml
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- navigation:
  - button "previous" [disabled]:
    - img "previous"
  - text: 1/1
  - button "next" [disabled]:
    - img "next"
- img
- img
- text: Next.js 15.4.6 Turbopack
- img
- dialog "Build Error":
  - text: Build Error
  - button "Copy Stack Trace":
    - img
  - button "No related documentation found" [disabled]:
    - img
  - link "Learn more about enabling Node.js inspector for server code with Chrome DevTools":
    - /url: https://nextjs.org/docs/app/building-your-application/configuring/debugging#server-side-code
    - img
  - paragraph: Error evaluating Node.js code
  - img
  - text: ./app/globals.css
  - button "Open in editor":
    - img
  - text: "Error evaluating Node.js code Error: It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin. The PostCSS plugin has moved to a separate package, so to continue using Tailwind CSS with PostCSS you'll need to install `@tailwindcss/postcss` and update your PostCSS configuration. [at We (/Users/jihunkong/1001project/1001-stories/node_modules/tailwindcss/dist/lib.js:35:2121)] [at eval (turbopack:///[turbopack-node]/transforms/postcss.ts:56:14)] [at <anonymous>] [at Module.init (turbopack:///[turbopack-node]/transforms/postcss.ts:43:33)] [at run (turbopack:///[turbopack-node]/ipc/evaluate.ts:77:20)] Import trace: ./app/globals.css [Client Component Browser] ./app/layout.tsx [Server Component]"
- alert
```