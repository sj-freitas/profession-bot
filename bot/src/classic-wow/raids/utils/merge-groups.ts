export function mergeGroups<T>(initialGroups: T[][]): T[][] {
  // Remove empty arrays
  const groups = initialGroups.filter((group) => group.length > 0);

  // Sort groups in descending order based on their lengths
  groups.sort((a, b) => b.length - a.length);

  const mergedGroups: T[][] = [];

  while (groups.length > 0) {
    let currentGroup = groups.shift()!; // Take the first group

    for (let i = 0; i < groups.length; i += 1) {
      if (currentGroup.length + groups[i].length <= 5) {
        currentGroup = [...currentGroup, ...groups[i]];
        groups.splice(i, 1);
        i -= 1; // Adjust index after removing an element
      }
    }

    mergedGroups.push(currentGroup);
  }

  return mergedGroups;
}
