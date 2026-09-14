export const DAY_TYPES = ["STRENGTH", "MOVEMENT"] as const;
export type DayType = (typeof DAY_TYPES)[number];

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  STRENGTH: "Strength",
  MOVEMENT: "Movement & Conditioning",
};

export const SESSION_STATUSES = ["PLANNED", "COMPLETED", "SKIPPED"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const CLIENT_STATUSES = ["ACTIVE", "PAUSED", "ARCHIVED"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const BLOCK_CATEGORIES = [
  "PREP",
  "STRENGTH",
  "POWER",
  "CORE",
  "CONDITIONING",
  "RECOVERY",
  "OTHER",
] as const;
export type BlockCategory = (typeof BLOCK_CATEGORIES)[number];

export const BLOCK_CATEGORY_LABELS: Record<BlockCategory, string> = {
  PREP: "Preparation",
  STRENGTH: "Strength",
  POWER: "Power",
  CORE: "Core",
  CONDITIONING: "Conditioning",
  RECOVERY: "Recovery",
  OTHER: "Unsorted",
};

/// The canonical slot vocabulary. `defaultOrder` is the sequence a session
/// flows through: prepare, load, express, condition, restore.
export const BLOCKS: {
  key: string;
  name: string;
  category: BlockCategory;
  defaultOrder: number;
  description?: string;
  aliases: string[];
}[] = [
  {
    key: "WARMUP",
    name: "Warm-Up",
    category: "PREP",
    defaultOrder: 10,
    description: "General cardiovascular prep to raise tissue temperature.",
    aliases: ["warmup", "warm up", "warm-up"],
  },
  {
    key: "BREATHING",
    name: "Breathing",
    category: "PREP",
    defaultOrder: 20,
    description: "Diaphragmatic work to set rib position and down-regulate.",
    aliases: ["breathing"],
  },
  {
    key: "MOBILITY",
    name: "Mobility",
    category: "PREP",
    defaultOrder: 30,
    description: "Joint range work through the movements the session demands.",
    aliases: ["mobility"],
  },
  {
    key: "THORACIC",
    name: "Thoracic",
    category: "PREP",
    defaultOrder: 32,
    aliases: ["thoracic"],
  },
  {
    key: "HIP",
    name: "Hip",
    category: "PREP",
    defaultOrder: 34,
    aliases: ["hip", "hip rotation"],
  },
  {
    key: "HIP_FLEXOR",
    name: "Hip Flexor",
    category: "PREP",
    defaultOrder: 36,
    aliases: ["hip flexor"],
  },
  {
    key: "FULL_BODY_PREP",
    name: "Full Body Prep",
    category: "PREP",
    defaultOrder: 38,
    aliases: ["full body"],
  },
  {
    key: "ACTIVATION",
    name: "Activation",
    category: "PREP",
    defaultOrder: 40,
    description: "Low-load work to recruit the tissue the main lifts rely on.",
    aliases: ["activation"],
  },
  {
    key: "PREHAB",
    name: "Pre-hab",
    category: "PREP",
    defaultOrder: 50,
    description: "Targeted resilience work, often shoulder or knee specific.",
    aliases: ["pre-hab", "prehab", "pre hab"],
  },
  {
    key: "LOWER",
    name: "Lower",
    category: "STRENGTH",
    defaultOrder: 100,
    description: "Knee-dominant lower body loading.",
    aliases: [
      "lower",
      "lower push",
      "lower pull",
      "lower unilateral",
      "unilateral",
      "bilateral",
      "bi lateral lower",
    ],
  },
  {
    key: "HINGE",
    name: "Hinge",
    category: "STRENGTH",
    defaultOrder: 110,
    description: "Hip-dominant loading.",
    aliases: ["hinge"],
  },
  {
    key: "UPPER_PUSH",
    name: "Upper Push",
    category: "STRENGTH",
    defaultOrder: 120,
    aliases: [
      "upper push",
      "upper press",
      "upper",
      "upper combo",
      "upper push 1 b",
      "upper press 1 a",
    ],
  },
  {
    key: "UPPER_PULL",
    name: "Upper Pull",
    category: "STRENGTH",
    defaultOrder: 130,
    aliases: [
      "upper pull",
      "uppper pull",
      "upper pull 1 a",
      "upper pull 1 b",
    ],
  },
  {
    key: "GLOBAL_OVERHEAD",
    name: "Global Overhead",
    category: "STRENGTH",
    defaultOrder: 140,
    aliases: ["global overhead"],
  },
  {
    key: "POSTERIOR_CHAIN",
    name: "Posterior Chain",
    category: "POWER",
    defaultOrder: 150,
    description: "Ballistic and extension-driven posterior work.",
    aliases: ["posterior chain"],
  },
  {
    key: "CARRY",
    name: "Carry",
    category: "STRENGTH",
    defaultOrder: 160,
    description: "Loaded gait. Trunk stiffness expressed while moving.",
    aliases: ["carry"],
  },
  {
    key: "ANTI_EXTENSION",
    name: "Anti-Extension",
    category: "CORE",
    defaultOrder: 200,
    aliases: ["anti-extension", "anti extension", "long lever"],
  },
  {
    key: "ANTI_ROTATION",
    name: "Anti-Rotation",
    category: "CORE",
    defaultOrder: 210,
    aliases: ["anti-rotation", "anti rotation"],
  },
  {
    key: "ROTATION",
    name: "Rotation",
    category: "CORE",
    defaultOrder: 220,
    aliases: ["rotation"],
  },
  {
    key: "LATERAL",
    name: "Lateral",
    category: "CORE",
    defaultOrder: 230,
    aliases: ["lateral"],
  },
  {
    key: "CORE",
    name: "Core",
    category: "CORE",
    defaultOrder: 240,
    aliases: ["core"],
  },
  {
    key: "ZONE_2",
    name: "Zone 2",
    category: "CONDITIONING",
    defaultOrder: 300,
    description: "Conversational aerobic work.",
    aliases: ["zone 2", "zone2"],
  },
  {
    key: "INTERVALS",
    name: "Intervals",
    category: "CONDITIONING",
    defaultOrder: 310,
    aliases: ["intervals", "interval"],
  },
  {
    key: "METCON",
    name: "Met-Con",
    category: "CONDITIONING",
    defaultOrder: 320,
    aliases: ["met con", "metcon", "circuit", "core/conditioning"],
  },
  {
    key: "CONDITIONING",
    name: "Conditioning",
    category: "CONDITIONING",
    defaultOrder: 330,
    aliases: ["conditioning", "cond", "cardio"],
  },
  {
    key: "STRETCH",
    name: "Stretch",
    category: "RECOVERY",
    defaultOrder: 400,
    description: "Session-closing length work.",
    aliases: ["stretch"],
  },
  {
    key: "UNSPECIFIED",
    name: "Unsorted",
    category: "OTHER",
    defaultOrder: 900,
    description:
      "No block was recorded and none could be inferred from the exercise.",
    aliases: [],
  },
];

/// The standing re-evaluation battery. Order mirrors how the assessment is run:
/// girths, then vitals and body mass, then the fitness tests.
export const ASSESSMENT_METRICS: {
  key: string;
  name: string;
  category: "GIRTH" | "VITAL" | "BODY" | "FITNESS";
  unit?: string;
  valueType: "NUMBER" | "TEXT" | "DURATION" | "BILATERAL";
  defaultOrder: number;
  higherIsBetter?: boolean;
  description?: string;
  aliases: string[];
}[] = [
  { key: "ARM", name: "Arm", category: "GIRTH", unit: "cm", valueType: "NUMBER", defaultOrder: 10, aliases: ["arm"] },
  { key: "CHEST", name: "Chest", category: "GIRTH", unit: "cm", valueType: "NUMBER", defaultOrder: 20, aliases: ["chest"] },
  { key: "WAIST", name: "Waist", category: "GIRTH", unit: "cm", valueType: "NUMBER", defaultOrder: 30, higherIsBetter: false, aliases: ["waist"] },
  { key: "HIPS", name: "Hips", category: "GIRTH", unit: "cm", valueType: "NUMBER", defaultOrder: 40, aliases: ["hips", "hip"] },
  { key: "THIGH", name: "Thigh", category: "GIRTH", unit: "cm", valueType: "NUMBER", defaultOrder: 50, aliases: ["thigh"] },
  { key: "CALF", name: "Calf", category: "GIRTH", unit: "cm", valueType: "NUMBER", defaultOrder: 60, aliases: ["calf"] },

  { key: "HEIGHT", name: "Height", category: "BODY", unit: "in", valueType: "NUMBER", defaultOrder: 70, aliases: ["height (inch) shoes off", "height (inch) shoes on", "height"] },
  { key: "WEIGHT", name: "Weight", category: "BODY", unit: "lb", valueType: "NUMBER", defaultOrder: 80, aliases: ["weight (shoes off)", "weight (shoes on)", "weight"] },
  { key: "BLOOD_PRESSURE", name: "Blood Pressure", category: "VITAL", unit: "mmHg", valueType: "TEXT", defaultOrder: 90, higherIsBetter: false, aliases: ["blood pressure"] },

  { key: "SIT_AND_REACH", name: "Sit and Reach", category: "FITNESS", unit: "cm", valueType: "NUMBER", defaultOrder: 100, higherIsBetter: true, description: "Posterior chain and low back flexibility.", aliases: ["sit and reach (scale c)", "sit and reach"] },
  { key: "BACK_EXTENSION", name: "Back Extension", category: "FITNESS", valueType: "NUMBER", defaultOrder: 110, higherIsBetter: true, description: "Posterior chain endurance.", aliases: ["back extension"] },
  { key: "SINGLE_LEG_STAND", name: "Single Leg Stand", category: "FITNESS", unit: "sec", valueType: "BILATERAL", defaultOrder: 120, higherIsBetter: true, description: "Unilateral balance; often performed on foam.", aliases: ["single leg stand", "single leg stand blue foam"] },
  { key: "GRIP", name: "Grip Test", category: "FITNESS", unit: "lb", valueType: "BILATERAL", defaultOrder: 130, higherIsBetter: true, description: "Grip strength. A robust proxy for all-cause mortality risk.", aliases: ["grip test", "grip"] },
  { key: "PLANK", name: "Plank", category: "FITNESS", unit: "sec", valueType: "DURATION", defaultOrder: 140, higherIsBetter: true, aliases: ["plank"] },
  { key: "LEG_PRESS", name: "Leg Press (5/10RM)", category: "FITNESS", unit: "lb", valueType: "TEXT", defaultOrder: 150, higherIsBetter: true, aliases: ["leg press\n(5/10rm)", "leg press (5/10rm)", "leg press"] },
  { key: "LAT_PULLDOWN", name: "Lat Pull-Down (5/10RM)", category: "FITNESS", unit: "lb", valueType: "TEXT", defaultOrder: 160, higherIsBetter: true, aliases: ["lat pull-down \n(5/10rm)", "lat pull-down (5/10rm)", "lat pull-down", "lat pulldown"] },
  { key: "PUSH_UPS", name: "Push-Ups (floor)", category: "FITNESS", unit: "reps", valueType: "NUMBER", defaultOrder: 170, higherIsBetter: true, aliases: ["push-ups (floor)", "push ups (floor)", "push-ups", "push ups"] },
  { key: "CARDIO_TEST", name: "Cardio Test", category: "FITNESS", valueType: "TEXT", defaultOrder: 180, description: "3-minute submaximal effort with heart-rate recovery.", aliases: ["recumbantl (3 mins) level 15", "cardio test"] },
  { key: "POST_TEST_BP", name: "Post-test Blood Pressure", category: "VITAL", unit: "mmHg", valueType: "TEXT", defaultOrder: 190, aliases: ["post-test blood pressure", "post test blood pressure"] },
];

export const BLOCK_CATEGORY_COLORS: Record<BlockCategory, string> = {
  PREP: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  STRENGTH: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  POWER: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  CORE: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  CONDITIONING: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  RECOVERY: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  OTHER: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
};
