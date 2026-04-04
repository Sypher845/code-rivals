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

// ─────────────────────────────────────────────
//  Internal helpers
// ─────────────────────────────────────────────

string trim(const string& s) {
    size_t start = 0;
    while (start < s.size() && isspace((unsigned char)s[start])) start++;
    size_t end = s.size();
    while (end > start && isspace((unsigned char)s[end - 1])) end--;
    return s.substr(start, end - start);
}

// Split on commas at depth 0 (respects [], {}, () nesting and "strings")
vector<string> splitTopLevel(const string& s) {
    vector<string> parts;
    string current;
    int depth = 0;
    bool inString = false;
    for (size_t i = 0; i < s.size(); i++) {
        char c = s[i];
        if (c == '"' && (i == 0 || s[i - 1] != '\\')) inString = !inString;
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

// Strip a single layer of brackets/braces/parens
string stripOuter(const string& s, char open, char close) {
    string t = trim(s);
    if (t.size() >= 2 && t.front() == open && t.back() == close)
        return t.substr(1, t.size() - 2);
    return t;
}

// ─────────────────────────────────────────────
//  Safe numeric converters (never throw on bad input)
// ─────────────────────────────────────────────

static bool isNumericStr(const string& s) {
    if (s.empty()) return false;
    size_t i = 0;
    if (s[i] == '-' || s[i] == '+') i++;
    if (i == s.size()) return false;
    bool hasDot = false, hasDigit = false;
    for (; i < s.size(); i++) {
        if (s[i] == '.') {
            if (hasDot) return false;
            hasDot = true;
        } else if (s[i] == 'e' || s[i] == 'E') {
            // allow scientific notation tail: optional sign + digits
            i++;
            if (i < s.size() && (s[i] == '+' || s[i] == '-')) i++;
            if (i == s.size()) return false;
            for (; i < s.size(); i++)
                if (!isdigit((unsigned char)s[i])) return false;
            return hasDigit;
        } else if (isdigit((unsigned char)s[i])) {
            hasDigit = true;
        } else {
            return false;
        }
    }
    return hasDigit;
}

// ─────────────────────────────────────────────
//  Primitive parsers
// ─────────────────────────────────────────────

int parseIntValue(string s) {
    s = trim(s);
    if (!isNumericStr(s)) return 0;
    try { return stoi(s); } catch (...) { return 0; }
}

long long parseLongValue(string s) {
    s = trim(s);
    if (!isNumericStr(s)) return 0LL;
    try { return stoll(s); } catch (...) { return 0LL; }
}

double parseDoubleValue(string s) {
    s = trim(s);
    if (!isNumericStr(s)) return 0.0;
    try { return stod(s); } catch (...) { return 0.0; }
}

bool parseBoolValue(string s) { s = trim(s); return s == "true"; }

// char: accepts 'a' or just a
char parseCharValue(string s) {
    s = trim(s);
    if (s.size() >= 2 && s.front() == '\'' && s.back() == '\'')
        return s[1];
    return s[0];
}

// string: strips surrounding quotes
string parseStringValue(string s) {
    s = trim(s);
    if (s.size() >= 2 && s.front() == '"' && s.back() == '"')
        return s.substr(1, s.size() - 2);
    return s;
}

// ─────────────────────────────────────────────
//  1-D array parsers
// ─────────────────────────────────────────────

vector<int> parseIntArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<int> res;
    for (auto& p : splitTopLevel(s))
        if (!p.empty()) res.push_back(parseIntValue(p));
    return res;
}

vector<long long> parseLongArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<long long> res;
    for (auto& p : splitTopLevel(s))
        if (!p.empty()) res.push_back(parseLongValue(p));
    return res;
}

vector<double> parseDoubleArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<double> res;
    for (auto& p : splitTopLevel(s))
        if (!p.empty()) res.push_back(parseDoubleValue(p));
    return res;
}

vector<bool> parseBoolArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<bool> res;
    for (auto& p : splitTopLevel(s))
        if (!p.empty()) res.push_back(parseBoolValue(p));
    return res;
}

vector<char> parseCharArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<char> res;
    for (auto& p : splitTopLevel(s))
        if (!p.empty()) res.push_back(parseCharValue(p));
    return res;
}

vector<string> parseStringArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<string> res;
    for (auto& p : splitTopLevel(s))
        if (!p.empty()) res.push_back(parseStringValue(p));
    return res;
}

// ─────────────────────────────────────────────
//  2-D array parsers
// ─────────────────────────────────────────────

vector<vector<int>> parseIntMatrix(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<vector<int>> res;
    for (auto& p : splitTopLevel(s))
        if (!p.empty()) res.push_back(parseIntArray(p));
    return res;
}

vector<vector<long long>> parseLongMatrix(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<vector<long long>> res;
    for (auto& p : splitTopLevel(s))
        if (!p.empty()) res.push_back(parseLongArray(p));
    return res;
}

vector<vector<double>> parseDoubleMatrix(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<vector<double>> res;
    for (auto& p : splitTopLevel(s))
        if (!p.empty()) res.push_back(parseDoubleArray(p));
    return res;
}

vector<vector<string>> parseStringMatrix(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<vector<string>> res;
    for (auto& p : splitTopLevel(s))
        if (!p.empty()) res.push_back(parseStringArray(p));
    return res;
}

vector<vector<char>> parseCharMatrix(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<vector<char>> res;
    for (auto& p : splitTopLevel(s))
        if (!p.empty()) res.push_back(parseCharArray(p));
    return res;
}

// ─────────────────────────────────────────────
//  3-D array parser
// ─────────────────────────────────────────────

vector<vector<vector<int>>> parseInt3D(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<vector<vector<int>>> res;
    for (auto& p : splitTopLevel(s))
        if (!p.empty()) res.push_back(parseIntMatrix(p));
    return res;
}

// ─────────────────────────────────────────────
//  Set parsers
// ─────────────────────────────────────────────

// LeetCode passes sets as plain arrays like [1,2,3]; we read and deduplicate.
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

// ─────────────────────────────────────────────
//  Pair / tuple parsers
// ─────────────────────────────────────────────

// Pair: "[a,b]" or two separate lines
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

// Array of [int,int] pairs: [[a,b],[c,d],...]
vector<pair<int,int>> parseIntPairArray(string s) {
    s = trim(s);
    if (s == "[]") return {};
    s = stripOuter(s, '[', ']');
    vector<pair<int,int>> res;
    for (auto& p : splitTopLevel(s))
        if (!p.empty()) res.push_back(parseIntPair(p));
    return res;
}

// ─────────────────────────────────────────────
//  Linked List
// ─────────────────────────────────────────────

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int v = 0) : val(v), next(nullptr) {}
};

// "[1,2,3,4,5]" → linked list; returns head
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
    while (head) { auto t = head->next; delete head; head = t; }
}

// ─────────────────────────────────────────────
//  Binary Tree
// ─────────────────────────────────────────────

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int v = 0) : val(v), left(nullptr), right(nullptr) {}
};

// "[1,null,2,3]" level-order BFS serialization (LeetCode format)
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
        TreeNode* node = q.front(); q.pop();
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

// ─────────────────────────────────────────────
//  Output / print helpers
// ─────────────────────────────────────────────

void printInt(int v)               { cout << v; }
void printLong(long long v)        { cout << v; }
void printDouble(double v)         { cout << v; }
void printBool(bool v)             { cout << (v ? "true" : "false"); }
void printChar(char v)             { cout << v; }
void printString(const string& v)  { cout << '"' << v << '"'; }

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
    for (size_t i = 0; i < v.size(); i++) {
        if (i) cout << ",";
        printStringArray(v[i]);
    }
    cout << "]";
}

void printInt3D(const vector<vector<vector<int>>>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) cout << ","; printIntMatrix(v[i]); }
    cout << "]";
}

void printIntPair(pair<int,int> p) { cout << "[" << p.first << "," << p.second << "]"; }

void printIntPairArray(const vector<pair<int,int>>& v) {
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
    for (auto& x : s) { if (!first) cout << ","; cout << '"' << x << '"'; first = false; }
    cout << "]";
}

void printLinkedList(ListNode* head) {
    cout << "[";
    bool first = true;
    while (head) { if (!first) cout << ","; cout << head->val; first = false; head = head->next; }
    cout << "]";
}

void printBinaryTree(TreeNode* root) {
    // BFS level-order, LeetCode style (trailing nulls omitted)
    if (!root) { cout << "[]"; return; }
    cout << "[";
    queue<TreeNode*> q;
    q.push(root);
    bool first = true;
    while (!q.empty()) {
        TreeNode* node = q.front(); q.pop();
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

// ─────────────────────────────────────────────
//  main
// ─────────────────────────────────────────────

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string line;
    vector<string> input;
    while (getline(cin, line)) input.push_back(line);

    // ── Primitive examples ─────────────────────────────────────────
    // int x          = parseIntValue(input[0]);
    // long long x    = parseLongValue(input[0]);
    // double x       = parseDoubleValue(input[0]);
    // bool x         = parseBoolValue(input[0]);     // "true"/"false"
    // char x         = parseCharValue(input[0]);     // 'a' or a
    // string x       = parseStringValue(input[0]);   // "hello"

    // ── 1-D array examples ─────────────────────────────────────────
    // vector<int>    nums = parseIntArray(input[0]);      // [1,2,3]
    // vector<ll>     nums = parseLongArray(input[0]);
    // vector<double> nums = parseDoubleArray(input[0]);
    // vector<bool>   bits = parseBoolArray(input[0]);     // [true,false]
    // vector<char>   chs  = parseCharArray(input[0]);     // ["a","b"]
    // vector<string> strs = parseStringArray(input[0]);   // ["foo","bar"]

    // ── 2-D array examples ─────────────────────────────────────────
    // vector<vector<int>>    mat = parseIntMatrix(input[0]);    // [[1,2],[3,4]]
    // vector<vector<ll>>     mat = parseLongMatrix(input[0]);
    // vector<vector<double>> mat = parseDoubleMatrix(input[0]);
    // vector<vector<string>> mat = parseStringMatrix(input[0]);
    // vector<vector<char>>   mat = parseCharMatrix(input[0]);   // board problems

    // ── 3-D array example ─────────────────────────────────────────
    // vector<vector<vector<int>>> arr = parseInt3D(input[0]);

    // ── Set examples ───────────────────────────────────────────────
    // set<int>    s = parseIntSet(input[0]);       // [1,2,3] → deduplicated
    // set<string> s = parseStringSet(input[0]);

    // ── Pair examples ──────────────────────────────────────────────
    // pair<int,int>           p  = parseIntPair(input[0]);        // [2,7]
    // pair<string,int>        p  = parseStringIntPair(input[0]);  // ["a",1]
    // vector<pair<int,int>>   ps = parseIntPairArray(input[0]);   // [[0,1],[2,3]]

    // ── Linked list example ────────────────────────────────────────
    // ListNode* head = parseLinkedList(input[0]);   // [1,2,3,4,5]
    // printLinkedList(head);
    // freeList(head);

    // ── Binary tree example ────────────────────────────────────────
    // TreeNode* root = parseBinaryTree(input[0]);   // [1,null,2,3]
    // printBinaryTree(root);
    // freeTree(root);

    // ── Multi-input example ────────────────────────────────────────
    // if (input.size() >= 2) {
    //     vector<int> nums = parseIntArray(input[0]);
    //     int target       = parseIntValue(input[1]);
    //     printIntArray(nums);
    // }

    return 0;
}
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
