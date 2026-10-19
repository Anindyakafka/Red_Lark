# Public artwork hostname setup

The configured private buckets and R2 credentials are retained. This is an owner checklist, not permission for an automated DNS change. Proposed approved-files origin: https://files.redlarkworkshop.com. It is not yet configured or verified. Pending uploads must never be attached to a public hostname.

Cloudflare's direct R2 custom-domain integration requires the domain as a zone in the bucket's account. A paid partial/CNAME setup is an alternative; for the free path, move authoritative DNS to Cloudflare while retaining Porkbun as registrar and Netlify as web host. See [R2 public/custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/).

1. In Netlify's team DNS dashboard, export/copy ALL existing DNS records, including Resend DKIM/TXT/SPF/MX and any verification/DMARC/CAA records. The automatic Cloudflare scan cannot reliably discover every subdomain record. Keep Netlify DNS intact for rollback.
2. Add redlarkworkshop.com as a website/zone in the SAME Cloudflare account as R2; choose Free. Review its proposed DNS records before switching nameservers.
3. Preserve the website configuration. Netlify-specific NETLIFY records are not portable DNS types: use the exact external-DNS instructions shown in Netlify Domain management. Cloudflare supports apex CNAME flattening; the target should be the project's real Netlify hostname. Start website CNAME records as DNS-only. Do not guess an IP address or change the site's primary domain. See [Netlify external DNS](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/).
4. Add every saved mail/verification record in Cloudflare with its original name, value and MX priority. Check there is only one SPF policy per hostname. Verify the records are complete BEFORE proceeding.
5. In Porkbun, replace Netlify's nameservers with the exact two assigned by Cloudflare. If DNSSEC is enabled, follow the providers' DNSSEC migration instructions before switching; stale DS records can break resolution. Wait for Cloudflare to mark the zone Active.
6. Verify the apex/www website and HTTPS still work and all Resend DNS records resolve and remain Verified. If anything fails, correct the copied records or roll back nameservers; do not delete the old zone yet.
7. R2 -> redlark-approved -> Settings -> Custom Domains -> Add files.redlarkworkshop.com -> review and connect. Wait for Active/HTTPS. Keep r2.dev disabled. Never connect redlark-pending.
8. Set R2_PUBLIC_BASE_URL=https://files.redlarkworkshop.com locally and, only during the authorized deployment, in Netlify. Add the generated site-origin-only CORS configuration supplied with the backend. Rebuild the site to apply its narrow image/connection origins.

Public-bucket contents are public: only server-sanitized approved assets belong there, never raw/pending originals or personal information. Test that a pending-only object key is 404 at the public origin before release. Takedowns must remove objects and cached responses as documented in DEPLOY.md.
