/* ───────────────────────────── palette (from user spec) ─────────────── */
export const P = {
  bg: "#0a0e14",
  onBg: "#f1f3fc",
  surfaceLowest: "#000000",
  primary: "#e08dff",
  primaryContainer: "#d978ff",
  secondary: "#00ffff",
  tertiary: "#0070ff",
  glass: "rgba(224, 141, 255, 0.6)",
  ghostBorder: "rgba(241, 243, 252, 0.15)",
  ambientPrimary: "rgba(224, 141, 255, 0.10)",
  ambientSecondary: "rgba(0, 255, 255, 0.10)",
};

/* ────────────────────── sample problem data (Two Sum) ───────────────── */
export const PROBLEM = {
  title: "Two Sum",
  description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to* \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the *same* element twice.

You can return the answer in **any order**.`,
  examples: [
    {
      id: 1,
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation:
        "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      id: 2,
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]",
    },
    {
      id: 3,
      input: "nums = [3,3], target = 6",
      output: "[0,1]",
    },
  ],
  constraints: [
    "2 <= nums.length <= 10⁴",
    "-10⁹ <= nums[i] <= 10⁹",
    "-10⁹ <= target <= 10⁹",
    "Only one valid answer exists.",
  ],
  testCases: [
    { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
    { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
    { input: "[3,3]\n6", expectedOutput: "[0,1]" },
  ],
};

export const DEFAULT_CODE = `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {

    }
};`;

export const LANGUAGES = [
  { label: "C++", value: "cpp" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
];

/* ──── sample power card & opponent data (placeholders for SpacetimeDB) ── */
export const POWER_CARD = {
  name: "FlashbangCard",
  used: false,
};

export const OPPONENT = {
  username: "r4ndom_pikachu",
  isTyping: true,
  cardUsed: null as string | null,
  hasSubmitted: false,
};
