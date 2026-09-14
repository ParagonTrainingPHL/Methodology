import { normalizeName } from "./parse";

/**
 * Suggests a block for an exercise from its name.
 *
 * Used to backfill sessions logged without a block column, and to pre-select a
 * slot when a new exercise is typed into the builder. Rules are ordered from
 * most to least specific; the first match wins.
 */
const RULES: { block: string; patterns: RegExp[] }[] = [
  {
    block: "STRETCH",
    patterns: [
      /\bstretch\b/,
      /\bdown ?dog/,
      /\bpigeon\b/,
      /\bcouch\b/,
      /\bsit on heels\b/,
    ],
  },
  {
    block: "CARRY",
    patterns: [/\bcarry\b/, /\bfarmer/, /\bsuitcase\b/, /\bwaiter\b/],
  },
  {
    block: "ANTI_EXTENSION",
    patterns: [
      /\bplank\b/,
      /\bdead ?bug\b/,
      /\bstir the pot\b/,
      /\bab ?wheel\b/,
      /\brollout\b/,
      /\bleg lowering\b/,
      /\bhollow\b/,
    ],
  },
  {
    block: "ANTI_ROTATION",
    patterns: [/\bpallof\b/, /\banti.?rotation\b/],
  },
  {
    block: "ROTATION",
    patterns: [/\brotational\b/, /\bcable rotation/, /\bchop\b/, /\blift\b.*\bcable\b/],
  },
  {
    block: "POSTERIOR_CHAIN",
    patterns: [
      /\bslam\b/,
      /\bsmash\b/,
      /\bthrow\b/,
      /\bbox blast\b/,
      /\breverse hyper\b/,
      /\bbroad jump\b/,
      /\bhyperextension\b/,
    ],
  },
  {
    block: "CONDITIONING",
    patterns: [
      /\belliptical\b/,
      /\btread(mill)?\b/,
      /\bassault\b/,
      /\bair ?bike\b/,
      /\bbike\b/,
      /\brow ?erg\b/,
      /\brecumbent\b/,
      /\bsled\b/,
      /\b\d+ ?mile\b/,
      /\bcardio\b/,
      /\bcircuit\b/,
      /\bladder\b/,
      /\bjump rope\b/,
      /\bsprint\b/,
    ],
  },
  {
    block: "HINGE",
    patterns: [
      /\bdeadlift\b/,
      /\brdl\b/,
      /\bhinge\b/,
      /\bleg curl\b/,
      /\bhamstring curl\b/,
      /\bgood ?morning\b/,
      /\bhip thrust\b/,
      /\bbridge\b/,
      /\bkb swing\b/,
      /\bswing\b/,
    ],
  },
  {
    block: "UPPER_PULL",
    patterns: [
      /\brow\b/,
      /\bpull ?down\b/,
      /\bpull ?up\b/,
      /\bchin ?up\b/,
      /\bpull ?over\b/,
      /\bface ?pull\b/,
      /\bpull ?apart\b/,
      /\bcurl\b/,
      /\bshrug\b/,
      /\by ?w ?t\b/,
      /\blat\b/,
    ],
  },
  {
    block: "GLOBAL_OVERHEAD",
    patterns: [
      /\boverhead press\b/,
      /\bohp\b/,
      /\bpush press\b/,
      /\bmilitary press\b/,
      /\bjerk\b/,
    ],
  },
  {
    block: "UPPER_PUSH",
    patterns: [
      /\bpush ?up\b/,
      /\bbench\b/,
      /\bpress\b/,
      /\bdip\b/,
      /\bfly\b/,
      /\btri(cep)? ?ext/,
      /\bside raise\b/,
      /\blateral raise\b/,
      /\babduction\b/,
    ],
  },
  {
    block: "LOWER",
    patterns: [
      /\bsquat\b/,
      /\blunge\b/,
      /\bstep ?up\b/,
      /\bleg press\b/,
      /\bleg ext/,
      /\bwall ?sit\b/,
      /\bsplit squat\b/,
      /\bcalf\b/,
      /\bbox blast\b/,
      /\bskater\b/,
    ],
  },
  {
    block: "CORE",
    patterns: [
      /\bcore\b/,
      /\bcrunch\b/,
      /\bsit ?up\b/,
      /\bmt climber\b/,
      /\bmountain climber\b/,
      /\bleg raise\b/,
      /\bmarch\b/,
    ],
  },
  {
    block: "MOBILITY",
    patterns: [
      /\bmobility\b/,
      /\bcat.?cow\b/,
      /\bthoracic\b/,
      /\b90\/90\b/,
      /\bhip circle/,
      /\binch ?worm\b/,
      /\bworld'?s greatest\b/,
      /\bbird ?dog\b/,
      /\bdowel\b/,
      /\bhip airplane/,
      /\bopener\b/,
    ],
  },
  {
    block: "ACTIVATION",
    patterns: [/\bmini ?band\b/, /\bclamshell\b/, /\bglute\b/, /\bactivation\b/],
  },
  {
    block: "BREATHING",
    patterns: [/\bbreath/, /\bdiaphragm/],
  },
];

export function suggestBlockKey(exerciseName: string): string | null {
  const name = normalizeName(exerciseName);
  if (!name) return null;
  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(name))) return rule.block;
  }
  return null;
}
