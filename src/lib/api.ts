import { NextResponse } from "next/server";
import { type ActionResult, actionFailure } from "@/lib/actions/shared";
import { getStrings } from "@/lib/i18n/strings";
import { prisma } from "@/lib/prisma";

// Helpers for the /api/v1 routes. The bearer key is checked in src/proxy.ts.

const { errors } = getStrings();

export type Body = Record<string, unknown>;

/** Thrown for a bad request body, so a route can bail out from any depth. */
export class BadRequest extends Error {}

export const readBody = async (request: Request): Promise<Body> => {
  const body = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new BadRequest(errors.invalidJson);
  }
  return body as Body;
};

const invalid = (key: string) => new BadRequest(errors.invalidField(key));

export const optionalString = (body: Body, key: string) => {
  const value = body[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw invalid(key);
  return value;
};

export const requiredString = (body: Body, key: string) => {
  const value = optionalString(body, key);
  if (value === undefined) throw invalid(key);
  return value;
};

export const optionalNumber = (body: Body, key: string) => {
  const value = body[key];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) throw invalid(key);
  return value;
};

export const requiredNumber = (body: Body, key: string) => {
  const value = optionalNumber(body, key);
  if (value === undefined) throw invalid(key);
  return value;
};

export const optionalStrings = (body: Body, key: string) => {
  const value = body[key];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    throw invalid(key);
  }
  return value as string[];
};

const NOT_FOUND = new Set<string>([
  errors.storyNotFound,
  errors.annotationNotFound,
]);

/** Turns an action's `{ error }` into a status code, or sends `body`. */
export const respond = (
  result: ActionResult,
  body: unknown = { ok: true },
  status = 200,
) => {
  if (!result) return NextResponse.json(body, { status });
  const code = NOT_FOUND.has(result.error)
    ? 404
    : result.error === errors.generic
      ? 500
      : 400;
  return NextResponse.json(result, { status: code });
};

/** Runs a handler, reporting thrown errors the way server actions do. */
export const handle = async (
  scope: string,
  run: () => Promise<Response>,
): Promise<Response> => {
  try {
    return await run();
  } catch (error) {
    if (error instanceof BadRequest) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return respond(actionFailure(scope, error));
  }
};

export const notFound = (error = errors.storyNotFound) =>
  NextResponse.json({ error }, { status: 404 });

export const findLiveStory = (id: string) =>
  prisma.story.findFirst({ where: { id, deletedAt: null } });
