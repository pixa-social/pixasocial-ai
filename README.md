# PixaSocial-AI

A social media management and AI-powered content creation platform.

## Deployment on Vercel

If you encounter an error related to `pnpm-lock.yaml` being outdated during deployment on Vercel, it's due to a mismatch between the lockfile and `package.json`. To resolve this:

1. **Update the lockfile locally**: Run `pnpm install` on your local machine to update the `pnpm-lock.yaml` file, then commit and push the changes.
2. **Bypass the frozen lockfile check**: In Vercel's project settings, under "General" > "Install Command", set the custom command to `pnpm install --no-frozen-lockfile`.

This will ensure Vercel can install dependencies without failing due to the lockfile mismatch.

## Development

- **Setup**: `npm install` or `pnpm install`
- **Run**: `npm run dev` or `pnpm run dev`
