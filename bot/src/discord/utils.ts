export function parseDiscordHandles(handles: string): string[] {
  return handles
    .split("@")
    .filter((t) => Boolean(t))
    .map((t) => `@${t.trim()}`);
}
