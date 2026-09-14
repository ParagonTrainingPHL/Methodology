import { PrismaClient } from "../src/generated/prisma";
import { BLOCKS, ASSESSMENT_METRICS } from "../src/lib/constants";
import { normalizeName } from "../src/lib/parse";

const prisma = new PrismaClient();

async function seedBlocks() {
  for (const block of BLOCKS) {
    const record = await prisma.block.upsert({
      where: { key: block.key },
      create: {
        key: block.key,
        name: block.name,
        category: block.category,
        defaultOrder: block.defaultOrder,
        description: block.description,
      },
      update: {
        name: block.name,
        category: block.category,
        defaultOrder: block.defaultOrder,
        description: block.description,
      },
    });

    for (const alias of new Set([...block.aliases, normalizeName(block.name)])) {
      await prisma.blockAlias.upsert({
        where: { raw: alias },
        create: { raw: alias, blockId: record.id },
        update: { blockId: record.id },
      });
    }
  }
  console.log(`Seeded ${BLOCKS.length} blocks`);
}

async function seedAssessmentMetrics() {
  for (const metric of ASSESSMENT_METRICS) {
    await prisma.assessmentMetric.upsert({
      where: { key: metric.key },
      create: {
        key: metric.key,
        name: metric.name,
        category: metric.category,
        unit: metric.unit,
        valueType: metric.valueType,
        defaultOrder: metric.defaultOrder,
        higherIsBetter: metric.higherIsBetter,
        description: metric.description,
      },
      update: {
        name: metric.name,
        category: metric.category,
        unit: metric.unit,
        valueType: metric.valueType,
        defaultOrder: metric.defaultOrder,
        higherIsBetter: metric.higherIsBetter,
        description: metric.description,
      },
    });
  }
  console.log(`Seeded ${ASSESSMENT_METRICS.length} assessment metrics`);
}

async function main() {
  await seedBlocks();
  await seedAssessmentMetrics();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
