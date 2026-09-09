import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = getTranslator(await getServerLocale());

  const spot = await prisma.spot.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      photoUrl: true,
      city: true,
      country: true,
    },
  });

  if (!spot) {
    return { title: t("spots.notFound") };
  }

  const title = spot.title ?? t("spots.untitled");
  const location = [spot.city, spot.country].filter(Boolean).join(", ");
  const description =
    spot.description ??
    (location
      ? t("spots.metaDescriptionAt", { location })
      : t("spots.metaDescription"));

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [spot.photoUrl],
    },
  };
}

export default function SpotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
