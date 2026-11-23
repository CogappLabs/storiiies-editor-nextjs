import { createHash, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getStrings } from "@/lib/i18n/strings";

export const config = {
  matcher: [
    // Public: manifests for external IIIF viewers, and the preview pages
    // (plus the Mirador iframe they embed) so stories can be shared.
    "/((?!api/manifest|preview/|mirador\\.html|_next/static|_next/image|favicon|sitemap.xml|robots.txt).*)",
  ],
};

const sha256 = (value: string) => createHash("sha256").update(value).digest();

// Hashing first gives timingSafeEqual equal-length inputs.
const hasApiKey = (req: NextRequest) => {
  const key = process.env.EDITOR_API_KEY;
  const [scheme, token] = req.headers.get("authorization")?.split(" ") ?? [];
  return Boolean(
    key &&
      scheme === "Bearer" &&
      token &&
      timingSafeEqual(sha256(token), sha256(key)),
  );
};

export function proxy(req: NextRequest) {
  // The API takes its own key instead of basic auth, and stays closed when no
  // key is configured.
  if (/^\/api\/v1(\/|$)/.test(req.nextUrl.pathname)) {
    return hasApiKey(req)
      ? NextResponse.next()
      : NextResponse.json(
          { error: getStrings().errors.apiUnauthorized },
          { status: 401 },
        );
  }

  const validUser = process.env.BASIC_AUTH_USER;
  const validPass = process.env.BASIC_AUTH_PASSWORD;

  // If user or password not set, then we don't check for basic auth.
  if (!validUser || !validPass) {
    return NextResponse.next();
  }

  const [scheme, encoded] = req.headers.get("authorization")?.split(" ") ?? [];
  if (scheme === "Basic" && encoded) {
    try {
      // Compare the whole "user:pass" string so passwords may contain ":".
      if (atob(encoded) === `${validUser}:${validPass}`) {
        return NextResponse.next();
      }
    } catch {
      // Malformed base64 falls through to the 401.
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
  });
}
