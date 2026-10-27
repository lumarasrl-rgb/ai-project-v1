/** Before anything is unlocked, the other person is only a numbered subject. */
export function subjectLabel(simulationId: number): string {
  return `Subiect ${String(simulationId).padStart(2, "0")}`;
}

export function energyLabel(score: number): string {
  switch (score) {
    case 1:
      return "liniște profundă";
    case 2:
      return "introvertit";
    case 3:
      return "echilibrat";
    case 4:
      return "sociabil selectiv";
    default:
      return "energic social";
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "în așteptare";
    case "simulating":
      return "clonele discută";
    case "completed":
      return "simulare încheiată";
    case "connected":
      return "cameră deschisă";
    case "archived":
      return "arhivat";
    default:
      return status;
  }
}
