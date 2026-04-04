import { useEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { RotateCcw } from "lucide-react";
import {
  EXECUTION_LANGUAGE_CONFIG,
  getEditorBoilerplate,
  type SupportedEditorLanguage,
} from "./constants";
import {
  DEFAULT_EDITOR_THEME_ID,
  FLASHBANG_EDITOR_THEME_ID,
  ZEN_EDITOR_THEME_ID,
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

function defineZenTheme(monaco: Parameters<OnMount>[1]) {
  monaco.editor.defineTheme(ZEN_EDITOR_THEME_ID, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "d4d4d4", fontStyle: "bold" },
      { token: "type", foreground: "bdbdbd" },
      { token: "string", foreground: "c2c2c2" },
      { token: "number", foreground: "a8a8a8" },
      { token: "comment", foreground: "707070", fontStyle: "italic" },
      { token: "function", foreground: "d0d0d0" },
      { token: "variable", foreground: "efefef" },
      { token: "operator", foreground: "cfcfcf" },
      { token: "delimiter", foreground: "bfbfbf" },
      { token: "identifier", foreground: "efefef" },
    ],
    colors: {
      "editor.background": "#111111",
      "editor.foreground": "#efefef",
      "editor.lineHighlightBackground": "#1a1a1a",
      "editor.selectionBackground": "#4b4b4b66",
      "editorCursor.foreground": "#d4d4d4",
      "editorLineNumber.foreground": "#5d5d5d",
      "editorLineNumber.activeForeground": "#8d8d8d",
      "editor.selectionHighlightBackground": "#64646433",
      "editorIndentGuide.background": "#222222",
      "editorIndentGuide.activeBackground": "#343434",
      "editorWidget.background": "#171717",
      "editorWidget.border": "#2a2a2a",
      "editorSuggestWidget.background": "#171717",
      "editorSuggestWidget.border": "#2a2a2a",
      "editorSuggestWidget.selectedBackground": "#2a2a2a",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#6b6b6b22",
      "scrollbarSlider.hoverBackground": "#7a7a7a33",
      "scrollbarSlider.activeBackground": "#8a8a8a44",
    },
  });
}

type EditorPanelProps = {
  code: string;
  editorThemeId?: EditorThemeId;
  keySwapActive?: boolean;
  keySwapMap?: Record<string, string> | null;
  language: SupportedEditorLanguage;
  lineJumperActive?: boolean;
  visuallyImpairedActive?: boolean;
  noRetreatActive?: boolean;
  zenMode?: boolean;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: SupportedEditorLanguage) => void;
  onReset: () => void;
};

export function EditorPanel({
  code,
  editorThemeId = DEFAULT_EDITOR_THEME_ID,
  keySwapActive = false,
  keySwapMap = null,
  language,
  lineJumperActive = false,
  visuallyImpairedActive = false,
  noRetreatActive = false,
  zenMode = false,
  onCodeChange,
  onLanguageChange,
  onReset,
}: EditorPanelProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const acceptedCodeRef = useRef(code);
  const revertingDeletionRef = useRef(false);

  const handleMount: OnMount = (editor, monaco) => {
    defineNeonTheme(monaco);
    defineFlashbangTheme(monaco);
    defineZenTheme(monaco);
    monaco.editor.setTheme(editorThemeId);
    editorRef.current = editor;
    monacoRef.current = monaco;
    acceptedCodeRef.current = editor.getValue();
    editor.focus();
  };

  const handleReset = () => {
    acceptedCodeRef.current = getEditorBoilerplate(language);
    onReset();
  };

  useEffect(() => {
    if (!monacoRef.current) {
      return;
    }

    monacoRef.current.editor.setTheme(editorThemeId);
  }, [editorThemeId]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (code !== getEditorBoilerplate(language)) {
      return;
    }

    const editor = editorRef.current;
    window.setTimeout(() => {
      void editor.getAction("editor.foldAllMarkerRegions")?.run();
    }, 0);
  }, [code, language]);

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
        onCodeChange(acceptedCodeRef.current);
        return;
      }

      acceptedCodeRef.current = editorRef.current?.getValue() ?? acceptedCodeRef.current;
    });

    return () => {
      editorDomNode?.removeEventListener("keydown", blockDeletionKeys, true);
      disposable.dispose();
    };
  }, [noRetreatActive, onCodeChange]);

  useEffect(() => {
    if (revertingDeletionRef.current) {
      return;
    }

    acceptedCodeRef.current = code;
  }, [code]);

  useEffect(() => {
    if (!editorRef.current || !keySwapActive || !keySwapMap) {
      return;
    }

    const editor = editorRef.current;
    const editorDomNode = editor.getDomNode();
    const monaco = monacoRef.current;

    const swapTypedLetter = (event: KeyboardEvent) => {
      if (
        !monaco ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.key.length !== 1 ||
        !/[a-z]/i.test(event.key)
      ) {
        return;
      }

      const lowerKey = event.key.toLowerCase();
      const mappedLowerKey = keySwapMap[lowerKey];
      if (!mappedLowerKey) {
        return;
      }

      const mappedKey =
        event.key === lowerKey ? mappedLowerKey : mappedLowerKey.toUpperCase();
      const selection = editor.getSelection();
      if (!selection) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      editor.executeEdits("key-swap", [
        {
          range: selection,
          text: mappedKey,
          forceMoveMarkers: true,
        },
      ]);
    };

    editorDomNode?.addEventListener("keydown", swapTypedLetter, true);

    return () => {
      editorDomNode?.removeEventListener("keydown", swapTypedLetter, true);
    };
  }, [keySwapActive, keySwapMap]);

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
          : zenMode
            ? "border-[#2b2b2b] bg-[#111111]"
          : "border-[var(--ghost-border)] bg-[rgba(10,14,20,0.94)]"
      }`}
    >
      {/* header bar */}
      <div
        className={`flex items-center justify-between border-b px-4 py-2 ${
          editorThemeId === FLASHBANG_EDITOR_THEME_ID
            ? "border-[#f1ece6]"
            : zenMode
              ? "border-[#2b2b2b]"
            : "border-[var(--ghost-border)]"
        }`}
      >
        {/* left: language selector */}
        <div className="relative flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-semibold tracking-wide ${
              editorThemeId === FLASHBANG_EDITOR_THEME_ID
                ? "text-[#f2eee9]"
                : zenMode
                  ? "text-[#d4d4d4]"
                : "text-[var(--primary)]"
            }`}
          >
            <span className="opacity-60">{"</>"}</span>
            Code
          </span>

          <div
            className={`inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium ${
              editorThemeId === FLASHBANG_EDITOR_THEME_ID
                ? "border-[#fbf8f4] bg-white text-[#efebe6]"
                : zenMode
                  ? "border-[#303030] bg-[#171717] text-[#c8c8c8]"
                  : "border-[var(--ghost-border)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)]"
            }`}
          >
            C++
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
                : zenMode
                  ? "text-[#9a9a9a] hover:bg-[#1d1d1d] hover:text-[#d4d4d4]"
                : "text-[var(--text-tertiary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div
        className="relative min-h-0 flex-1"
        style={{
          transform: visuallyImpairedActive ? "scaleX(-1)" : undefined,
          transformOrigin: "center center",
        }}
      >
        <Editor
          height="100%"
          language={EXECUTION_LANGUAGE_CONFIG[language].monacoLanguage}
          value={code}
          onChange={(val) => {
            const nextCode = val ?? "";
            if (!revertingDeletionRef.current) {
              acceptedCodeRef.current = nextCode;
            }
            onCodeChange(nextCode);
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
