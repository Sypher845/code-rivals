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
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists.",
  ],
  testCases: [
    { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
    { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
    { input: "[3,3]\n6", expectedOutput: "[0,1]" },
  ],
};

export type SupportedLanguage = "cpp" | "java";

export type LanguageConfig = {
  label: string;
  value: SupportedLanguage;
  monacoLanguage: "cpp" | "java";
  pistonLanguage: string;
  mainFileName: string;
  starterCode: string;
};

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  cpp: {
    label: "C++",
    value: "cpp",
    monacoLanguage: "cpp",
    pistonLanguage: "c++",
    mainFileName: "main.cpp",
    starterCode: `#include <iostream>
#include <string>

using namespace std;

int main() {
    string input;
    getline(cin, input);

    // Write your solution here.
    cout << input << '\\n';
    return 0;
}
`,
  },
  java: {
    label: "Java",
    value: "java",
    monacoLanguage: "java",
    pistonLanguage: "java",
    mainFileName: "Main.java",
    starterCode: `import java.io.BufferedReader;
import java.io.InputStreamReader;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String input = reader.readLine();
        if (input == null) {
            input = "";
        }

        // Write your solution here.
        System.out.println(input);
    }
}
`,
  },
};

export const LANGUAGES = Object.values(LANGUAGE_CONFIGS);
export const DEFAULT_LANGUAGE: SupportedLanguage = "cpp";
export const DEFAULT_CODE = LANGUAGE_CONFIGS[DEFAULT_LANGUAGE].starterCode;

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
