# Phoenix — Clan Dashboard

A small Clash of Clans clan site: an Express server holds your API token and
proxies requests to the official CoC API, and a static page shows your
roster, trophies, and current war status.

## Why there's a server at all

The Clash of Clans API only works from **whitelisted IP addresses**, and it
doesn't send CORS headers — so a browser calling `api.clashofclans.com`
directly will always fail, and a token pasted into a client-side page would
be visible to anyone who views source. This project keeps the token on the
server and exposes only safe, read-only endpoints to the browser.

## 1. Get an API token

1. Create an account at https://developer.clashofclans.com
2. Go to **My Account → Create New Key**.
3. Give it a name, and for **Allowed IP address** enter the public IP of the
   machine that will run `server.js` (check it at https://ifconfig.me on
   that machine). CoC tokens are locked to specific IPs, so this step is
   required — and if you move the server later (e.g. redeploy on a host
   that gives you a new IP), you'll need to update or recreate the key.
4. Copy the generated token.

## 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:

```
COC_API_TOKEN=paste-your-token-here
CLAN_TAG=#YOURTAG        # optional — leave blank to enter it in the browser instead
```

## 3. Run it

Requires Node 18+ (for built-in `fetch`).

```bash
npm install
npm start
```

Then open http://localhost:3000

## Pushing this to GitHub

`.gitignore` already excludes `.env`, so your real token won't get committed —
only `.env.example` (which has no real secret in it) goes into the repo.
GitHub itself (including GitHub Pages) only serves static files and can't run
`server.js`, so treat GitHub as where the *code* lives, not where the *site*
runs. Deploy the code from your repo to one of the Node hosts below, and set
`COC_API_TOKEN` (and `CLAN_TAG`) as an environment variable in that host's
dashboard rather than as a file.

If you've already pushed a real token by accident: revoke it immediately at
developer.clashofclans.com and generate a new one — removing it from a later
commit doesn't remove it from git history.

## Deploying

Any host works, but remember the IP-whitelisting requirement above:

- **A VPS with a static IP** (e.g. a small DigitalOcean/Linode/Hetzner box)
  is the simplest match — whitelist that one IP and you're done.
- **Serverless/PaaS platforms** (Render, Railway, Vercel, etc.) often use
  rotating or shared outbound IPs, which breaks CoC's whitelist. If you use
  one of these, check whether it offers a static outbound IP add-on, or
  route outbound traffic through a fixed-IP proxy.

## API endpoints this server exposes

- `GET /api/clan?tag=%23YOURTAG` — clan info
- `GET /api/clan/members?tag=%23YOURTAG` — member list
- `GET /api/clan/currentwar?tag=%23YOURTAG` — current war (403 if the clan's
  war log is set to private — that's a clan setting, not a bug)

If `tag` is omitted, the server falls back to `CLAN_TAG` from `.env`.
