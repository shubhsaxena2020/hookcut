import { UseCasePage, caseMetadata } from "@/components/site/UseCasePage";
import { getUseCase } from "@/lib/usecases";

const u = getUseCase("twitch-clip-to-tiktok")!;
export const metadata = caseMetadata(u);

export default function Page() {
  return <UseCasePage u={u} />;
}
