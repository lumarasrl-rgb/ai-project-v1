import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  MESSAGES_PER_UNLOCK,
  REVEALS,
  nextReveal,
  unlockProgress,
  unlockedReveals,
  type RevealSource,
} from "../src/lib/unlocks.ts";

const them: RevealSource = {
  username: "vesper",
  age: 31,
  interests: ["jazz", "ceramică", "film", "drumeții", "cafea"],
  introversion_score: 2,
  bio_summary: "Un ritm lent, deliberat.",
};

describe("unlockedReveals", () => {
  test("gives nothing away before the first threshold", () => {
    assert.deepEqual(unlockedReveals(9, them), []);
  });

  test("opens exactly one fragment at ten messages", () => {
    const reveals = unlockedReveals(10, them);
    assert.equal(reveals.length, 1);
    assert.equal(reveals[0]?.field, "energy");
  });

  test("accumulates, oldest first", () => {
    assert.deepEqual(
      unlockedReveals(30, them).map((reveal) => reveal.field),
      ["energy", "interests", "portrait"],
    );
  });

  test("the name only appears at forty", () => {
    assert.ok(!unlockedReveals(39, them).some((r) => r.field === "handle"));
    const atForty = unlockedReveals(40, them);
    assert.equal(atForty.at(-1)?.value, "vesper");
  });

  test("every reveal carries a value", () => {
    for (const reveal of unlockedReveals(999, them)) {
      assert.ok(reveal.value.length > 0, `${reveal.field} was empty`);
    }
  });

  test("survives a profile with nothing written in it", () => {
    const sparse: RevealSource = {
      username: "x",
      age: 18,
      interests: [],
      introversion_score: 3,
      bio_summary: null,
    };
    for (const reveal of unlockedReveals(999, sparse)) {
      assert.ok(reveal.value.length > 0, `${reveal.field} was empty`);
    }
  });

  test("shows at most four interests, not the whole list", () => {
    const reveal = unlockedReveals(20, them).find(
      (candidate) => candidate.field === "interests",
    );
    assert.equal(reveal?.value.split(" · ").length, 4);
  });
});

describe("nextReveal", () => {
  test("points at the first one from zero", () => {
    assert.equal(nextReveal(0)?.at, MESSAGES_PER_UNLOCK);
  });

  test("moves on once a threshold is reached", () => {
    assert.equal(nextReveal(10)?.at, 20);
  });

  test("is null when everything is open", () => {
    assert.equal(nextReveal(REVEALS.at(-1)!.at), null);
  });
});

describe("unlockProgress", () => {
  test("is zero at a threshold and one just before the next", () => {
    assert.equal(unlockProgress(10), 0);
    assert.equal(unlockProgress(15), 0.5);
  });

  test("is full once nothing is left to unlock", () => {
    assert.equal(unlockProgress(1000), 1);
  });

  test("stays within 0..1 at every message count", () => {
    for (let count = 0; count <= 60; count += 1) {
      const progress = unlockProgress(count);
      assert.ok(progress >= 0 && progress <= 1, `out of range at ${count}`);
    }
  });
});
