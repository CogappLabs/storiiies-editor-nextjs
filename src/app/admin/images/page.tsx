import Link from "next/link";
import DeleteImageButton from "@/components/DeleteImageButton";
import { Header, panelClass, textLinkClass } from "@/components/ui";
import { formatDate, getStrings } from "@/lib/i18n/strings";
import { getUploadedImages } from "@/lib/queries";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

const AdminImages = async () => {
  const images = await getUploadedImages();
  const strings = getStrings();
  const { admin } = strings;

  return (
    <div className="min-h-screen bg-cogapp-cream">
      <Header
        title={admin.allImagesTitle}
        backLink={{ href: "/admin", label: strings.common.admin }}
        actions={
          <span className="text-sm text-cogapp-cream">
            {admin.imagesCount(images.length)}
          </span>
        }
      />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {images.length === 0 ? (
          <p className={`${panelClass} p-8 text-center text-cogapp-gray`}>
            {admin.noImages}
          </p>
        ) : (
          <div className={`${panelClass} overflow-x-auto`}>
            <table className="w-full text-left">
              <thead className="border-b border-cogapp-charcoal/10 text-xs text-cogapp-gray">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    {admin.imageTableHeaders.filename}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {admin.imageTableHeaders.usedBy}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {admin.imageTableHeaders.created}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">
                      {admin.imageTableHeaders.actions}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cogapp-charcoal/10">
                {images.map((image) => (
                  <tr
                    key={image.id}
                    className="align-top hover:bg-cogapp-cream/40"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {image.originalName ?? image.id.slice(0, 8)}
                      </div>
                      <div className="mt-0.5 text-xs text-cogapp-gray tabular-nums">
                        {image.width} × {image.height}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {image.stories.length === 0 ? (
                        <span className="text-cogapp-gray">
                          {admin.notUsed}
                        </span>
                      ) : (
                        <ul className="space-y-1">
                          {image.stories.map((story) => (
                            <li key={story.id}>
                              {story.deletedAt ? (
                                <span className="text-cogapp-gray">
                                  {story.title}{" "}
                                  <span className="text-xs text-danger">
                                    {admin.deleted}
                                  </span>
                                </span>
                              ) : (
                                <Link
                                  href={`/editor/${story.id}`}
                                  className="hover:underline"
                                >
                                  {story.title}
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-cogapp-gray">
                      {formatDate(image.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-x-3">
                        <a
                          href={image.infoJsonUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={textLinkClass}
                        >
                          {admin.actionLabels.viewInfoJson}
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
};

export default AdminImages;
