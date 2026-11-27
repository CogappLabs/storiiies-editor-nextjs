import { getStoriiiesOptions } from "@/lib/queries";
import StoriiiesPreview from "./StoriiiesPreview";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <StoriiiesPreview {...(await getStoriiiesOptions(id))} />;
};

export default Page;
