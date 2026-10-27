export interface TranscriptLine {
  speaker: "mine" | "theirs" | "narration";
  text: string;
}

/**
 * Claude returns the simulation as plain text, one `pseudonim: replică` per
 * line. We turn it into structured lines and strip the pseudonyms — on the
 * dashboard nobody has a name yet.
 */
export function parseTranscript(
  transcript: string,
  myUsername: string,
  theirUsername: string,
): TranscriptLine[] {
  const mine = myUsername.trim().toLowerCase();
  const theirs = theirUsername.trim().toLowerCase();

  return transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const separator = line.indexOf(":");
      if (separator > 0 && separator < 42) {
        const label = line
          .slice(0, separator)
          .replace(/^[-–•*\s]+/, "")
          .trim()
          .toLowerCase();
        const text = line.slice(separator + 1).trim();

        if (text.length > 0) {
          if (label.includes(mine) || label === "clona a" || label === "a") {
            return { speaker: "mine", text } as const;
          }
          if (label.includes(theirs) || label === "clona b" || label === "b") {
            return { speaker: "theirs", text } as const;
          }
        }
      }
      return { speaker: "narration", text: line } as const;
    });
}

/** Strips the quotation marks Claude sometimes wraps replies in. */
export function unquote(text: string): string {
  return text.replace(/^["“„«]\s*/, "").replace(/\s*["”“»]$/, "");
}
