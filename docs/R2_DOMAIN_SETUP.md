# Public artwork hostname setup

## Ready-to-import Netlify export — 20 October 2026

The owner supplied `redlarkworkshop.com (DNS Records).csv`. The converted Cloudflare BIND file is [cloudflare-redlarkworkshop.com.txt](../cloudflare-redlarkworkshop.com.txt). It contains six records: four mail records preserved exactly, plus two website records converted from Netlify's proprietary NETLIFY type. The apex uses Netlify's standard external-DNS load balancer; www retains the exact project hostname from the CSV. All CNAMEs explicitly import as DNS-only.

1. Add/select redlarkworkshop.com in the SAME Cloudflare account as the R2 buckets; choose Free if adding it.
2. Open DNS -> Records -> Import and Export -> Import DNS records. Select the converted .txt file and uncheck "Proxy imported DNS records". Import once.
3. Review the six imported records before changing nameservers. Reconcile auto-scanned A/AAAA/CNAME records at @ and www if they conflict with the imported website CNAMEs; retain unrelated records. Existing exact duplicates need not be imported twice.
4. The CSV contains no standalone MX or SPF TXT records. Its two Resend CNAMEs are preserved without substituting guessed mail records. Check the complete Netlify zone and Resend dashboard for any additional records not included in this export, and copy those if present.
5. Only after the review, follow the nameserver/DNSSEC steps below. Keep the old Netlify zone as a rollback reference. After activation, verify website HTTPS and Resend verification, then attach files.redlarkworkshop.com through the approved R2 bucket's Custom Domains settings. That hostname is intentionally absent from the import file.

Cloudflare's import format and dashboard steps: https://developers.cloudflare.com/dns/manage-dns-records/how-to/import-and-export/.

The owner has chosen to create the website administrator account after deployment. This is supported: use https://redlarkworkshop.com/en/signup/, verify the email in the same browser, enroll/verify TOTP in /en/account/settings/, then run the guarded bootstrap from a trusted local machine. The initial deployment can precede administrator creation; public contribution acceptance still requires the verified administrator.

## DNS and bucket activation

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
