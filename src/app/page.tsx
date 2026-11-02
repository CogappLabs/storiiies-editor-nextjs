import Link from "next/link";
import CreateStoryForm from "@/components/CreateStoryForm";
import { Header } from "@/components/ui";
import { getStories } from "@/lib/actions";
import { formatDate, getStrings } from "@/lib/i18n/strings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const stories = await getStories();
  const strings = getStrings();

  return (
    <div className="min-h-screen bg-cogapp-cream">
      <Header title={strings.app.title} subtitle={strings.app.subtitle} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {strings.home.createSectionTitle}
            </h2>
            <CreateStoryForm />
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {strings.home.allStoriesTitle}
              </h2>
              <Link
                href="/admin"
                className="text-sm text-cogapp-gray hover:text-cogapp-charcoal"
              >
                {strings.home.adminLinkLabel}
              </Link>
            </div>

            {stories.length === 0 ? (
              <p className="text-gray-500">{strings.home.noStoriesMessage}</p>
            ) : (
              <div className="space-y-3">
                {stories.map((story) => (
                  <Link
                    key={story.id}
                    href={`/editor/${story.id}`}
                    className="block p-4 border rounded-lg hover:border-cogapp-lavender hover:bg-cogapp-lavender transition-colors"
                  >
                    <h3 className="font-medium">{story.title}</h3>
                    {story.author && (
                      <p className="text-sm text-gray-500">
                        {strings.home.byAuthor(story.author)}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        {strings.home.storyAnnotationsLabel(
                          story._count.annotations,
                        )}
                      </span>
                      <span>
                        {strings.home.storyUpdatedLabel(
                          formatDate(story.updatedAt),
                        )}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
