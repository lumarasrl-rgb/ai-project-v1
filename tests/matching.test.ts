import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  affinity,
  hasCompatibleEnergy,
  isMutualPreferenceMatch,
  rankCandidates,
  sharedInterests,
  type MatchableProfile,
} from "../src/lib/matching.ts";

function person(overrides: Partial<MatchableProfile> = {}): MatchableProfile {
  return {
    id: "a",
    gender: "male",
    looking_for: "female",
    interests: [],
    introversion_score: 2,
    ...overrides,
  };
}

describe("isMutualPreferenceMatch", () => {
  test("both sides have to want the other", () => {
    const him = person({ gender: "male", looking_for: "female" });
    const her = person({ id: "b", gender: "female", looking_for: "male" });
    assert.equal(isMutualPreferenceMatch(him, her), true);
  });

  test("a one-way interest is not a match", () => {
    const him = person({ gender: "male", looking_for: "female" });
    const her = person({ id: "b", gender: "female", looking_for: "female" });
    assert.equal(isMutualPreferenceMatch(him, her), false);
  });

  test("everyone accepts any gender, in both directions", () => {
    const open = person({ gender: "non_binary", looking_for: "everyone" });
    const her = person({ id: "b", gender: "female", looking_for: "everyone" });
    assert.equal(isMutualPreferenceMatch(open, her), true);
  });

  test("gender 'other' is only reachable by someone open to everyone", () => {
    const other = person({ gender: "other", looking_for: "female" });
    const picky = person({ id: "b", gender: "female", looking_for: "male" });
    const open = person({ id: "c", gender: "female", looking_for: "everyone" });
    assert.equal(isMutualPreferenceMatch(other, picky), false);
    assert.equal(isMutualPreferenceMatch(other, open), true);
  });
});

describe("hasCompatibleEnergy", () => {
  test("allows a gap of one", () => {
    assert.equal(
      hasCompatibleEnergy({ introversion_score: 2 }, { introversion_score: 3 }),
      true,
    );
  });

  test("rejects a gap of two", () => {
    assert.equal(
      hasCompatibleEnergy({ introversion_score: 1 }, { introversion_score: 3 }),
      false,
    );
  });
});

describe("sharedInterests", () => {
  test("is case and whitespace insensitive", () => {
    assert.deepEqual(sharedInterests([" Jazz ", "film"], ["jazz"]), ["jazz"]);
  });

  test("never repeats an interest", () => {
    assert.deepEqual(sharedInterests(["jazz", "Jazz"], ["jazz"]), ["jazz"]);
  });

  test("is empty when nothing overlaps", () => {
    assert.deepEqual(sharedInterests(["jazz"], ["ceramică"]), []);
  });
});

describe("affinity", () => {
  test("shared interests outweigh a matching rhythm", () => {
    const me = person({ interests: ["jazz", "film"], introversion_score: 2 });
    const sameRhythm = person({ id: "b", interests: [], introversion_score: 2 });
    const sameTaste = person({
      id: "c",
      interests: ["jazz", "film"],
      introversion_score: 3,
    });
    assert.ok(affinity(me, sameTaste) > affinity(me, sameRhythm));
  });
});

describe("rankCandidates", () => {
  const me = person({
    id: "me",
    gender: "male",
    looking_for: "female",
    interests: ["jazz", "film"],
    introversion_score: 2,
  });

  const vesper = person({
    id: "vesper",
    gender: "female",
    looking_for: "male",
    interests: ["jazz", "film"],
    introversion_score: 2,
  });
  const lior = person({
    id: "lior",
    gender: "female",
    looking_for: "everyone",
    interests: ["film"],
    introversion_score: 3,
  });
  const loud = person({
    id: "loud",
    gender: "female",
    looking_for: "male",
    interests: ["jazz", "film"],
    introversion_score: 5,
  });
  const wrongWay = person({
    id: "wrongWay",
    gender: "female",
    looking_for: "female",
    interests: ["jazz", "film"],
    introversion_score: 2,
  });

  test("orders by affinity", () => {
    const ranked = rankCandidates(me, [lior, vesper]);
    assert.deepEqual(
      ranked.map((candidate) => candidate.id),
      ["vesper", "lior"],
    );
  });

  test("drops mismatched rhythm and one-way preferences", () => {
    const ranked = rankCandidates(me, [loud, wrongWay, vesper]);
    assert.deepEqual(
      ranked.map((candidate) => candidate.id),
      ["vesper"],
    );
  });

  test("never returns the user themselves", () => {
    assert.deepEqual(rankCandidates(me, [me as MatchableProfile]), []);
  });

  test("skips people already simulated against", () => {
    const ranked = rankCandidates(me, [vesper, lior], {
      excludeUserIds: new Set(["vesper"]),
    });
    assert.deepEqual(
      ranked.map((candidate) => candidate.id),
      ["lior"],
    );
  });

  test("honours the limit", () => {
    const ranked = rankCandidates(me, [vesper, lior], { limit: 1 });
    assert.equal(ranked.length, 1);
  });

  test("is deterministic when affinity ties", () => {
    const first = person({ id: "aaa", gender: "female", looking_for: "male" });
    const second = person({ id: "bbb", gender: "female", looking_for: "male" });
    const plain = person({ id: "me", interests: [] });
    assert.deepEqual(
      rankCandidates(plain, [second, first]).map((c) => c.id),
      ["aaa", "bbb"],
    );
  });
});
