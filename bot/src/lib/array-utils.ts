export type FilterTwoResult<T> = [predicated: T[], notPredicated: T[]];
export type Predicate<T> = (value: T, index: number, array: T[]) => boolean;

export function negatePredicate<T>(predicate: Predicate<T>): Predicate<T> {
  return (value: T, index: number, array: T[]) =>
    !predicate(value, index, array);
}

export function filterTwo<T>(
  array: T[],
  predicate: Predicate<T>,
): FilterTwoResult<T> {
  return [array.filter(predicate), array.filter(negatePredicate(predicate))];
}
