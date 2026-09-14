/**
 * Creates or updates a coach account.
 *
 * Usage: npm run user:create -- <email> <name> [password]
 * A password is generated when one is not supplied.
 */

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const [email, name, supplied] = process.argv.slice(2);

  if (!email || !name) {
    console.error("Usage: npm run user:create -- <email> <name> [password]");
    process.exit(1);
  }

  const password = supplied ?? randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), name, passwordHash, role: "COACH" },
    update: { name, passwordHash },
  });

  console.log(`Account ready for ${user.email}`);
  if (!supplied) console.log(`Password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
