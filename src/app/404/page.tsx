import NotFound from "../not-found";
import { pageMeta } from "@/lib/metadata";
export const metadata = {
  ...pageMeta(
    "404 — not on this wall",
    "This page is not in the Red Lark Workshop archive. Search the collection or open the poster-making Studio.",
    "/404",
  ),
  robots: { index: false, follow: true },
};
export default NotFound;
