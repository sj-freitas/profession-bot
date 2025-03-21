import { mergeGroups } from "./merge-groups";

interface TestCase {
  inputGroups: string[];
  expectedGroups: string[];
}

const testCases: TestCase[] = [
  {
    inputGroups: ["ABCDE", "FGH", "JKLM", "NO"],
    expectedGroups: ["AAAAA", "AAAAA", "AAAA"],
  },
  {
    inputGroups: ["ABCDE", "FGH", "J", "K"],
    expectedGroups: ["AAAAA", "AAAAA"],
  },
  {
    inputGroups: ["ABCDE", "FGH", "JK", "L"],
    expectedGroups: ["AAAAA", "AAAAA", "A"],
  },
  {
    inputGroups: ["ABCDE", "FGH", "JK", "L", "MN"],
    expectedGroups: ["AAAAA", "AAAAA", "AAA"],
  },
  {
    inputGroups: ["AB", "CD", "EF", "G", "HI"],
    expectedGroups: ["AAAAA", "AAAA"],
  },
  {
    inputGroups: ["AB", "CD", "EF", "G", "HIJ"],
    expectedGroups: ["AAAAA", "AAAAA"],
  },
  {
    inputGroups: ["ABC", "DE", "F", "GH", "I"],
    expectedGroups: ["AAAAA", "AAAA"],
  },
  {
    inputGroups: ["ABCD", "EFG", "HIJ", "KL", "MN"],
    expectedGroups: ["AAAAA", "AAAAA", "AAAA"],
  },
];

function toArrayOfArrays(group: string[]): string[][] {
  return group.map((t) => t.split(""));
}

describe("mergeGroups", () => {
  it("test cases make sense", () => {
    for (const curr of testCases) {
      expect(curr.expectedGroups).toBeDefined();
      expect(curr.inputGroups).toBeDefined();
      expect(
        curr.expectedGroups.every(
          (t) => typeof t === "string" && t.length <= 5,
        ),
      ).toBe(true);
      expect(
        curr.inputGroups.every((t) => typeof t === "string" && t.length <= 5),
      ).toBe(true);
    }
  });

  describe("works for all test cases", () => {
    testCases.forEach((currTestCase, idx) => {
      it(`case ${idx + 1}`, () => {
        const group = mergeGroups(
          toArrayOfArrays(currTestCase.inputGroups),
        ).sort((a, b) => b.length - a.length);

        // Find all unique initial groups not separated
        for (const curr of currTestCase.inputGroups) {
          // Find the group
          let groupFound = false;
          for (const currResult of group) {
            groupFound = currResult.join("").indexOf(curr) >= 0;
            if (groupFound) {
              break;
            }
          }
          expect(groupFound).toBe(true);
        }

        // Compare shapes
        expect(group).toHaveLength(currTestCase.expectedGroups.length);
        for (let i = 0; i < currTestCase.expectedGroups.length; i += 1) {
          expect(group[i]).toHaveLength(currTestCase.expectedGroups[i].length);
        }

        // Make sure all letters are equal
        // Compare expected group sizes
        const initialSize = currTestCase.inputGroups.join("").length;
        const allLetters = new Set(
          group
            .map((t) => t.join(""))
            .join("")
            .split(""),
        );
        expect(allLetters.size).toBe(initialSize);
      });
    });
  });
});
