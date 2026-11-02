import Link from "next/link";
import DeleteStoryButton from "@/components/DeleteStoryButton";
import RestoreStoryButton from "@/components/RestoreStoryButton";
import { Header, panelClass, textLinkClass } from "@/components/ui";
import { getAllStories } from "@/lib/actions";
import { formatDate, getStrings } from "@/lib/i18n/strings";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

type Story = Awaited<ReturnType<typeof getAllStories>>[number];
type Strings = ReturnType<typeof getStrings>;

const StoryTable = ({
  stories,
  strings,
}: {
  stories: Story[];
  strings: Strings;
}) => {
  const { admin } = strings;
  return (
    <div className={`${panelClass} overflow-x-auto`}>
      <table className="w-full text-left">
        <thead className="border-b border-cogapp-charcoal/10 text-xs text-cogapp-gray">
          <tr>
            <th className="px-4 py-3 font-medium">
              {admin.tableHeaders.story}
            </th>
            <th className="px-4 py-3 font-medium text-right">
              {admin.tableHeaders.annotations}
            </th>
            <th className="px-4 py-3 font-medium">
              {admin.tableHeaders.updated}
            </th>
            <th className="px-4 py-3 font-medium">
              <span className="sr-only">{admin.tableHeaders.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cogapp-charcoal/10">
          {stories.map((story) => {
            const isDeleted = story.deletedAt !== null;
            return (
              <tr key={story.id} className="align-top hover:bg-cogapp-cream/40">
                <td className="px-4 py-3">
                  {isDeleted ? (
                    <span className="font-medium text-cogapp-gray">
                      {story.title}
                    </span>
                  ) : (
                    <Link
                      href={`/editor/${story.id}`}
                      className="font-medium hover:underline"
                    >
                      {story.title}
                    </Link>
                  )}
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-cogapp-gray">
                    {story.author && (
                      <span>{admin.byAuthor(story.author)}</span>
                    )}
                    <span className="font-mono" title={story.id}>
                      {story.id.slice(0, 8)}
                    </span>
                    {story.deletedAt && (
                      <span className="text-danger">
                        {admin.deletedOn(formatDate(story.deletedAt))}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {story._count.annotations}
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap text-cogapp-gray">
                  {formatDate(story.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                    {isDeleted ? (
                      <RestoreStoryButton storyId={story.id} />
                    ) : (
                      <>
                        <Link
                          href={`/editor/${story.id}`}
                          className={`${textLinkClass} font-medium mr-3`}
                        >
                          {admin.actionLabels.edit}
                        </Link>
                        <span className="text-xs text-cogapp-gray">
                          {admin.previewLabel}
                        </span>
                        {(
                          [
                            ["storiiies", admin.actionLabels.storiiies],
                            ["clover", admin.actionLabels.clover],
                            ["mirador", admin.actionLabels.mirador],
                            ["annona", admin.actionLabels.annona],
                          ] as const
                        ).map(([viewer, label]) => (
                          <Link
                            key={viewer}
                            href={`/preview/${viewer}/${story.id}`}
                            className={textLinkClass}
                          >
                            {label}
                          </Link>
                        ))}
                        <a
                          href={`/api/manifest/${story.id}`}
                          target="_blank"
                          rel="noopener"
                          className={textLinkClass}
                        >
                          {admin.actionLabels.manifest}
                        </a>
                        {isDev && <DeleteStoryButton storyId={story.id} />}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default async function AdminStoriiies() {
  const stories = await getAllStories();
  const strings = getStrings();
  const active = stories.filter((s) => s.deletedAt === null);
  const deleted = stories.filter((s) => s.deletedAt !== null);

  return (
    <div className="min-h-screen bg-cogapp-cream">
      <Header
        title={strings.admin.allStoriesTitle}
        backLink={{ href: "/admin", label: strings.common.admin }}
        actions={
          <span className="text-sm text-cogapp-cream">
            {strings.admin.storiesCount(active.length)}
          </span>
        }
      />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {active.length === 0 ? (
          <p className={`${panelClass} p-8 text-center text-cogapp-gray`}>
            {strings.admin.noStories}
          </p>
        ) : (
          <StoryTable stories={active} strings={strings} />
        )}

        {deleted.length > 0 && (
          <details>
            <summary className="cursor-pointer text-sm font-medium text-cogapp-gray hover:text-cogapp-charcoal">
              {strings.admin.deletedStories(deleted.length)}
            </summary>
            <div className="mt-3">
              <StoryTable stories={deleted} strings={strings} />
            </div>
          </details>
        )}
      </main>
    </div>
  );
}
