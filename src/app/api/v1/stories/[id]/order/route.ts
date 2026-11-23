import { reorderAnnotations } from "@/lib/actions/annotations";
import {
  BadRequest,
  handle,
  optionalStrings,
  readBody,
  respond,
} from "@/lib/api";
import { getStrings } from "@/lib/i18n/strings";

const { errors } = getStrings();

export async function PUT(
  request: Request,
  { params }: RouteContext<"/api/v1/stories/[id]/order">,
) {
  return handle("reorder annotations", async () => {
    const { id } = await params;
    const annotationIds = optionalStrings(
      await readBody(request),
      "annotationIds",
    );
    if (!annotationIds)
      throw new BadRequest(errors.invalidField("annotationIds"));
    return respond(await reorderAnnotations(id, annotationIds));
  });
}
