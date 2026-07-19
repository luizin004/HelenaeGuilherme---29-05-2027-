import { PageTitle } from "@/components/admin/ui";
import { CheckinOffline } from "@/components/admin/CheckinOffline";
import { getCheckinList } from "@/app/actions/checkin";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const initial = await getCheckinList();

  return (
    <>
      <PageTitle>Check-in</PageTitle>
      <CheckinOffline initial={initial} />
    </>
  );
}
