import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    return { title: "User not found" };
  }

  const title = `@${user.username}`;
  const description = user.bio ?? `${user.name} — Photographer on spots`;

  return {
    title,
    description,
    openGraph: {
      title: `${user.name} (@${user.username})`,
      description,
      ...(user.avatarUrl ? { images: [user.avatarUrl] } : {}),
    },
  };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
