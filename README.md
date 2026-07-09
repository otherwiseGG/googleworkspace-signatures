# Gmail Signature Self-Service Setup

A free, self-service way to standardize Gmail signatures across a Google
Workspace organization — **without a service account, without domain-wide
delegation, and without any downloadable API keys.**

Many "set everyone's signature" tutorials rely on a service account key with
domain-wide delegation so an admin script can impersonate every user. That
approach is blocked outright in organizations that enforce the
`iam.managed.disableServiceAccountKeyCreation` policy (a Google-recommended
default), and it's a real security footgun even when it isn't blocked: a
downloadable key never expires unless you rotate it yourself.

This template avoids that entirely. Each user visits a small web app once,
signs in with their own Google account, confirms their name/nickname/job
title, and the script sets **their own** Gmail signature using **their own**
OAuth consent. The script never touches anyone else's account, so no
elevated admin permissions, service accounts, or keys are needed at all.

## How it works

- `Code.gs` — reads the signed-in user's own name and job title from the
  People API (`people/me`), builds a signature from your configured template,
  and writes it back via the Gmail API's `sendAs` settings for that same user.
- `form.html` — a small form each user fills in once. First/last name are
  pre-filled from their Google profile where available.

Name handling: users can enter a full name, a nickname (e.g. a gamertag,
stage name, or preferred handle), or both. If both are given, the signature
reads `First "Nickname" Last`. If only one is given, only that part is shown.

## Setup

1. **Create the Apps Script project.** Go to [script.google.com](https://script.google.com) → *New project*.
2. **Add the files.** Replace the default `Code.gs` content with this repo's `Code.gs`. Add a new HTML file named `form` (no extension in the Apps Script editor) and paste in `form.html`.
3. **Enable advanced services.** In the editor sidebar, click *Services* → add **Gmail API** → add **People API**.
4. **Edit the `CONFIG` object** at the top of `Code.gs` with your organization's details (company name, tagline, website, logo URL, legal footer lines, colors). See [Configuration](#configuration) below.
5. **Deploy as a web app.** *Deploy* → *New deployment* → Type: **Web app**.
   - Execute as: **User accessing the web app**
   - Who has access: **Anyone within [your domain]**
6. **Authorize** the requested scopes as the deploying admin, then copy the resulting web app URL.
7. **Share the URL** with everyone in your organization. Each person visits it once, fills in their details, and clicks the button — done.

### If users see an "unverified app" warning

If your Workspace has API access restrictions for internal apps, an admin may need to mark this specific deployment as a trusted app under **Admin console → Security → API controls**.

## Configuration

All customization lives in the `CONFIG` object at the top of `Code.gs`:

| Field | Description |
|---|---|
| `companyName` | Shown in bold next to your logo/tagline. |
| `tagline` | Short line after the company name. Leave `''` to omit. |
| `websiteUrl` | Linked in the signature. |
| `logoUrl` | Must be a **publicly reachable** image URL — a local file path will not render in emails. Leave `''` to omit the logo entirely. |
| `logoWidth` / `logoHeight` | Rendered size of the logo image, in pixels. |
| `legalLines` | Array of extra footer lines — company legal form, address, register details, etc. Leave `[]` to omit. |
| `confidentialityNotice` | Standard confidentiality disclaimer text. |
| `printNotice` | E.g. an environmental "please don't print" note. |
| `colors` | Text/accent/divider/muted/disclaimer colors used in the signature. |

## Limitations

- Gmail only (this uses the Gmail API's `sendAs` signature field).
- Each user must visit the web app and authorize it once — there is no way to push a signature to an account without that account's own consent, by design.
- The People API only returns job title if the user (or your organization) has filled that field in on their Google profile; otherwise it's left blank for the user to fill in themselves.

## License

MIT — see [LICENSE](./LICENSE).
