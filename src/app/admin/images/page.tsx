import Link from "next/link";
import DeleteImageButton from "@/components/DeleteImageButton";
import { Header } from "@/components/ui";
import { getUploadedImages } from "@/lib/actions";
import { formatDate, getStrings } from "@/lib/i18n/strings";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

export default async function AdminImages() {
  const images = await getUploadedImages();
  const strings = getStrings();

  return (
    <div className="min-h-screen bg-cogapp-cream">
      <Header
        title={strings.admin.allImagesTitle}
        backLink={{ href: "/admin", label: strings.common.admin }}
        actions={
          <span className="text-cogapp-cream">
            {strings.admin.imagesCount(images.length)}
          </span>
        }
      />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {images.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {strings.admin.noImages}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    {strings.admin.imageTableHeaders.filename}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    {strings.admin.imageTableHeaders.dimensions}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    {strings.admin.imageTableHeaders.usedBy}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    {strings.admin.imageTableHeaders.created}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    {strings.admin.imageTableHeaders.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {images.map((image) => (
                  <tr key={image.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {image.originalName || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {image.width} × {image.height}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {image.stories.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {image.stories.map((story) => (
                            <div
                              key={story.id}
                              className="flex items-center gap-2"
                            >
                              {story.deletedAt ? (
                                <span className="text-gray-400 line-through">
                                  {story.title}
                                </span>
                              ) : (
                                <Link
                                  href={`/editor/${story.id}`}
                                  className="text-cogapp-charcoal hover:underline"
                                >
                                  {story.title}
                                </Link>
                              )}
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  story.deletedAt
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {story.deletedAt
                                  ? strings.admin.status.deleted
                                  : strings.admin.status.active}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">
                          {strings.admin.notUsed}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {formatDate(image.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <a
                          href={image.infoJsonUrl}
                          target="_blank"
                          className="text-sm text-gray-500 hover:underline"
                          rel="noreferrer"
                        >
                          {strings.admin.actionLabels.viewInfoJson}
                        </a>
                        {isDev && <DeleteImageButton imageId={image.id} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
