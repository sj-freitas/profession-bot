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

export function sortByBooleanPredicate<T>(array: T[], predicate: Predicate<T>) {
  const initialArray = [...array];
  let index = 0;

  return array.sort((a, b) => {
    const currIndex = index;
    index += 1;

    if (predicate(a, currIndex, initialArray)) {
      return -1;
    }
    if (predicate(b, currIndex, initialArray)) {
      return 1;
    }

    return 0;
  });
}

export function getFromArrayAtCircularIndex<T>(array: T[], index: number): T {
  return array[index % array.length];
}
