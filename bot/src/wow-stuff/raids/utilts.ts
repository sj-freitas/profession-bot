export function pickOnePutOnTop<T>(array: T[], preselected?: T): T[] {
  const element =
    preselected ?? array[Math.floor(Math.random() * array.length)];

  return [element, ...array.filter((t) => t !== element)];
}

export function pickOneAtRandomAndRemoveFromArray<T>(
  array: T[],
  random: () => number = Math.random,
): T | null {
  if (array.length === 0) {
    return null;
  }

  const indexOfElementToRemove = Math.floor(random() * array.length);

  return array.splice(indexOfElementToRemove, 1)[0];
}
