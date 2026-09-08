import { PrismaClient, AuthProvider, CompositionType } from "../src/generated/prisma";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      passwordHash,
      provider: AuthProvider.EMAIL,
      username: "alice_photo",
      name: "Alice Dupont",
      bio: "Photographe passionnée de paysages urbains",
      locale: "fr",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      passwordHash,
      provider: AuthProvider.EMAIL,
      username: "bob_captures",
      name: "Bob Martin",
      bio: "Street photographer based in Paris",
      locale: "en",
    },
  });

  // Alice follows Bob
  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: alice.id,
        followingId: bob.id,
      },
    },
    update: {},
    create: {
      followerId: alice.id,
      followingId: bob.id,
    },
  });

  // Sample spots for Alice
  await prisma.spot.upsert({
    where: { id: "seed-spot-1" },
    update: {},
    create: {
      id: "seed-spot-1",
      userId: alice.id,
      latitude: 48.8584,
      longitude: 2.2945,
      address: "5 Avenue Anatole France",
      city: "Paris",
      country: "France",
      photoUrl: "https://placehold.co/800x600/D4A574/1A1A18?text=Eiffel+Tower",
      photoKey: "seed/eiffel-tower.jpg",
      title: "Tour Eiffel au coucher de soleil",
      description: "Vue magnifique avec les reflets dorés sur la Seine",
      isFree: true,
      colors: ["#D4A574", "#2E4A3E", "#F5E6D3"],
      compositions: [CompositionType.SYMMETRY, CompositionType.LEADING_LINES],
      tags: ["sunset", "landmark", "golden-hour"],
    },
  });

  await prisma.spot.upsert({
    where: { id: "seed-spot-2" },
    update: {},
    create: {
      id: "seed-spot-2",
      userId: bob.id,
      latitude: 48.8606,
      longitude: 2.3376,
      address: "Rue de Rivoli",
      city: "Paris",
      country: "France",
      photoUrl: "https://placehold.co/800x600/8B7355/FAFAF8?text=Louvre",
      photoKey: "seed/louvre.jpg",
      title: "Pyramide du Louvre",
      description: "Reflets géométriques dans la cour Napoléon",
      isFree: true,
      colors: ["#8B7355", "#C4B5A0", "#4A5568"],
      compositions: [CompositionType.FIBONACCI, CompositionType.FRAME_IN_FRAME],
      tags: ["architecture", "geometry", "reflection"],
    },
  });

  console.log("✅ Seed complete");
  console.log(`   Users: ${alice.username}, ${bob.username}`);
  console.log(`   Spots: 2`);
  console.log(`   Follows: alice → bob`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
