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

export const EXECUTION_LANGUAGE_CONFIG = {
  cpp: {
    label: "C++",
    monacoLanguage: "cpp",
    pistonLanguage: "c++",
    version: "10.2.0",
    fileName: "main.cpp",
    boilerplate: `#include <bits/stdc++.h>
using namespace std;

// #region Driver Helpers
string trim(const string& s) {
    size_t start = 0;
    while (start < s.size() && isspace((unsigned char)s[start])) start++;
    size_t end = s.size();
    while (end > start && isspace((unsigned char)s[end - 1])) end--;
    return s.substr(start, end - start);
}

vector<string> splitTopLevel(const string& s) {
    vector<string> parts;
    string current;
    int depth = 0;
    bool inString = false;
    for (size_t i = 0; i < s.size(); i++) {
        char c = s[i];
        if (c == '"' && (i == 0 || s[i - 1] != '\\\\')) inString = !inString;
        if (!inString) {
            if (c == '[' || c == '(' || c == '{') depth++;
            if (c == ']' || c == ')' || c == '}') depth--;
            if (c == ',' && depth == 0) {
                parts.push_back(trim(current));
                current.clear();
                continue;
            }
        }
        current += c;
    }
    if (!current.empty()) parts.push_back(trim(current));
    return parts;
}

string stripOuter(const string& s, char open, char close) {
    string t = trim(s);
    if (t.size() >= 2 && t.front() == open && t.back() == close) {
        return t.substr(1, t.size() - 2);
    }
    return t;
}

int parseIntValue(string s) { return stoi(trim(s)); }
long long parseLongValue(string s) { return stoll(trim(s)); }
double parseDoubleValue(string s) { return stod(trim(s)); }
bool parseBoolValue(string s) { s = trim(s); return s == "true"; }

char parseCharValue(string s) {
    s = trim(s);
    if (s.size() >= 2 && s.front() == '\\'' && s.back() == '\\'') return s[1];
    return s[0];
}

string parseStringValue(string s) {
    s = trim(s);
    if (s.size() >= 2 && s.front() == '"' && s.back() == '"') {
        return s.substr(1, s.size() - 2);
    }
    return s;
}

vector<int> parseIntArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<int> res;
    for (auto& p : splitTopLevel(s)) if (!p.empty()) res.push_back(parseIntValue(p));
    return res;
}

vector<long long> parseLongArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<long long> res;
    for (auto& p : splitTopLevel(s)) if (!p.empty()) res.push_back(parseLongValue(p));
    return res;
}

vector<double> parseDoubleArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<double> res;
    for (auto& p : splitTopLevel(s)) if (!p.empty()) res.push_back(parseDoubleValue(p));
    return res;
}

vector<bool> parseBoolArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<bool> res;
    for (auto& p : splitTopLevel(s)) if (!p.empty()) res.push_back(parseBoolValue(p));
    return res;
}

vector<char> parseCharArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<char> res;
    for (auto& p : splitTopLevel(s)) if (!p.empty()) res.push_back(parseCharValue(p));
    return res;
}

vector<string> parseStringArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<string> res;
    for (auto& p : splitTopLevel(s)) if (!p.empty()) res.push_back(parseStringValue(p));
    return res;
}

vector<vector<int>> parseIntMatrix(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<vector<int>> res;
    for (auto& p : splitTopLevel(s)) if (!p.empty()) res.push_back(parseIntArray(p));
    return res;
}

vector<vector<long long>> parseLongMatrix(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<vector<long long>> res;
    for (auto& p : splitTopLevel(s)) if (!p.empty()) res.push_back(parseLongArray(p));
    return res;
}

vector<vector<double>> parseDoubleMatrix(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<vector<double>> res;
    for (auto& p : splitTopLevel(s)) if (!p.empty()) res.push_back(parseDoubleArray(p));
    return res;
}

vector<vector<string>> parseStringMatrix(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<vector<string>> res;
    for (auto& p : splitTopLevel(s)) if (!p.empty()) res.push_back(parseStringArray(p));
    return res;
}

vector<vector<char>> parseCharMatrix(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<vector<char>> res;
    for (auto& p : splitTopLevel(s)) if (!p.empty()) res.push_back(parseCharArray(p));
    return res;
}

vector<vector<vector<int>>> parseInt3D(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<vector<vector<int>>> res;
    for (auto& p : splitTopLevel(s)) if (!p.empty()) res.push_back(parseIntMatrix(p));
    return res;
}

set<int> parseIntSet(string s) {
    auto v = parseIntArray(s);
    return set<int>(v.begin(), v.end());
}

set<string> parseStringSet(string s) {
    auto v = parseStringArray(s);
    return set<string>(v.begin(), v.end());
}

unordered_set<int> parseIntUnorderedSet(string s) {
    auto v = parseIntArray(s);
    return unordered_set<int>(v.begin(), v.end());
}

pair<int, int> parseIntPair(string s) {
    s = stripOuter(s, '[', ']');
    auto parts = splitTopLevel(s);
    return {parseIntValue(parts[0]), parseIntValue(parts[1])};
}

pair<string, int> parseStringIntPair(string s) {
    s = stripOuter(s, '[', ']');
    auto parts = splitTopLevel(s);
    return {parseStringValue(parts[0]), parseIntValue(parts[1])};
}

vector<pair<int, int>> parseIntPairArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<pair<int, int>> res;
    for (auto& p : splitTopLevel(s)) if (!p.empty()) res.push_back(parseIntPair(p));
    return res;
}

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int v = 0) : val(v), next(nullptr) {}
};

ListNode* parseLinkedList(string s) {
    auto vals = parseIntArray(s);
    if (vals.empty()) return nullptr;
    ListNode* head = new ListNode(vals[0]);
    ListNode* cur = head;
    for (size_t i = 1; i < vals.size(); i++) {
        cur->next = new ListNode(vals[i]);
        cur = cur->next;
    }
    return head;
}

void freeList(ListNode* head) {
    while (head) {
        auto next = head->next;
        delete head;
        head = next;
    }
}

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int v = 0) : val(v), left(nullptr), right(nullptr) {}
};

TreeNode* parseBinaryTree(string s) {
    s = trim(s);
    if (s == "[]") return nullptr;
    s = stripOuter(s, '[', ']');
    auto parts = splitTopLevel(s);
    if (parts.empty() || parts[0] == "null") return nullptr;

    TreeNode* root = new TreeNode(parseIntValue(parts[0]));
    queue<TreeNode*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < parts.size()) {
        TreeNode* node = q.front();
        q.pop();
        if (i < parts.size() && parts[i] != "null") {
            node->left = new TreeNode(parseIntValue(parts[i]));
            q.push(node->left);
        }
        i++;
        if (i < parts.size() && parts[i] != "null") {
            node->right = new TreeNode(parseIntValue(parts[i]));
            q.push(node->right);
        }
        i++;
    }
    return root;
}

void freeTree(TreeNode* root) {
    if (!root) return;
    freeTree(root->left);
    freeTree(root->right);
    delete root;
}

void printInt(int v) { cout << v; }
void printLong(long long v) { cout << v; }
void printDouble(double v) { cout << v; }
void printBool(bool v) { cout << (v ? "true" : "false"); }
void printChar(char v) { cout << v; }
void printString(const string& v) { cout << '"' << v << '"'; }

void printIntArray(const vector<int>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) cout << ","; cout << v[i]; }
    cout << "]";
}

void printLongArray(const vector<long long>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) cout << ","; cout << v[i]; }
    cout << "]";
}

void printDoubleArray(const vector<double>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) cout << ","; cout << v[i]; }
    cout << "]";
}

void printBoolArray(const vector<bool>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) cout << ","; cout << (v[i] ? "true" : "false"); }
    cout << "]";
}

void printCharArray(const vector<char>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) cout << ","; cout << '"' << v[i] << '"'; }
    cout << "]";
}

void printStringArray(const vector<string>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) cout << ","; cout << '"' << v[i] << '"'; }
    cout << "]";
}

void printIntMatrix(const vector<vector<int>>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) cout << ","; printIntArray(v[i]); }
    cout << "]";
}

void printStringMatrix(const vector<vector<string>>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) cout << ","; printStringArray(v[i]); }
    cout << "]";
}

void printInt3D(const vector<vector<vector<int>>>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) cout << ","; printIntMatrix(v[i]); }
    cout << "]";
}

void printIntPair(pair<int, int> p) { cout << "[" << p.first << "," << p.second << "]"; }

void printIntPairArray(const vector<pair<int, int>>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) cout << ","; printIntPair(v[i]); }
    cout << "]";
}

void printIntSet(const set<int>& s) {
    cout << "[";
    bool first = true;
    for (int x : s) { if (!first) cout << ","; cout << x; first = false; }
    cout << "]";
}

void printStringSet(const set<string>& s) {
    cout << "[";
    bool first = true;
    for (const auto& x : s) { if (!first) cout << ","; cout << '"' << x << '"'; first = false; }
    cout << "]";
}

void printLinkedList(ListNode* head) {
    cout << "[";
    bool first = true;
    while (head) { if (!first) cout << ","; cout << head->val; first = false; head = head->next; }
    cout << "]";
}

void printBinaryTree(TreeNode* root) {
    if (!root) { cout << "[]"; return; }
    cout << "[";
    queue<TreeNode*> q;
    q.push(root);
    bool first = true;
    while (!q.empty()) {
        TreeNode* node = q.front();
        q.pop();
        if (!first) cout << ",";
        first = false;
        if (!node) { cout << "null"; continue; }
        cout << node->val;
        if (node->left || node->right || !q.empty()) {
            q.push(node->left);
            q.push(node->right);
        }
    }
    cout << "]";
}
// #endregion

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string line;
    vector<string> input;

    while (getline(cin, line)) {
        input.push_back(line);
    }

    // Common parsers:
    // parseIntValue(input[i]), parseLongValue(input[i]), parseDoubleValue(input[i])
    // parseBoolValue(input[i]), parseCharValue(input[i]), parseStringValue(input[i])
    // parseIntArray(input[i]), parseLongArray(input[i]), parseDoubleArray(input[i])
    // parseBoolArray(input[i]), parseCharArray(input[i]), parseStringArray(input[i])
    // parseIntMatrix(input[i]), parseLongMatrix(input[i]), parseDoubleMatrix(input[i])
    // parseStringMatrix(input[i]), parseCharMatrix(input[i]), parseInt3D(input[i])
    // parseIntSet(input[i]), parseStringSet(input[i]), parseIntUnorderedSet(input[i])
    // parseIntPair(input[i]), parseStringIntPair(input[i]), parseIntPairArray(input[i])
    // parseLinkedList(input[i]), parseBinaryTree(input[i])
    //
    // Common printers:
    // printInt(...), printLong(...), printDouble(...), printBool(...), printChar(...), printString(...)
    // printIntArray(...), printLongArray(...), printDoubleArray(...), printBoolArray(...)
    // printCharArray(...), printStringArray(...), printIntMatrix(...), printStringMatrix(...)
    // printInt3D(...), printIntPair(...), printIntPairArray(...), printIntSet(...)
    // printStringSet(...), printLinkedList(...), printBinaryTree(...)
    //
    // Example:
    // if (input.size() >= 2) {
    //     vector<int> nums = parseIntArray(input[0]);
    //     int target = parseIntValue(input[1]);
    //     printIntArray(nums);
    //     cout << '\\n' << target << '\\n';
    // }

    return 0;
}
`,
  },
  java: {
    label: "Java",
    monacoLanguage: "java",
    pistonLanguage: "java",
    version: "15.0.2",
    fileName: "Main.java",
    boilerplate: `import java.io.*;
import java.util.*;

public class Main {
    // #region Driver Helpers
    static String trim(String s) {
        return s == null ? "" : s.trim();
    }

    static List<String> splitTopLevel(String s) {
        List<String> parts = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        int depth = 0;
        boolean inString = false;

        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);

            if (c == '"' && (i == 0 || s.charAt(i - 1) != '\\\\')) {
                inString = !inString;
            }

            if (!inString) {
                if (c == '[') depth++;
                if (c == ']') depth--;
                if (c == ',' && depth == 0) {
                    parts.add(trim(current.toString()));
                    current.setLength(0);
                    continue;
                }
            }

            current.append(c);
        }

        if (current.length() > 0) {
            parts.add(trim(current.toString()));
        }

        return parts;
    }

    static int parseIntValue(String s) {
        return Integer.parseInt(trim(s));
    }

    static long parseLongValue(String s) {
        return Long.parseLong(trim(s));
    }

    static String parseStringValue(String s) {
        s = trim(s);
        if (s.length() >= 2 && s.charAt(0) == '"' && s.charAt(s.length() - 1) == '"') {
            return s.substring(1, s.length() - 1);
        }
        return s;
    }

    static boolean parseBoolValue(String s) {
        return "true".equals(trim(s));
    }

    static int[] parseIntArray(String s) {
        s = trim(s);
        if ("[]".equals(s)) return new int[0];
        if (!s.isEmpty() && s.charAt(0) == '[' && s.charAt(s.length() - 1) == ']') {
            s = s.substring(1, s.length() - 1);
        }
        if (trim(s).isEmpty()) return new int[0];

        List<String> parts = splitTopLevel(s);
        int[] result = new int[parts.size()];
        for (int i = 0; i < parts.size(); i++) {
            result[i] = parseIntValue(parts.get(i));
        }
        return result;
    }

    static String[] parseStringArray(String s) {
        s = trim(s);
        if ("[]".equals(s)) return new String[0];
        if (!s.isEmpty() && s.charAt(0) == '[' && s.charAt(s.length() - 1) == ']') {
            s = s.substring(1, s.length() - 1);
        }
        if (trim(s).isEmpty()) return new String[0];

        List<String> parts = splitTopLevel(s);
        String[] result = new String[parts.size()];
        for (int i = 0; i < parts.size(); i++) {
            result[i] = parseStringValue(parts.get(i));
        }
        return result;
    }

    static int[][] parseIntMatrix(String s) {
        s = trim(s);
        if ("[]".equals(s)) return new int[0][];
        if (!s.isEmpty() && s.charAt(0) == '[' && s.charAt(s.length() - 1) == ']') {
            s = s.substring(1, s.length() - 1);
        }
        if (trim(s).isEmpty()) return new int[0][];

        List<String> parts = splitTopLevel(s);
        int[][] result = new int[parts.size()][];
        for (int i = 0; i < parts.size(); i++) {
            result[i] = parseIntArray(parts.get(i));
        }
        return result;
    }

    static void printIntArray(int[] values) {
        System.out.print("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) System.out.print(",");
            System.out.print(values[i]);
        }
        System.out.print("]");
    }
    // #endregion

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> input = new ArrayList<>();
        String line;

        while ((line = br.readLine()) != null) {
            input.add(line);
        }

        // Helpers available:
        // parseIntValue("42")
        // parseLongValue("42")
        // parseStringValue(""abc"")
        // parseBoolValue("true")
        // parseIntArray("[1,2,3]")
        // parseStringArray("["a","b"]")
        // parseIntMatrix("[[1,2],[3,4]]")
        //
        // Example for LeetCode-style stdin:
        // [2,7,11,15]
        // 9
        // if (input.size() >= 2) {
        //     int[] nums = parseIntArray(input.get(0));
        //     int target = parseIntValue(input.get(1));
        //     printIntArray(nums);
        //     System.out.println();
        //     System.out.println(target);
        // }
    }
}
`,
  },
  python: {
    label: "Python",
    monacoLanguage: "python",
    pistonLanguage: "python",
    version: "3.10.0",
    fileName: "main.py",
    boilerplate: `import ast
import sys


# region Driver Helpers
def parse_value(line: str):
    line = line.strip()
    if not line:
        return None
    try:
        return ast.literal_eval(line)
    except Exception:
        lowered = line.lower()
        if lowered == "true":
            return True
        if lowered == "false":
            return False
        if lowered == "null":
            return None
        return line


def parse_int(line: str) -> int:
    return int(line.strip())


def parse_str(line: str) -> str:
    value = parse_value(line)
    return value if isinstance(value, str) else str(value)


def parse_bool(line: str) -> bool:
    value = parse_value(line)
    return bool(value)


def parse_int_array(line: str) -> list[int]:
    value = parse_value(line)
    return list(value) if isinstance(value, list) else []


def parse_str_array(line: str) -> list[str]:
    value = parse_value(line)
    return list(value) if isinstance(value, list) else []


def parse_int_matrix(line: str) -> list[list[int]]:
    value = parse_value(line)
    return list(value) if isinstance(value, list) else []
# endregion


def main():
    data = sys.stdin.read()
    lines = [line for line in data.splitlines() if line.strip()]

    # Helpers available:
    # parse_value("[1,2,3]"), parse_value(""abc""), parse_value("42")
    # parse_int("42")
    # parse_str(""abc"")
    # parse_bool("true")
    # parse_int_array("[1,2,3]")
    # parse_str_array("["a","b"]")
    # parse_int_matrix("[[1,2],[3,4]]")
    #
    # Example for LeetCode-style stdin:
    # [2,7,11,15]
    # 9
    # if len(lines) >= 2:
    #     nums = parse_int_array(lines[0])
    #     target = parse_int(lines[1])
    #     print(nums)
    #     print(target)


if __name__ == "__main__":
    main()
`,
  },
} as const;

export type SupportedEditorLanguage = keyof typeof EXECUTION_LANGUAGE_CONFIG;

export const DEFAULT_LANGUAGE: SupportedEditorLanguage = "cpp";

export const DEFAULT_CODE: string =
  EXECUTION_LANGUAGE_CONFIG[DEFAULT_LANGUAGE].boilerplate;

export const LANGUAGES = (
  Object.entries(EXECUTION_LANGUAGE_CONFIG) as Array<
    [SupportedEditorLanguage, (typeof EXECUTION_LANGUAGE_CONFIG)[SupportedEditorLanguage]]
  >
).map(([value, config]) => ({
  label: config.label,
  value,
}));

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
