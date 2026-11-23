import { getInfoPosition } from "@/lib/queries";
import StoriiiesPreview from "./StoriiiesPreview";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <StoriiiesPreview infoPosition={await getInfoPosition(id)} />;
};

export default Page;
