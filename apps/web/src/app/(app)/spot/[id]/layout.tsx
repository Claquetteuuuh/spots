import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

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
    return { title: "Spot not found" };
  }

  const title = spot.title ?? "Spot";
  const location = [spot.city, spot.country].filter(Boolean).join(", ");
  const description =
    spot.description ?? (location ? `Photography spot in ${location}` : "Photography spot on The Right Spot");

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
