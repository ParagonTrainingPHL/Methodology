import assert from "node:assert/strict";
import { test } from "node:test";

import {
  estimate1RM,
  parseBilateral,
  parseBloodPressure,
  parseDuration,
  parsePerformedSets,
  parseRepList,
  parseRepeatedMeasure,
  looksLikePerSetLog,
} from "./parse";

test("per-set loads split on commas", () => {
  const sets = parsePerformedSets("77,88,88", 3);
  assert.deepEqual(
    sets.map((s) => s.load),
    [77, 88, 88],
  );
});

test("recovers loads Excel collapsed into one integer", () => {
  assert.deepEqual(
    parsePerformedSets(110125125, 3).map((s) => s.load),
    [110, 125, 125],
  );
  // Fewer values than sets: "130,140" logged against a 3-set prescription.
  assert.deepEqual(
    parsePerformedSets(130140, 3).map((s) => s.load),
    [130, 140],
  );
});

test("a plain load is a single set", () => {
  assert.deepEqual(
    parsePerformedSets(110, 3).map((s) => s.load),
    [110],
  );
});

test("a restated prescription is not a performed load", () => {
  const sets = parsePerformedSets("1×2 min", 1);
  assert.equal(sets[0].load, null);
  assert.equal(sets[0].loadRaw, "1×2 min");
});

test("distinguishes per-set logs from prescriptions", () => {
  assert.equal(looksLikePerSetLog("35,40,50", 3), true);
  assert.equal(looksLikePerSetLog("35 lb DB", 3), false);
  assert.equal(looksLikePerSetLog("Bodyweight", 3), false);
  assert.equal(looksLikePerSetLog(110125125, 3), true);
});

test("per-set reps, but not rep ranges", () => {
  assert.deepEqual(parseRepList("12,12,12"), [12, 12, 12]);
  assert.deepEqual(parseRepList("15,15,12"), [15, 15, 12]);
  assert.equal(parseRepList("10–12"), null);
  assert.equal(parseRepList("45–60 sec/side"), null);
  assert.equal(parseRepList("10"), null);
});

test("blood pressure is read out of surrounding prose", () => {
  assert.deepEqual(parseBloodPressure("147/88 BP-start "), {
    systolic: 147,
    diastolic: 88,
  });
  assert.deepEqual(parseBloodPressure("BP 156/88"), {
    systolic: 156,
    diastolic: 88,
  });
  assert.equal(parseBloodPressure("no reading"), null);
  // Diastolic above systolic is a mis-key, not a reading.
  assert.equal(parseBloodPressure("88/147"), null);
});

test("a side label binds to the run that follows it", () => {
  assert.deepEqual(parseBilateral("R: 111.9, 122 L: 117, 109.3"), {
    right: 122,
    left: 117,
  });
  assert.deepEqual(parseBilateral("115R 111L 117R 112L"), {
    right: 117,
    left: 112,
  });
  assert.deepEqual(parseBilateral("52R 53L"), { right: 52, left: 53 });
});

test("balance times normalise minutes to seconds", () => {
  assert.deepEqual(parseBilateral("R: 1 min L: 45s", { asSeconds: true }), {
    right: 60,
    left: 45,
  });
});

test("a typed 1:15 is 75 seconds, not 75 minutes", () => {
  assert.equal(parseDuration(new Date(Date.UTC(1899, 11, 30, 1, 15, 0))), 75);
  assert.equal(parseDuration(":39"), 39);
  assert.equal(parseDuration("2 min"), 120);
  assert.equal(parseDuration("45 sec"), 45);
});

test("repeated measures average", () => {
  assert.equal(parseRepeatedMeasure("43.2, 41.5cm"), 42.35);
  assert.equal(parseRepeatedMeasure("46cm, 46cm"), 46);
  assert.equal(parseRepeatedMeasure("284.4lb"), 284.4);
});

test("epley estimate", () => {
  assert.equal(estimate1RM(295, 13), 422.8);
});
