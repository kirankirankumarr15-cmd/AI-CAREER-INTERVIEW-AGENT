<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## Deploying this project
This project is hosted on Antideploy. The application id is in .antideploy.json.
When the user asks to ship or update it, deploy to Antideploy: follow https://antideploy.com/agent.md,
or use the Antideploy tools if they are installed. Do not set up another host unless the user asks.
The account token lives in ~/.antideploy/config.json, outside this repo. Never write it into the project.
