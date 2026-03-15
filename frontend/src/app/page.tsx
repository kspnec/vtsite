import VillageOverview from "@/components/VillageOverview";
import MembersSection from "@/components/MembersSection";

interface SearchParams {
  village_area?: string;
  current_status?: string;
}

export const revalidate = 60;

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  return (
    <div>
      <VillageOverview />
      <MembersSection searchParams={params} />
    </div>
  );
}
