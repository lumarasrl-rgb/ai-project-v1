import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseTranscript, unquote } from "../src/lib/transcript.ts";

describe("parseTranscript", () => {
  test("attributes each line to the right clone", () => {
    const lines = parseTranscript(
      "nocturn: Liniștea e un lux.\nvesper: O cumpăr dimineața.",
      "nocturn",
      "vesper",
    );
    assert.deepEqual(
      lines.map((line) => line.speaker),
      ["mine", "theirs"],
    );
    assert.equal(lines[0]?.text, "Liniștea e un lux.");
  });

  test("ignores the case Claude happened to use", () => {
    const lines = parseTranscript("Nocturn: salut", "nocturn", "vesper");
    assert.equal(lines[0]?.speaker, "mine");
  });

  test("understands the generic clone labels", () => {
    const lines = parseTranscript(
      "clona a: una\nclona b: alta",
      "nocturn",
      "vesper",
    );
    assert.deepEqual(
      lines.map((line) => line.speaker),
      ["mine", "theirs"],
    );
  });

  test("strips list bullets Claude sometimes adds", () => {
    const lines = parseTranscript("- nocturn: salut", "nocturn", "vesper");
    assert.equal(lines[0]?.speaker, "mine");
  });

  test("drops blank lines", () => {
    assert.equal(
      parseTranscript("nocturn: a\n\n\nvesper: b", "nocturn", "vesper").length,
      2,
    );
  });

  test("keeps an unattributed line as narration rather than guessing", () => {
    const lines = parseTranscript("Cele două clone tac.", "nocturn", "vesper");
    assert.equal(lines[0]?.speaker, "narration");
    assert.equal(lines[0]?.text, "Cele două clone tac.");
  });

  test("a colon deep inside prose does not become a speaker label", () => {
    const line =
      "Au vorbit despre tot ce contează pentru amândoi, inclusiv despre asta: liniștea.";
    assert.equal(
      parseTranscript(line, "nocturn", "vesper")[0]?.speaker,
      "narration",
    );
  });

  test("an empty transcript yields no lines", () => {
    assert.deepEqual(parseTranscript("   \n  ", "nocturn", "vesper"), []);
  });
});

describe("unquote", () => {
  test("removes the Romanian quotation marks", () => {
    assert.equal(unquote("„Liniștea e un lux.”"), "Liniștea e un lux.");
  });

  test("removes straight quotes", () => {
    assert.equal(unquote('"salut"'), "salut");
  });

  test("leaves unquoted text alone", () => {
    assert.equal(unquote("salut"), "salut");
  });
});
