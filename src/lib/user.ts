import { prisma } from "./prisma";

const DEMO_USER_EMAIL = "demo@knowledge-garden.local";

export async function getOrCreateDemoUser() {
  return prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: {
      email: DEMO_USER_EMAIL,
      name: "Demo User",
    },
  });
}


