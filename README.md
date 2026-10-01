# The Shafter Lawyer

The WordPress website at [theshafterlawyer.com](https://theshafterlawyer.com/) rebuilt with **Next.js App Router, TypeScript, and vanilla CSS**, ready to host on Vercel. The application uses local content, images, and fonts; WordPress is not required at runtime.

## Run locally

Use **Node.js 22** (pinned in `.nvmrc` and `package.json`). Dependencies and an `.env.local` file with placeholders are already installed in this workspace. For a fresh checkout:

```sh
npm ci
```

Create `.env.local` from `.env.example` if it is missing, then start development:

```sh
npm run dev
```

Open [localhost:3000](http://localhost:3000). If that port is occupied, Next.js prints the alternative address in the terminal.

| Command             | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Local development server                           |
| `npm run lint`      | ESLint checks                                      |
| `npm run typecheck` | TypeScript checks                                  |
| `npm test`          | Contact, migration, and SEO regression tests       |
| `npm run build`     | Production build                                   |
| `npm start`         | Run the completed production build locally         |
| `npm run verify`    | Audit the running local site in a headless browser |
| `npm run format`    | Format application code and scripts                |

## Contact form and environment variables

The contact form submits to the Node.js endpoint `POST /api/contact/`. Nodemailer sends the message through your SMTP provider. **Replace the SMTP placeholders before email can be delivered. Live delivery has not been verified because credentials have not been supplied.** The form reports a configuration error rather than claiming an unsent message was delivered.

| Variable               | Value to configure                                                    |
| ---------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Canonical production origin; currently `https://theshafterlawyer.com` |
| `SMTP_HOST`            | Your SMTP server hostname                                             |
| `SMTP_PORT`            | Usually `587` for STARTTLS or `465` for implicit TLS                  |
| `SMTP_SECURE`          | `false` with port `587`; `true` with port `465`                       |
| `SMTP_USER`            | SMTP account username                                                 |
| `SMTP_PASSWORD`        | SMTP password or provider-issued app password                         |
| `SMTP_FROM`            | Sender address verified with your email provider                      |
| `CONTACT_TO`           | Mailbox that should receive consultation requests                     |

SMTP variables remain server-only. Keep real credentials in `.env.local` for local use and in Vercel's environment settings for hosting. `.env.local` is ignored by Git; `.env.example` contains safe placeholders. The API validates requests, checks the request origin, limits request size, and uses a honeypot field.

The browser audit uses installed Chrome on Windows or Playwright Chromium (`npx playwright install chromium` on other machines). It defaults to `http://127.0.0.1:3000`. The SMTP failure check is restricted to local URLs and confirmed placeholder credentials, so it does not send an email. For contact testing using `npm start` instead of `npm run dev`, set `NEXT_PUBLIC_SITE_URL` to the local origin in the server process; production origin checking deliberately excludes unconfigured localhost origins.

## Content and SEO

The migration preserves **34 routes**: 22 published pages, five complete blog articles, and seven category, monthly, and author archives. **86 images**—including photographs, logos, and diagrams—are stored in `public/images/`.

Every route has its own title, description, canonical URL, and social metadata. Structured data describes the firm, attorney, breadcrumbs, and articles. Production `/sitemap.xml` contains **32 canonical URLs**. The two original `-dev` pages remain accessible but are marked `noindex` and canonicalized to their corresponding public pages. `/robots.txt` allows production crawling and excludes the API. Vercel preview deployments are marked `noindex`, disallow crawling, and publish an empty sitemap.

| File or directory                | What to edit                                                            |
| -------------------------------- | ----------------------------------------------------------------------- |
| `src/data/site-content.json`     | Migrated page bodies, article text, FAQs, dates, and image references   |
| `src/data/types.ts`              | Content record and block types                                          |
| `src/lib/navigation.ts`          | Menus, practice-area groups, and shared contact details                 |
| `src/lib/seo.ts`                 | Page-specific metadata, canonical aliases, and business structured data |
| `src/app/` and `src/components/` | Page layouts, reusable UI, and vanilla CSS                              |
| `public/images/`                 | Locally hosted source images                                            |
| `migration/`                     | Source inventory, raw captures, validation report, and extraction notes |

Shared public contact details currently use **400 Central Valley Hwy, Shafter, CA 93263**, matching the original site's repeated footers. Its old contact page also listed **422 James St.**; confirmation of the correct address is pending. The conflicting source copy is preserved in the migration records. If the address changes, update both the shared contact configuration and the SEO contact description/structured data.

The source was captured on September 30, 2026. Regression tests verify the full original text of all five articles, seven FAQ answers, six case narratives, and the disclaimer, as well as route preservation, local image availability, and internal links. Original legal copy was retained. Builder placeholders, duplicate mobile content, and WordPress scripts were removed; corrections are documented in [migration/README.md](migration/README.md).

To regenerate data from the saved captures:

```sh
node scripts/migrate-source.mjs
```

To fetch the source site again and redownload its images:

```sh
node scripts/migrate-source.mjs --refresh
```

The migration script only reads WordPress. It **replaces generated JSON files**, so preserve any intentional local content edits before rerunning it. The deployed site uses those generated files without contacting the old host.

## Deploy on Vercel

No repository push or Vercel deployment has been performed.

1. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
2. Push the repository to your Git host and import it into Vercel using the **Next.js** framework preset. Use Node.js 22, `npm run build`, and the preset's default output settings. Keep the Node.js contact function; do not configure a static export.
3. Add the environment variables above in Vercel. Set `NEXT_PUBLIC_SITE_URL` to the production domain, even for preview builds. Configure SMTP values in the environments where you intend to test or send email, then redeploy after changing build-time configuration.
4. Review the preview on desktop and mobile, confirm the office address, and submit a test contact request with real SMTP credentials. Verify that it reaches `CONTACT_TO` and that replies go to the visitor's address.
5. Add the production domain in Vercel and apply the exact DNS records it provides at your DNS provider. Retain existing email-related DNS records. Move web traffic only after the preview and email checks are complete.
6. Check the production domain's HTTPS, original page URLs, contact form, `/robots.txt`, and `/sitemap.xml`. Confirm that the production pages are indexable and that the sitemap contains the intended 32 URLs, then submit the sitemap in Google Search Console.
