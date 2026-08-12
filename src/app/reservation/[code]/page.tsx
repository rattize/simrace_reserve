import ReservationDetailClient from "./ReservationDetailClient";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <ReservationDetailClient code={code.toUpperCase()} />;
}
