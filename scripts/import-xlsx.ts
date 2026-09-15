/**
 * Command-line wrapper around the tracker importer.
 *
 * Usage: npm run import:xlsx -- <path-to-xlsx> [--reset]
 */

import { prisma } from "../src/lib/db";
import { importTrackerWorkbook } from "../src/lib/import-tracker";

async function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((a) => !a.startsWith("--"));

  if (!filePath) {
    console.error("Usage: npm run import:xlsx -- <path-to-xlsx> [--reset]");
    process.exit(1);
  }

  const reset = args.includes("--reset");
  if (reset) console.log("Clearing existing client data");

  const summary = await importTrackerWorkbook(filePath, { reset });

  console.log(`Created ${summary.clients} clients`);
  for (const sheet of summary.perSheet) {
    console.log(`  ${sheet.sheet}: ${sheet.count} ${sheet.kind}`);
  }
  for (const sheet of summary.unmatchedSheets) {
    console.warn(`  ! no client matched for ${sheet}`);
  }

  console.log(
    `\nImported ${summary.sessions} sessions, ${summary.assessments} assessments, ${summary.exercises} exercises`,
  );
  console.log(
    `Inferred a block for ${summary.inferredBlocks} previously unlabelled items`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
