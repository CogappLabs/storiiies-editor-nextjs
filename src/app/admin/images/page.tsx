import Image from "next/image";
import Link from "next/link";
import DeleteImageButton from "@/components/DeleteImageButton";
import DeleteMediaButton from "@/components/DeleteMediaButton";
import { Header, panelClass, textLinkClass } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { formatDate, getStrings } from "@/lib/i18n/strings";
import { getAnnotationMedia, getUploadedImages } from "@/lib/queries";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

const AdminImages = async () => {
  const [images, media] = await Promise.all([
    getUploadedImages(),
    getAnnotationMedia(),
  ]);
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
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{admin.storyImagesHeading}</h2>
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
                        <div className="flex items-center gap-3">
                          {image.thumbnail ? (
                            <Image
                              src={image.thumbnail}
                              alt=""
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover border border-cogapp-charcoal/20"
                            />
                          ) : (
                            <span className="w-10 h-10 shrink-0 border border-cogapp-charcoal/20 bg-cogapp-cream" />
                          )}
                          <div>
                            <div className="font-medium">
                              {image.originalName ?? image.id.slice(0, 8)}
                            </div>
                            <div className="mt-0.5 text-xs text-cogapp-gray tabular-nums">
                              {image.width} × {image.height}
                            </div>
                          </div>
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
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{admin.mediaHeading}</h2>
          {media.length === 0 ? (
            <p className={`${panelClass} p-8 text-center text-cogapp-gray`}>
              {admin.noMedia}
            </p>
          ) : (
            <div className={`${panelClass} overflow-x-auto`}>
              <table className="w-full text-left">
                <thead className="border-b border-cogapp-charcoal/10 text-xs text-cogapp-gray">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {admin.mediaTableHeaders.file}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {admin.mediaTableHeaders.usedBy}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {admin.mediaTableHeaders.uploaded}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <span className="sr-only">
                        {admin.imageTableHeaders.actions}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cogapp-charcoal/10">
                  {media.map((file) => (
                    <tr
                      key={file.url}
                      className="align-top hover:bg-cogapp-cream/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {file.kind === "image" ? (
                            <Image
                              src={file.url}
                              alt=""
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover border border-cogapp-charcoal/20"
                            />
                          ) : (
                            <Icon
                              name="audio"
                              className="w-10 h-10 p-2 text-cogapp-gray border border-cogapp-charcoal/20"
                            />
                          )}
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`${textLinkClass} break-all`}
                          >
                            {file.name}
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {file.usedBy.length === 0 ? (
                          <span className="text-cogapp-gray">
                            {admin.notUsed}
                          </span>
                        ) : (
                          <ul className="space-y-1">
                            {file.usedBy.map(({ story, ordinal }) => (
                              <li key={`${story.id}-${ordinal}`}>
                                <Link
                                  href={`/editor/${story.id}`}
                                  className="hover:underline"
                                >
                                  {admin.annotationRef(
                                    story.title,
                                    ordinal + 1,
                                  )}
                                </Link>
                                {story.deletedAt && (
                                  <span className="ml-1 text-xs text-danger">
                                    {admin.deleted}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-cogapp-gray">
                        {formatDate(file.uploadedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isDev && file.usedBy.length === 0 && (
                          <DeleteMediaButton url={file.url} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminImages;
