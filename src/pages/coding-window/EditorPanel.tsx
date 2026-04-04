import { useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { RotateCcw } from "lucide-react";
import { DEFAULT_CODE, LANGUAGES } from "./constants";
import {
  DEFAULT_EDITOR_THEME_ID,
  FLASHBANG_EDITOR_THEME_ID,
  type EditorThemeId,
} from "../../utils/arenaPowerHandlers";

/* ──────────────────────── register custom Monaco theme ──────────────── */
function defineNeonTheme(monaco: Parameters<OnMount>[1]) {
  monaco.editor.defineTheme("neonCommand", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "e08dff", fontStyle: "bold" },
      { token: "type", foreground: "00ffff" },
      { token: "string", foreground: "7cd87c" },
      { token: "number", foreground: "00ffff" },
      { token: "comment", foreground: "636c83", fontStyle: "italic" },
      { token: "function", foreground: "e08dff" },
      { token: "variable", foreground: "f1f3fc" },
      { token: "operator", foreground: "f1f3fc" },
      { token: "delimiter", foreground: "f1f3fc" },
      { token: "identifier", foreground: "f1f3fc" },
    ],
    colors: {
      "editor.background": "#0a0e14",
      "editor.foreground": "#f1f3fc",
      "editor.lineHighlightBackground": "#0f1319",
      "editor.selectionBackground": "#e08dff30",
      "editorCursor.foreground": "#e08dff",
      "editorLineNumber.foreground": "#3b4254",
      "editorLineNumber.activeForeground": "#636c83",
      "editor.selectionHighlightBackground": "#e08dff18",
      "editorIndentGuide.background": "#1a1e28",
      "editorIndentGuide.activeBackground": "#2a2e38",
      "editorWidget.background": "#0d1017",
      "editorWidget.border": "#1a1e28",
      "editorSuggestWidget.background": "#0d1017",
      "editorSuggestWidget.border": "#1a1e28",
      "editorSuggestWidget.selectedBackground": "#e08dff20",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff12",
      "scrollbarSlider.hoverBackground": "#ffffff1a",
      "scrollbarSlider.activeBackground": "#ffffff22",
    },
  });
}

function defineFlashbangTheme(monaco: Parameters<OnMount>[1]) {
  monaco.editor.defineTheme(FLASHBANG_EDITOR_THEME_ID, {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "f1ede8", fontStyle: "bold" },
      { token: "type", foreground: "ebe7e2" },
      { token: "string", foreground: "f0ece7" },
      { token: "number", foreground: "e9e5e0" },
      { token: "comment", foreground: "f7f4f1", fontStyle: "italic" },
      { token: "function", foreground: "ede9e4" },
      { token: "variable", foreground: "f1ede8" },
      { token: "operator", foreground: "ebe7e2" },
      { token: "delimiter", foreground: "efebe6" },
      { token: "identifier", foreground: "f2eee9" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#f1ede8",
      "editor.lineHighlightBackground": "#fdfdfd",
      "editor.selectionBackground": "#f7f3ee24",
      "editorCursor.foreground": "#e8e3dd",
      "editorLineNumber.foreground": "#f8f4ef",
      "editorLineNumber.activeForeground": "#efeae5",
      "editor.selectionHighlightBackground": "#faf7f318",
      "editorIndentGuide.background": "#fcfaf7",
      "editorIndentGuide.activeBackground": "#f6f2ed",
      "editorWidget.background": "#ffffff",
      "editorWidget.border": "#f8f4ef",
      "editorSuggestWidget.background": "#ffffff",
      "editorSuggestWidget.border": "#f8f4ef",
      "editorSuggestWidget.selectedBackground": "#fefcf9",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#f4f0eb22",
      "scrollbarSlider.hoverBackground": "#f4f0eb33",
      "scrollbarSlider.activeBackground": "#f4f0eb44",
    },
  });
}

type EditorPanelProps = {
  editorThemeId?: EditorThemeId;
  lineJumperActive?: boolean;
  noRetreatActive?: boolean;
};

export function EditorPanel({
  editorThemeId = DEFAULT_EDITOR_THEME_ID,
  lineJumperActive = false,
  noRetreatActive = false,
}: EditorPanelProps) {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const acceptedCodeRef = useRef(DEFAULT_CODE);
  const revertingDeletionRef = useRef(false);

  const handleMount: OnMount = (editor, monaco) => {
    defineNeonTheme(monaco);
    defineFlashbangTheme(monaco);
    monaco.editor.setTheme(editorThemeId);
    editorRef.current = editor;
    monacoRef.current = monaco;
    acceptedCodeRef.current = editor.getValue();
    editor.focus();
  };

  const handleReset = () => {
    acceptedCodeRef.current = DEFAULT_CODE;
    setCode(DEFAULT_CODE);
  };

  const currentLang = LANGUAGES.find((l) => l.value === language);

  useEffect(() => {
    if (!monacoRef.current) {
      return;
    }

    monacoRef.current.editor.setTheme(editorThemeId);
  }, [editorThemeId]);

  useEffect(() => {
    if (!editorRef.current || !noRetreatActive) {
      return;
    }

    const editor = editorRef.current;
    const editorDomNode = editor.getDomNode();
    const blockDeletionKeys = (event: KeyboardEvent) => {
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };
    editorDomNode?.addEventListener("keydown", blockDeletionKeys, true);

    const disposable = editorRef.current.onDidChangeModelContent((event) => {
      if (revertingDeletionRef.current) {
        revertingDeletionRef.current = false;
        acceptedCodeRef.current = editorRef.current?.getValue() ?? acceptedCodeRef.current;
        return;
      }

      const hasDeletion = event.changes.some(
        (change) => change.rangeLength > 0 && change.text.length < change.rangeLength,
      );

      if (hasDeletion) {
        const editor = editorRef.current;
        if (!editor) {
          return;
        }

        const currentSelection = editor.getSelection();
        revertingDeletionRef.current = true;
        editor.setValue(acceptedCodeRef.current);
        if (currentSelection) {
          editor.setSelection(currentSelection);
        }
        setCode(acceptedCodeRef.current);
        return;
      }

      acceptedCodeRef.current = editorRef.current?.getValue() ?? acceptedCodeRef.current;
    });

    return () => {
      editorDomNode?.removeEventListener("keydown", blockDeletionKeys, true);
      disposable.dispose();
    };
  }, [noRetreatActive]);

  useEffect(() => {
    if (revertingDeletionRef.current) {
      return;
    }

    acceptedCodeRef.current = code;
  }, [code]);

  useEffect(() => {
    if (!editorRef.current || !lineJumperActive) {
      return;
    }

    const editor = editorRef.current;

    const jumpCursor = () => {
      const model = editor.getModel();
      if (!model) {
        return;
      }

      const totalLines = model.getLineCount();
      if (totalLines <= 0) {
        return;
      }

      const randomLineNumber = Math.max(
        1,
        Math.floor(Math.random() * totalLines) + 1,
      );
      const maxColumn = model.getLineMaxColumn(randomLineNumber);
      const randomColumn = Math.max(
        1,
        Math.floor(Math.random() * Math.max(maxColumn, 1)) + 1,
      );

      editor.setPosition({ lineNumber: randomLineNumber, column: randomColumn });
      editor.revealPositionInCenter({
        lineNumber: randomLineNumber,
        column: randomColumn,
      });
      editor.focus();
    };

    const intervalId = window.setInterval(jumpCursor, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [lineJumperActive]);

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-xl border ${
        editorThemeId === FLASHBANG_EDITOR_THEME_ID
          ? "border-[#ece7e1] bg-white"
          : "border-[var(--ghost-border)] bg-[rgba(10,14,20,0.94)]"
      }`}
    >
      {/* header bar */}
      <div
        className={`flex items-center justify-between border-b px-4 py-2 ${
          editorThemeId === FLASHBANG_EDITOR_THEME_ID
            ? "border-[#f1ece6]"
            : "border-[var(--ghost-border)]"
        }`}
      >
        {/* left: language selector */}
        <div className="relative flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-semibold tracking-wide ${
              editorThemeId === FLASHBANG_EDITOR_THEME_ID
                ? "text-[#f2eee9]"
                : "text-[var(--primary)]"
            }`}
          >
            <span className="opacity-60">{"</>"}</span>
            Code
          </span>

          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
                editorThemeId === FLASHBANG_EDITOR_THEME_ID
                  ? "border-[#fbf8f4] bg-white text-[#efebe6] hover:border-[#f6f2ed] hover:bg-[#fffefd]"
                  : "border-[var(--ghost-border)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.06)]"
              }`}
            >
              {currentLang?.label ?? "C++"}
              <svg className="h-3.5 w-3.5 opacity-50" viewBox="0 0 12 12">
                <path d="M3 5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            {showLangMenu && (
              <div
                className={`absolute left-0 top-full z-50 mt-1 min-w-[9rem] overflow-hidden rounded-lg border shadow-xl ${
                  editorThemeId === FLASHBANG_EDITOR_THEME_ID
                    ? "border-[#fbf8f4] bg-white"
                    : "border-[var(--ghost-border)] bg-[#0d1017]"
                }`}
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => {
                      setLanguage(lang.value);
                      setShowLangMenu(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm transition ${
                      editorThemeId === FLASHBANG_EDITOR_THEME_ID
                        ? lang.value === language
                          ? "bg-[#fefcf9] text-[#e8e3dd]"
                          : "text-[#f0ece7] hover:bg-[#fffefd]"
                        : lang.value === language
                          ? "bg-[rgba(224,141,255,0.1)] text-[var(--primary)]"
                          : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)]"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* right: reset only */}
        <div className="flex items-center">
          {noRetreatActive ? (
            <span className="mr-3 rounded-md border border-[rgba(255,112,112,0.24)] bg-[rgba(255,112,112,0.08)] px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.12em] text-[var(--signal-danger)] uppercase">
              No Retreat
            </span>
          ) : null}
          <button
            onClick={handleReset}
            title="Reset"
            className={`grid h-9 w-9 place-items-center rounded-md transition ${
              editorThemeId === FLASHBANG_EDITOR_THEME_ID
                ? "text-[#efebe6] hover:bg-[#fffefd] hover:text-[#e3ded8]"
                : "text-[var(--text-tertiary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="relative min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(val) => {
            const nextCode = val ?? "";
            if (!revertingDeletionRef.current) {
              acceptedCodeRef.current = nextCode;
            }
            setCode(nextCode);
          }}
          onMount={handleMount}
          theme={editorThemeId}
          options={{
            fontSize: 15,
            fontFamily: "'IBM Plex Mono', 'Cascadia Code', 'Consolas', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: true,
            renderLineHighlight: "line",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            automaticLayout: true,
            tabSize: 4,
            wordWrap: "off",
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            overviewRulerLanes: 0,
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
        />
      </div>
    </div>
  );
}
