export function toEntityValue<TValue>(
  value: string | null | undefined,
  toEntity: (x: string) => TValue = (x) => x as TValue,
): TValue[] {
  return `${value}`
    .split(";")
    .map((t) => t.trim())
    .filter((t) => Boolean(t))
    .map((t) => toEntity(t));
}

export function toColumnValue<TValue>(
  arrayValue: TValue[],
  toString: (x: TValue) => string = (x) => `${x}`,
): string {
  return arrayValue.map((t) => toString(t).trim()).join(";");
}

export function parseIntOrDefault(text: string, fallback: number): number {
  const parsed = Number.parseInt(text, 10);

  return Number.isInteger(parsed) ? parsed : fallback;
}
