import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import DeleteImageButton from "@/components/DeleteImageButton";
import DeleteMediaButton from "@/components/DeleteMediaButton";
import { Header, panelClass, textLinkClass } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { formatDate, getStrings } from "@/lib/i18n/strings";
import { getAnnotationMedia, getUploadedImages } from "@/lib/queries";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

type StoryImage = Awaited<ReturnType<typeof getUploadedImages>>[number];
type MediaFile = Awaited<ReturnType<typeof getAnnotationMedia>>[number];
type Admin = ReturnType<typeof getStrings>["admin"];

/** True when something is in use, but only by deleted stories. */
const onlyDeletedStories = (stories: { deletedAt: Date | null }[]) =>
  stories.length > 0 && stories.every((story) => story.deletedAt);

const thumbClass = "w-10 h-10 shrink-0 border border-cogapp-charcoal/20";

const StoryLink = ({
  story,
  label,
  deletedLabel,
}: {
  story: { id: string; deletedAt: Date | null };
  label: string;
  deletedLabel: string;
}) =>
  story.deletedAt ? (
    <span className="text-cogapp-gray">
      {label} <span className="text-xs text-danger">{deletedLabel}</span>
    </span>
  ) : (
    <Link href={`/editor/${story.id}`} className="hover:underline">
      {label}
    </Link>
  );

const Table = ({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) => (
  <div className={`${panelClass} overflow-x-auto`}>
    <table className="w-full text-left">
      <thead className="border-b border-cogapp-charcoal/10 text-xs text-cogapp-gray">
        <tr>
          {headers.map((header, i) => (
            <th key={header} className="px-4 py-3 font-medium">
              {i === headers.length - 1 ? (
                <span className="sr-only">{header}</span>
              ) : (
                header
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-cogapp-charcoal/10">{children}</tbody>
    </table>
  </div>
);

const ImageRows = ({ images, admin }: { images: StoryImage[]; admin: Admin }) =>
  images.map((image) => (
    <tr key={image.id} className="align-top hover:bg-cogapp-cream/40">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {image.thumbnail ? (
            <Image
              src={image.thumbnail}
              alt=""
              width={40}
              height={40}
              className={`${thumbClass} object-cover`}
            />
          ) : (
            <span className={`${thumbClass} bg-cogapp-cream`} />
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
          <span className="text-cogapp-gray">{admin.notUsed}</span>
        ) : (
          <ul className="space-y-1">
            {image.stories.map((story) => (
              <li key={story.id}>
                <StoryLink
                  story={story}
                  label={story.title}
                  deletedLabel={admin.deleted}
                />
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
  ));

const MediaRows = ({ media, admin }: { media: MediaFile[]; admin: Admin }) =>
  media.map((file) => (
    <tr key={file.url} className="align-top hover:bg-cogapp-cream/40">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {file.kind === "image" ? (
            <Image
              src={file.url}
              alt=""
              width={40}
              height={40}
              className={`${thumbClass} object-cover`}
            />
          ) : (
            <Icon
              name="audio"
              className={`${thumbClass} p-2 text-cogapp-gray`}
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
          <span className="text-cogapp-gray">{admin.notUsed}</span>
        ) : (
          <ul className="space-y-1">
            {file.usedBy.map(({ story, ordinal }) => (
              <li key={`${story.id}-${ordinal}`}>
                <StoryLink
                  story={story}
                  label={admin.annotationRef(story.title, ordinal + 1)}
                  deletedLabel={admin.deleted}
                />
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
  ));

const DeletedGroup = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <details>
    <summary className="cursor-pointer text-sm font-medium text-cogapp-gray hover:text-cogapp-charcoal">
      {label}
    </summary>
    <div className="mt-3">{children}</div>
  </details>
);

const AdminImages = async () => {
  const [images, media] = await Promise.all([
    getUploadedImages(),
    getAnnotationMedia(),
  ]);
  const strings = getStrings();
  const { admin } = strings;

  const imageHeaders = [
    admin.imageTableHeaders.filename,
    admin.imageTableHeaders.usedBy,
    admin.imageTableHeaders.created,
    admin.imageTableHeaders.actions,
  ];
  const mediaHeaders = [
    admin.mediaTableHeaders.file,
    admin.mediaTableHeaders.usedBy,
    admin.mediaTableHeaders.uploaded,
    admin.imageTableHeaders.actions,
  ];
  const deletedImages = images.filter((i) => onlyDeletedStories(i.stories));
  const liveImages = images.filter((i) => !onlyDeletedStories(i.stories));
  const storiesOf = (file: MediaFile) => file.usedBy.map((ref) => ref.story);
  const deletedMedia = media.filter((f) => onlyDeletedStories(storiesOf(f)));
  const liveMedia = media.filter((f) => !onlyDeletedStories(storiesOf(f)));

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
          {liveImages.length === 0 ? (
            <p className={`${panelClass} p-8 text-center text-cogapp-gray`}>
              {admin.noImages}
            </p>
          ) : (
            <Table headers={imageHeaders}>
              <ImageRows images={liveImages} admin={admin} />
            </Table>
          )}
          {deletedImages.length > 0 && (
            <DeletedGroup
              label={admin.usedByDeletedStories(deletedImages.length)}
            >
              <Table headers={imageHeaders}>
                <ImageRows images={deletedImages} admin={admin} />
              </Table>
            </DeletedGroup>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{admin.mediaHeading}</h2>
          {liveMedia.length === 0 ? (
            <p className={`${panelClass} p-8 text-center text-cogapp-gray`}>
              {admin.noMedia}
            </p>
          ) : (
            <Table headers={mediaHeaders}>
              <MediaRows media={liveMedia} admin={admin} />
            </Table>
          )}
          {deletedMedia.length > 0 && (
            <DeletedGroup
              label={admin.usedByDeletedStories(deletedMedia.length)}
            >
              <Table headers={mediaHeaders}>
                <MediaRows media={deletedMedia} admin={admin} />
              </Table>
            </DeletedGroup>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminImages;
