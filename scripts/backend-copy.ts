import fs from "node:fs";
import ts from "typescript";
const replacements: Record<string, string> = {
  "NO ACCOUNTS. NO DESIGN SERVER.": "OPEN ARCHIVE. PRIVATE STUDIO.",
  "Contributor accounts, login cookies, database uploads and the server mail service are not enabled. Account/admin pages are unavailable notices, not sign-in forms. Before activation, privacy and retention rules must be reviewed and updated; necessary authentication cookies would be used only for the account service.":
    "Browsing, downloading and the Studio need no account. Uploading requires a verified contributor account. Supabase handles email/password and magic-link authentication. Necessary HttpOnly, Secure, SameSite=Lax cookies keep sessions and protect forms; they are not tracking cookies. Server-stored authentication tokens are encrypted. Administration requires TOTP and recent verification.",
  "Contact and submission forms validate locally and prepare an email handoff to your own mail app. The site does not send email, upload attachments, or store form messages. Your email provider handles delivery if you choose to send. Do not supply unnecessary personal details. When no contact address is configured, delivery is unavailable and the form says so.":
    "Contact and takedown messages are validated and stored privately in Supabase Postgres. Resend sends the team notification and, if you provide an optional reply address, an acknowledgement. Failed delivery remains in a retry queue. An accepted email request is not proof of inbox delivery. Do not supply unnecessary personal details.",
  "Messages you choose to send reach the team’s email provider, outside this website. The team must settle mailbox retention and access rules. No database case or automatic acknowledgement is created here. There is no account data export or deletion service while accounts are disabled; Studio files can be exported locally and browser drafts/bookmarks can be cleared.":
    "Account data can be exported and the account deleted from the dashboard. At deletion you choose removal or anonymisation of published works; downloaded copies and embedded credits cannot be recalled. Contact and UPI fields are optional, private by default, and public only with explicit per-field and per-work consent. Message retention, provider logs, data residency and legal obligations need owner review before launch.",
  "Send a link to your work, not private files or personal details. No accounts. No automatic publication.":
    "Browsing, downloading and the Studio need no account. Uploading requires a verified contributor account.",
  "Last revised: 16 October 2026. This describes the current build, not a future service.":
    "Last revised: 19 October 2026. Backend functions require deployment configuration; unavailable services show an error rather than pretending to submit.",
  "Account uploads and the database review queue are not enabled during the backend hold. The current Submit page prepares an email proposal in your own mail app; no file is uploaded or automatically published.":
    "Contributions require a verified account and are uploaded privately for metadata removal and human review. Nothing is published automatically. NoDerivatives work may be downloaded under its licence but is never offered for Studio remix.",
  "Artists, writers, designers and legal volunteers can contact the team about contributing, joining or commissioning campaign material. Current forms use your own email app; account uploads and server mail are not enabled.":
    "Artists, writers, designers and legal volunteers can contact the team about contributing, joining or commissioning campaign material. Contributor uploads are private until human review; contact messages are stored privately and emailed to the team.",
  "A curated gallery for reviewed Studio-made posters. No submissions are published yet; propose your work through the email handoff.":
    "A curated gallery for reviewed Studio-made posters. Upload your work privately through a contributor account for human review.",
  "What the current site stores locally and how email handoff works.":
    "Browser storage, necessary authentication cookies, private uploads, contact messages and public-field consent.",
  "[10] YOUR BROWSER IS THE WORKSHOP / NO ACCOUNTS":
    "[10] YOUR BROWSER IS THE WORKSHOP / NO LOGIN REQUIRED",
  "You must own submitted artwork or have permission to share it, and supply credit, an explicit licence and a source. Email handoff does not promise receipt or publication. A human reviews contributions before adding them to the repository. No user account or automatic public gallery exists.":
    "You must own submitted artwork or have permission to share it, and supply credit, an explicit licence and a source. Private uploads require a verified account. An administrator reviews licence, credit, AI disclosure and consent before approval. Approval requests publication; it does not guarantee a review time or automatic inclusion in a curated gallery.",
  "Account uploads and the database review queue are not enabled. Public contact and UPI fields require separate explicit consent, and AI-use disclosure does not establish permission. Future account export/deletion, anonymisation/removal and review rules must be published before that service starts.":
    "Profiles may use pseudonyms. Contact and UPI fields are optional and require independent explicit consent before publication. AI-use disclosure does not establish permission. Account export and deletion are available from the dashboard; at deletion you choose removal or anonymisation of published work. Copies already downloaded by others cannot be recalled.",
  "Plain-language draft explaining local Studio storage, image metadata removal, share links, email handoffs and optional cookieless analytics.":
    "Plain-language draft covering browser-local Studio designs, contributor accounts, private uploads, contact mail, necessary cookies and optional cookieless analytics.",
  "The Studio works in your browser. Designs and uploaded images are not sent to a Red Lark Workshop server. We do not ask for your location, fingerprint your device, or assign a tracking identifier.":
    "Studio designs and images imported into the Studio stay in your browser. The separate contribution Upload flow sends an image privately to Cloudflare R2 for sanitization and review; Supabase stores account and contribution metadata, not artwork files. Original quarantine uploads expire after processing or cleanup; sanitized files remain private until approval. We do not request geolocation, fingerprint devices or assign tracking identifiers. Application rate limits store only salted, daily-rotating hashes, removed after expiry; infrastructure-provider logging needs owner review.",
};
for (const folder of ["src/app", "content/copy"]) {
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (/\.(tsx|json)$/.test(path) && !entry.name.startsWith("landing.")) {
        let source = fs.readFileSync(path, "utf8");
        for (const [before, after] of Object.entries(replacements))
          source = source.replaceAll(before, after);
        fs.writeFileSync(path, source);
      }
    }
  }
  walk(folder);
}
const keys = new Set<string>(Object.values(replacements));
for (const file of [
  "src/components/account-client.tsx",
  "src/components/handoff-form.tsx",
  "src/components/account-pages.tsx",
  "src/components/account-navigation.tsx",
  "src/components/admin-records.tsx",
  ...fs
    .readdirSync("src/app/[locale]/account", { recursive: true })
    .filter((file) => String(file).endsWith("page.tsx"))
    .map((file) => `src/app/[locale]/account/${file}`),
  ...fs
    .readdirSync("src/app/[locale]/admin", { recursive: true })
    .filter((file) => String(file).endsWith("page.tsx"))
    .map((file) => `src/app/[locale]/admin/${file}`),
  "src/app/[locale]/submit/page.tsx",
]) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  function visit(node: ts.Node) {
    if (
      ts.isStringLiteral(node) &&
      node.text.length > 2 &&
      /[A-Z ]/.test(node.text) &&
      !node.text.startsWith("@/") &&
      !/[{}<>]/.test(node.text)
    )
      keys.add(node.text);
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const drafts: Record<string, Record<string, string>> = {
  hi: {
    Email: "ईमेल",
    Password: "पासवर्ड",
    "Sign in": "साइन इन करें",
    "Forgot password?": "पासवर्ड भूल गए?",
    "Create account": "खाता बनाएँ",
    "Check your inbox": "अपना इनबॉक्स देखें",
    "Send reset link": "रीसेट लिंक भेजें",
    "Set new password": "नया पासवर्ड सेट करें",
    "Account security": "खाते की सुरक्षा",
    "Send message": "संदेश भेजें",
    "Message received": "संदेश प्राप्त हुआ",
    "My contributions": "मेरे योगदान",
  },
  bn: {
    Email: "ইমেল",
    Password: "পাসওয়ার্ড",
    "Sign in": "সাইন ইন করুন",
    "Forgot password?": "পাসওয়ার্ড ভুলে গেছেন?",
    "Create account": "অ্যাকাউন্ট তৈরি করুন",
    "Check your inbox": "আপনার ইনবক্স দেখুন",
    "Send reset link": "রিসেট লিঙ্ক পাঠান",
    "Set new password": "নতুন পাসওয়ার্ড দিন",
    "Account security": "অ্যাকাউন্টের নিরাপত্তা",
    "Send message": "বার্তা পাঠান",
    "Message received": "বার্তা পাওয়া গেছে",
    "My contributions": "আমার অবদান",
  },
  ml: {
    Email: "ഇമെയിൽ",
    Password: "പാസ്‌വേഡ്",
    "Sign in": "സൈൻ ഇൻ ചെയ്യുക",
    "Forgot password?": "പാസ്‌വേഡ് മറന്നോ?",
    "Create account": "അക്കൗണ്ട് സൃഷ്ടിക്കുക",
    "Check your inbox": "ഇൻബോക്സ് പരിശോധിക്കുക",
    "Send reset link": "റീസെറ്റ് ലിങ്ക് അയയ്ക്കുക",
    "Set new password": "പുതിയ പാസ്‌വേഡ് നൽകുക",
    "Account security": "അക്കൗണ്ട് സുരക്ഷ",
    "Send message": "സന്ദേശം അയയ്ക്കുക",
    "Message received": "സന്ദേശം ലഭിച്ചു",
    "My contributions": "എന്റെ സംഭാവനകൾ",
  },
};
keys.add("Admin review");
drafts.hi["Admin review"] = "प्रशासनिक समीक्षा";
drafts.bn["Admin review"] = "প্রশাসনিক পর্যালোচনা";
drafts.ml["Admin review"] = "അഡ്മിൻ അവലോകനം";
for (const locale of ["en", "hi", "bn", "ml"]) {
  const path = `messages/${locale}.json`,
    data = JSON.parse(fs.readFileSync(path, "utf8"));
  for (const before of Object.keys(replacements)) delete data.strings[before];
  for (const key of keys)
    if (!data.strings[key] || data.strings[key] === key)
      data.strings[key] = drafts[locale]?.[key] || key;
  if (locale !== "en") data.reviewed = false;
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}
console.log(
  "Backend UI message keys aligned; Indic additions remain unreviewed drafts with visible English fallback.",
);
