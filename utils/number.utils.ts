export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/** Accepts a number or numeric string (e.g. URL param `"3"`). */
export function parseId(value: unknown): number | null {
  if (isPositiveInteger(value)) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const id = Number(value.trim());
    return id > 0 ? id : null;
  }
  return null;
}
