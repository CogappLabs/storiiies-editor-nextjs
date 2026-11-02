import { notFound } from "next/navigation";
import Editor from "@/components/Editor";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ButtonLink, Header, panelClass } from "@/components/ui";
import { getStrings } from "@/lib/i18n/strings";
import { getStory, isStoryDeleted } from "@/lib/queries";

export const dynamic = "force-dynamic";

const EditorPage = async ({ params }: PageProps<"/editor/[id]">) => {
  const { id } = await params;
  const story = await getStory(id);
  const strings = getStrings();

  if (!story) {
    const deleted = await isStoryDeleted(id);
    if (deleted) {
      return (
        <div className="min-h-screen bg-cogapp-cream">
          <Header
            title={strings.editor.deletedTitle}
            backLink={{ href: "/", label: strings.common.back }}
          />
          <main className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className={`${panelClass} p-8`}>
              <h2 className="text-xl font-semibold text-cogapp-charcoal mb-4">
                {strings.editor.deletedHeading}
              </h2>
              <p className="text-cogapp-gray mb-6">
                {strings.editor.deletedMessage}
              </p>
              <ButtonLink href="/" variant="primary">
                {strings.editor.deletedBackHome}
              </ButtonLink>
            </div>
          </main>
        </div>
      );
    }
    notFound();
  }

  return (
    <ErrorBoundary>
      <Editor story={story} />
    </ErrorBoundary>
  );
};

export default EditorPage;
