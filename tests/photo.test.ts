import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  FULLY_REVEALED_AT,
  PHOTO_STAGES,
  nextPhotoStage,
  photoObjectPath,
  photoProgress,
  stageFor,
} from "../src/lib/photo.ts";

describe("the blur ladder", () => {
  test("starts unreadable", () => {
    const start = stageFor(0);
    assert.equal(start.level, 5);
    // Past roughly sigma 20 on a 768px image a face is an undifferentiated
    // blob; going much higher buys no privacy and wastes a rung of the ladder.
    assert.ok(start.sigma >= 20, "the first stage must give nothing away");
  });

  test("the rungs are spaced so each one is visibly different", () => {
    // Blur reads on a log scale, so equal steps look identical at the blurry
    // end. Each rung should cut the sigma by a real fraction, not a fixed
    // amount — this is what stops stages 5..2 looking like the same picture.
    const blurred = PHOTO_STAGES.filter((stage) => stage.sigma > 0);
    for (let index = 1; index < blurred.length; index += 1) {
      const ratio = blurred[index - 1]!.sigma / blurred[index]!.sigma;
      assert.ok(
        ratio >= 1.5,
        `stage ${blurred[index]!.level} is only ${ratio.toFixed(2)}x sharper than the one before`,
      );
    }
  });

  test("only the last stage is unblurred", () => {
    const clear = PHOTO_STAGES.filter((stage) => stage.sigma === 0);
    assert.equal(clear.length, 1);
    assert.equal(clear[0]?.at, FULLY_REVEALED_AT);
  });

  test("gets monotonically sharper, never back", () => {
    for (let index = 1; index < PHOTO_STAGES.length; index += 1) {
      const previous = PHOTO_STAGES[index - 1]!;
      const current = PHOTO_STAGES[index]!;
      assert.ok(current.at > previous.at, "thresholds must climb");
      assert.ok(current.sigma < previous.sigma, "blur must shrink");
    }
  });

  test("a message count never earns more than it should", () => {
    assert.equal(stageFor(9).level, 5);
    assert.equal(stageFor(10).level, 4);
    assert.equal(stageFor(19).level, 4);
    assert.equal(stageFor(49).level, 1);
    assert.equal(stageFor(50).level, 0);
  });

  test("stays clear once past the last threshold", () => {
    assert.equal(stageFor(5000).sigma, 0);
  });

  test("a negative or nonsense count falls back to the blurriest stage", () => {
    assert.equal(stageFor(-1).level, 5);
  });
});

describe("nextPhotoStage", () => {
  test("points at the first sharpening from zero", () => {
    assert.equal(nextPhotoStage(0)?.at, 10);
  });

  test("is null once the photo is clear", () => {
    assert.equal(nextPhotoStage(FULLY_REVEALED_AT), null);
  });
});

describe("photoProgress", () => {
  test("is zero at a threshold and half way between", () => {
    assert.equal(photoProgress(10), 0);
    assert.equal(photoProgress(15), 0.5);
  });

  test("is full once nothing is left", () => {
    assert.equal(photoProgress(FULLY_REVEALED_AT), 1);
  });

  test("stays within 0..1 throughout", () => {
    for (let count = 0; count <= 70; count += 1) {
      const progress = photoProgress(count);
      assert.ok(progress >= 0 && progress <= 1, `out of range at ${count}`);
    }
  });
});

describe("photoObjectPath", () => {
  test("puts every variant under the owner's folder", () => {
    assert.equal(photoObjectPath("abc", 3), "abc/3.jpg");
  });
});
