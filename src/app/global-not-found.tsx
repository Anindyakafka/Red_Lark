import "./globals.css";
import NotFound from "@/components/not-found";
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <head>
        <title>Page not found | RED LARK WORKSHOP</title>
        <meta name="robots" content="noindex" />
        <meta
          name="description"
          content="This page is not in the archive. Search the collection or open the free Studio."
        />
      </head>
      <body>
        <main id="main">
          <NotFound />
        </main>
      </body>
    </html>
  );
}
