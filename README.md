# cloudflare-minions

A Yarn 4 monorepo for Cloudflare Workers projects. The initial workspace hosts the `mouthful-worker`, which sends email notifications for Mouthful webhooks via Cloudflare's Email service.

## Getting started

- Install dependencies: `yarn setup`
- Start the worker locally: `yarn dev`
- Type-check all workspaces: `yarn typecheck`
- Deploy the Mouthful worker: `yarn deploy`

## Configuration

- Update `apps/mouthful-worker/wrangler.toml` with the sender (must be on `costic.dev`) and destination inbox. An optional `WEBHOOK_SECRET` entry can be added if you later wire up shared-secret verification.
- In Cloudflare Email Routing, allow the sender and destination addresses so the Worker can send mail.

## Repository layout

```
apps/
  mouthful-worker/   # Cloudflare Worker that processes Mouthful webhook payloads
packages/            # Shared libraries (add more workspaces here)
tsconfig.base.json   # Shared TypeScript compiler settings
```

Each workspace manages its own `wrangler.toml` and scripts. To add another Worker, create a new folder under `apps/` with its own `package.json`, `wrangler.toml`, and source files.
