export function findMissingFields<T extends object>(
  body: Partial<T> | undefined,
  fields: (keyof T)[],
): (keyof T)[] {
  return fields.filter((field) => {
    const value = body?.[field];
    return value === undefined || value === null || value === "";
  });
}
