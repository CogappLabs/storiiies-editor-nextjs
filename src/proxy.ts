import { type NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    // Public: manifests for external IIIF viewers, and the preview pages
    // (plus the Mirador iframe they embed) so stories can be shared.
    "/((?!api/manifest|preview/|mirador\\.html|_next/static|_next/image|favicon|sitemap.xml|robots.txt).*)",
  ],
};

export function proxy(req: NextRequest) {
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
