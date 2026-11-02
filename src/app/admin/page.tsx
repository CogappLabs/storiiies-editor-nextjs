import Link from "next/link";
import { Header, panelClass } from "@/components/ui";
import { getStrings } from "@/lib/i18n/strings";

const AdminDashboard = () => {
  const strings = getStrings();
  return (
    <div className="min-h-screen bg-cogapp-cream">
      <Header
        title={strings.app.adminTitle}
        subtitle={strings.app.adminSubtitle}
        backLink={{ href: "/", label: strings.common.back }}
      />
      <main className="max-w-4xl mx-auto p-8">
        <div className="grid gap-4">
          <Link
            href="/admin/storiiies"
            className={`${panelClass} block p-6 hover:border-cogapp-charcoal transition-colors`}
          >
            <h2 className="text-lg font-semibold">
              {strings.viewers.storiiies}
            </h2>
            <p className="text-cogapp-gray mt-1">
              {strings.admin.cardDescription}
            </p>
          </Link>
          <Link
            href="/admin/images"
            className={`${panelClass} block p-6 hover:border-cogapp-charcoal transition-colors`}
          >
            <h2 className="text-lg font-semibold">
              {strings.admin.allImagesTitle}
            </h2>
            <p className="text-cogapp-gray mt-1">
              {strings.admin.imagesCardDescription}
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
