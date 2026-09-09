import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const t = getTranslator(await getServerLocale());

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
    return { title: t("users.notFound") };
  }

  const title = `@${user.username}`;
  const description =
    user.bio ?? t("users.metaDescription", { name: user.name });

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
