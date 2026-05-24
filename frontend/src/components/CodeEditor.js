import React, { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import "../styles/CodeEditor.css";
import { useTheme } from "../theme";

const monacoThemeName = (t) => {
  switch (t) {
    case "ocean":    return "traceon-ocean";
    case "forest":   return "traceon-forest";
    case "midnight": return "traceon-midnight";
    case "dark":     return "traceon-dark";
    default:         return "traceon-light";
  }
};

/* eslint-disable no-template-curly-in-string */
const cppSnippets = [
  // ── Boilerplate ──
  { label: "main",       detail: "int main()",           documentation: "Standard C++ main function",
    insertText: ["#include <iostream>", "using namespace std;", "", "int main() {", "    ${1}", "    return 0;", "}"].join("\n") },
  { label: "include",    detail: "#include <...>",        documentation: "Add an include directive",
    insertText: "#include <${1:iostream}>" },

  // ── Control flow ──
  { label: "for",        detail: "for loop",             documentation: "Classic for loop",
    insertText: ["for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {", "    ${3}", "}"].join("\n") },
  { label: "forr",       detail: "range-based for",      documentation: "Range-based for loop (C++11)",
    insertText: ["for (auto& ${1:item} : ${2:container}) {", "    ${3}", "}"].join("\n") },
  { label: "while",      detail: "while loop",           documentation: "While loop",
    insertText: ["while (${1:condition}) {", "    ${2}", "}"].join("\n") },
  { label: "dowhile",    detail: "do-while loop",        documentation: "Do-while loop",
    insertText: ["do {", "    ${1}", "} while (${2:condition});"].join("\n") },
  { label: "if",         detail: "if statement",         documentation: "If statement",
    insertText: ["if (${1:condition}) {", "    ${2}", "}"].join("\n") },
  { label: "ife",        detail: "if-else statement",    documentation: "If-else statement",
    insertText: ["if (${1:condition}) {", "    ${2}", "} else {", "    ${3}", "}"].join("\n") },
  { label: "switch",     detail: "switch statement",     documentation: "Switch statement",
    insertText: ["switch (${1:var}) {", "    case ${2:val}:", "        ${3}", "        break;", "    default:", "        break;", "}"].join("\n") },

  // ── Functions ──
  { label: "fn",         detail: "function definition",  documentation: "Define a function",
    insertText: ["${1:int} ${2:name}(${3:int x}) {", "    ${4}", "    return ${5:0};", "}"].join("\n") },
  { label: "call",       detail: "function call",        documentation: "Call a function",
    insertText: "${1:name}(${2:args});" },
  { label: "lambda",     detail: "lambda expression",    documentation: "C++11 lambda",
    insertText: "[${1}](${2:int x}) {", },

  // ── I/O ──
  { label: "cout",       detail: "cout << ...",          documentation: "Print to stdout",
    insertText: "cout << ${1:value} << endl;" },
  { label: "cerr",       detail: "cerr << ...",          documentation: "Print to stderr",
    insertText: "cerr << ${1:value} << endl;" },
  { label: "cin",        detail: "cin >> ...",           documentation: "Read from stdin",
    insertText: "cin >> ${1:var};" },
  { label: "printf",     detail: "printf(...)",          documentation: "C-style formatted output",
    insertText: 'printf("${1:%d}\\n", ${2:var});' },
  { label: "scanf",      detail: "scanf(...)",           documentation: "C-style formatted input",
    insertText: 'scanf("${1:%d}", &${2:var});' },

  // ── STL containers ──
  { label: "vector",     detail: "vector<T>",            documentation: "std::vector declaration",
    insertText: "vector<${1:int}> ${2:v};" },
  { label: "map",        detail: "map<K,V>",             documentation: "std::map declaration",
    insertText: "map<${1:string}, ${2:int}> ${3:m};" },
  { label: "unmap",      detail: "unordered_map<K,V>",  documentation: "std::unordered_map",
    insertText: "unordered_map<${1:string}, ${2:int}> ${3:m};" },
  { label: "set",        detail: "set<T>",               documentation: "std::set declaration",
    insertText: "set<${1:int}> ${2:s};" },
  { label: "stack",      detail: "stack<T>",             documentation: "std::stack declaration",
    insertText: "stack<${1:int}> ${2:st};" },
  { label: "queue",      detail: "queue<T>",             documentation: "std::queue declaration",
    insertText: "queue<${1:int}> ${2:q};" },
  { label: "pair",       detail: "pair<A,B>",            documentation: "std::pair declaration",
    insertText: "pair<${1:int}, ${2:int}> ${3:p} = {${4:0}, ${5:0}};" },
  { label: "string",     detail: "string declaration",   documentation: "std::string variable",
    insertText: 'string ${1:s} = "${2}";' },
  { label: "array",      detail: "array<T,N>",           documentation: "std::array declaration",
    insertText: "array<${1:int}, ${2:5}> ${3:arr};" },

  // ── Classes & structs ──
  { label: "class",      detail: "class definition",     documentation: "Define a class",
    insertText: ["class ${1:Name} {", "public:", "    ${1:Name}() {}", "    ${2}", "};"].join("\n") },
  { label: "struct",     detail: "struct definition",    documentation: "Define a struct",
    insertText: ["struct ${1:Name} {", "    ${2:int x};", "};"].join("\n") },

  // ── Error handling ──
  { label: "try",        detail: "try-catch block",      documentation: "Try-catch exception handling",
    insertText: ["try {", "    ${1}", "} catch (const exception& e) {", "    cerr << e.what() << endl;", "}"].join("\n") },

  // ── Memory ──
  { label: "new",        detail: "new allocation",       documentation: "Dynamic allocation",
    insertText: "${1:int}* ${2:ptr} = new ${1:int}(${3:0});" },
  { label: "delete",     detail: "delete pointer",       documentation: "Free dynamic memory",
    insertText: "delete ${1:ptr};" },

  // ── Algorithms ──
  { label: "sort",       detail: "sort(begin, end)",     documentation: "std::sort a container",
    insertText: "sort(${1:v}.begin(), ${1:v}.end());" },
  { label: "find",       detail: "find(begin, end, val)",documentation: "std::find in a container",
    insertText: "auto ${2:it} = find(${1:v}.begin(), ${1:v}.end(), ${3:val});" },
];

const cSnippets = [
  // ── Boilerplate ──
  { label: "main",       detail: "int main()",           documentation: "Standard C main function",
    insertText: ["#include <stdio.h>", "", "int main() {", "    ${1}", "    return 0;", "}"].join("\n") },
  { label: "include",    detail: "#include <...>",        documentation: "Add an include directive",
    insertText: "#include <${1:stdio.h}>" },

  // ── Control flow ──
  { label: "for",        detail: "for loop",             documentation: "Classic for loop",
    insertText: ["for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {", "    ${3}", "}"].join("\n") },
  { label: "while",      detail: "while loop",           documentation: "While loop",
    insertText: ["while (${1:condition}) {", "    ${2}", "}"].join("\n") },
  { label: "dowhile",    detail: "do-while loop",        documentation: "Do-while loop",
    insertText: ["do {", "    ${1}", "} while (${2:condition});"].join("\n") },
  { label: "if",         detail: "if statement",         documentation: "If statement",
    insertText: ["if (${1:condition}) {", "    ${2}", "}"].join("\n") },
  { label: "ife",        detail: "if-else statement",    documentation: "If-else statement",
    insertText: ["if (${1:condition}) {", "    ${2}", "} else {", "    ${3}", "}"].join("\n") },
  { label: "switch",     detail: "switch statement",     documentation: "Switch statement",
    insertText: ["switch (${1:var}) {", "    case ${2:val}:", "        ${3}", "        break;", "    default:", "        break;", "}"].join("\n") },

  // ── Functions ──
  { label: "fn",         detail: "function definition",  documentation: "Define a function",
    insertText: ["${1:int} ${2:name}(${3:int x}) {", "    ${4}", "    return ${5:0};", "}"].join("\n") },
  { label: "call",       detail: "function call",        documentation: "Call a function",
    insertText: "${1:name}(${2:args});" },

  // ── I/O ──
  { label: "printf",     detail: "printf(...)",          documentation: "Formatted output to stdout",
    insertText: 'printf("${1:%d}\\n", ${2:var});' },
  { label: "scanf",      detail: "scanf(...)",           documentation: "Formatted input from stdin",
    insertText: 'scanf("${1:%d}", &${2:var});' },
  { label: "puts",       detail: "puts(str)",            documentation: "Print string with newline",
    insertText: 'puts("${1:text}");' },
  { label: "gets",       detail: "fgets(...)",           documentation: "Read a line safely",
    insertText: "fgets(${1:buf}, sizeof(${1:buf}), stdin);" },
  { label: "fputs",      detail: "fprintf(...)",         documentation: "Formatted output to file/stderr",
    insertText: 'fprintf(${1:stderr}, "${2:%s}\\n", ${3:var});' },

  // ── Data types & variables ──
  { label: "arr",        detail: "int arr[N]",           documentation: "Array declaration",
    insertText: "${1:int} ${2:arr}[${3:10}];" },
  { label: "ptr",        detail: "int* ptr",             documentation: "Pointer declaration",
    insertText: "${1:int}* ${2:ptr} = ${3:NULL};" },
  { label: "str",        detail: "char str[N]",          documentation: "Character array (string)",
    insertText: 'char ${1:str}[${2:256}] = "${3}";' },

  // ── Structs & typedef ──
  { label: "struct",     detail: "struct definition",    documentation: "Define a struct",
    insertText: ["struct ${1:Name} {", "    ${2:int x};", "};"].join("\n") },
  { label: "typedef",    detail: "typedef struct",       documentation: "Typedef struct pattern",
    insertText: ["typedef struct {", "    ${1:int x};", "} ${2:Name};"].join("\n") },
  { label: "enum",       detail: "enum definition",      documentation: "Define an enum",
    insertText: ["typedef enum {", "    ${1:VAL_A},", "    ${2:VAL_B}", "} ${3:EnumName};"].join("\n") },

  // ── Memory ──
  { label: "malloc",     detail: "malloc(n * sizeof(T))",documentation: "Allocate heap memory",
    insertText: "${1:int}* ${2:ptr} = (${1:int}*)malloc(${3:n} * sizeof(${1:int}));" },
  { label: "calloc",     detail: "calloc(n, sizeof(T))", documentation: "Allocate zeroed heap memory",
    insertText: "${1:int}* ${2:ptr} = (${1:int}*)calloc(${3:n}, sizeof(${1:int}));" },
  { label: "realloc",    detail: "realloc(ptr, size)",   documentation: "Resize heap allocation",
    insertText: "${1:ptr} = realloc(${1:ptr}, ${2:newSize} * sizeof(${3:int}));" },
  { label: "free",       detail: "free(ptr)",            documentation: "Free heap memory",
    insertText: "free(${1:ptr});" },

  // ── String functions ──
  { label: "strlen",     detail: "strlen(s)",            documentation: "String length",
    insertText: "strlen(${1:str})" },
  { label: "strcpy",     detail: "strcpy(dst, src)",     documentation: "Copy string",
    insertText: "strcpy(${1:dst}, ${2:src});" },
  { label: "strncpy",    detail: "strncpy(dst, src, n)", documentation: "Copy string (bounded)",
    insertText: "strncpy(${1:dst}, ${2:src}, sizeof(${1:dst}) - 1);" },
  { label: "strcmp",     detail: "strcmp(a, b)",         documentation: "Compare strings",
    insertText: "strcmp(${1:a}, ${2:b})" },
  { label: "strcat",     detail: "strcat(dst, src)",     documentation: "Concatenate strings",
    insertText: "strcat(${1:dst}, ${2:src});" },
  { label: "sprintf",    detail: "sprintf(buf, fmt, ...)",documentation: "Format string into buffer",
    insertText: 'sprintf(${1:buf}, "${2:%d}", ${3:val});' },

  // ── Math ──
  { label: "abs",        detail: "abs(n)",               documentation: "Absolute value (int)",
    insertText: "abs(${1:n})" },
  { label: "sqrt",       detail: "sqrt(x)",              documentation: "Square root (double)",
    insertText: "sqrt(${1:x})" },
  { label: "pow",        detail: "pow(base, exp)",       documentation: "Power function",
    insertText: "pow(${1:base}, ${2:exp})" },
];
const pythonSnippets = [
  // ── Boilerplate ──
  { label: "main",      detail: 'if __name__ == "__main__"', documentation: "Main guard entry point",
    insertText: ['if __name__ == "__main__":', "    ${1}"].join("\n") },
  { label: "import",    detail: "import module",             documentation: "Import a module",
    insertText: "import ${1:os}" },
  { label: "from",      detail: "from module import name",   documentation: "From-import statement",
    insertText: "from ${1:module} import ${2:name}" },

  // ── Control flow ──
  { label: "for",       detail: "for loop",                  documentation: "For loop",
    insertText: ["for ${1:i} in ${2:range(10)}:", "    ${3}"].join("\n") },
  { label: "forr",      detail: "for item in iterable",      documentation: "Iterate over a collection",
    insertText: ["for ${1:item} in ${2:items}:", "    ${3}"].join("\n") },
  { label: "while",     detail: "while loop",                documentation: "While loop",
    insertText: ["while ${1:condition}:", "    ${2}"].join("\n") },
  { label: "if",        detail: "if statement",              documentation: "If statement",
    insertText: ["if ${1:condition}:", "    ${2}"].join("\n") },
  { label: "ife",       detail: "if-else statement",         documentation: "If-else statement",
    insertText: ["if ${1:condition}:", "    ${2}", "else:", "    ${3}"].join("\n") },
  { label: "ifel",      detail: "if-elif-else",              documentation: "If-elif-else chain",
    insertText: ["if ${1:cond1}:", "    ${2}", "elif ${3:cond2}:", "    ${4}", "else:", "    ${5}"].join("\n") },

  // ── Functions & classes ──
  { label: "def",       detail: "def function",              documentation: "Define a function",
    insertText: ["def ${1:name}(${2:args}):", "    ${3}"].join("\n") },
  { label: "class",     detail: "class definition",          documentation: "Define a class",
    insertText: ["class ${1:Name}:", "    def __init__(self${2:, args}):", "        ${3}"].join("\n") },
  { label: "method",    detail: "def method(self)",          documentation: "Class method",
    insertText: ["def ${1:method}(self${2:, args}):", "    ${3}"].join("\n") },
  { label: "property",  detail: "@property",                 documentation: "Property decorator",
    insertText: ["@property", "def ${1:name}(self):", "    return self._${1:name}"].join("\n") },
  { label: "lambda",    detail: "lambda args: expr",         documentation: "Lambda expression",
    insertText: "lambda ${1:x}: ${2:x}" },

  // ── I/O ──
  { label: "print",     detail: "print(...)",                documentation: "Print to stdout",
    insertText: 'print(${1:value})' },
  { label: "printf",    detail: "print(f-string)",           documentation: "Print with f-string",
    insertText: 'print(f"${1:value}")' },
  { label: "input",     detail: "input(prompt)",             documentation: "Read from stdin",
    insertText: '${1:val} = input("${2:Enter: }")' },
  { label: "inputint",  detail: "int(input(...))",           documentation: "Read integer from stdin",
    insertText: '${1:n} = int(input("${2:Enter: }"))' },

  // ── Data structures ──
  { label: "list",      detail: "list declaration",          documentation: "Empty list",
    insertText: "${1:lst} = []" },
  { label: "dict",      detail: "dict declaration",          documentation: "Empty dictionary",
    insertText: "${1:d} = {}" },
  { label: "set",       detail: "set declaration",           documentation: "Empty set",
    insertText: "${1:s} = set()" },
  { label: "tuple",     detail: "tuple declaration",         documentation: "Tuple literal",
    insertText: "${1:t} = (${2:1}, ${3:2})" },
  { label: "lc",        detail: "[x for x in ...]",          documentation: "List comprehension",
    insertText: "[${1:x} for ${1:x} in ${2:items}]" },
  { label: "dc",        detail: "{k: v for ...}",            documentation: "Dict comprehension",
    insertText: "{${1:k}: ${2:v} for ${1:k}, ${2:v} in ${3:items}.items()}" },

  // ── Error handling ──
  { label: "try",       detail: "try-except block",          documentation: "Try-except exception handling",
    insertText: ["try:", "    ${1}", "except ${2:Exception} as e:", "    print(e)"].join("\n") },
  { label: "tryf",      detail: "try-except-finally",        documentation: "Try-except-finally",
    insertText: ["try:", "    ${1}", "except ${2:Exception} as e:", "    ${3}", "finally:", "    ${4}"].join("\n") },
  { label: "raise",     detail: "raise Exception",           documentation: "Raise an exception",
    insertText: "raise ${1:ValueError}(\"${2:message}\")" },

  // ── File & context ──
  { label: "with",      detail: "with open(...) as f",       documentation: "Context manager / file open",
    insertText: ["with open(\"${1:file.txt}\", \"${2:r}\") as ${3:f}:", "    ${4}"].join("\n") },

  // ── Common builtins ──
  { label: "range",     detail: "range(start, stop, step)",  documentation: "Range object",
    insertText: "range(${1:start}, ${2:stop})" },
  { label: "enumerate", detail: "enumerate(iterable)",       documentation: "Enumerate with index",
    insertText: "enumerate(${1:items})" },
  { label: "zip",       detail: "zip(a, b)",                 documentation: "Zip two iterables",
    insertText: "zip(${1:a}, ${2:b})" },
  { label: "map",       detail: "map(fn, iterable)",         documentation: "Map function over iterable",
    insertText: "map(${1:fn}, ${2:items})" },
  { label: "filter",    detail: "filter(fn, iterable)",      documentation: "Filter iterable",
    insertText: "filter(${1:fn}, ${2:items})" },
  { label: "sorted",    detail: "sorted(iterable)",          documentation: "Return sorted list",
    insertText: "sorted(${1:items}, key=${2:None}, reverse=${3:False})" },
  { label: "len",       detail: "len(obj)",                  documentation: "Length of object",
    insertText: "len(${1:obj})" },
];

const javaSnippets = [
  // ── Boilerplate ──
  { label: "main",       detail: "public class Main",          documentation: "Standard Java main class",
    insertText: ["public class Main {", "    public static void main(String[] args) {", "        ${1}", "    }", "}"].join("\n") },
  { label: "import",     detail: "import statement",           documentation: "Import a Java class",
    insertText: "import ${1:java.util.ArrayList};" },
  { label: "sout",       detail: "System.out.println(...)",    documentation: "Print to stdout",
    insertText: 'System.out.println(${1:value});' },
  { label: "serr",       detail: "System.err.println(...)",    documentation: "Print to stderr",
    insertText: 'System.err.println(${1:value});' },
  { label: "soutf",      detail: "System.out.printf(...)",     documentation: "Formatted print",
    insertText: 'System.out.printf("${1:%s}%n", ${2:value});' },

  // ── Control flow ──
  { label: "for",        detail: "for loop",                   documentation: "Classic for loop",
    insertText: ["for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {", "    ${3}", "}"].join("\n") },
  { label: "forr",       detail: "enhanced for",               documentation: "Enhanced for-each loop",
    insertText: ["for (${1:String} ${2:item} : ${3:collection}) {", "    ${4}", "}"].join("\n") },
  { label: "while",      detail: "while loop",                 documentation: "While loop",
    insertText: ["while (${1:condition}) {", "    ${2}", "}"].join("\n") },
  { label: "dowhile",    detail: "do-while loop",              documentation: "Do-while loop",
    insertText: ["do {", "    ${1}", "} while (${2:condition});"].join("\n") },
  { label: "if",         detail: "if statement",               documentation: "If statement",
    insertText: ["if (${1:condition}) {", "    ${2}", "}"].join("\n") },
  { label: "ife",        detail: "if-else statement",          documentation: "If-else statement",
    insertText: ["if (${1:condition}) {", "    ${2}", "} else {", "    ${3}", "}"].join("\n") },
  { label: "switch",     detail: "switch statement",           documentation: "Switch statement",
    insertText: ["switch (${1:var}) {", "    case ${2:val}:", "        ${3}", "        break;", "    default:", "        break;", "}"].join("\n") },

  // ── Classes & methods ──
  { label: "class",      detail: "class definition",           documentation: "Define a Java class",
    insertText: ["public class ${1:Name} {", "    public ${1:Name}() {", "        ${2}", "    }", "}"].join("\n") },
  { label: "method",     detail: "public method",              documentation: "Define a public method",
    insertText: ["public ${1:void} ${2:name}(${3:int x}) {", "    ${4}", "}"].join("\n") },
  { label: "static",     detail: "static method",              documentation: "Define a static method",
    insertText: ["public static ${1:void} ${2:name}(${3:int x}) {", "    ${4}", "}"].join("\n") },

  // ── Collections ──
  { label: "list",       detail: "ArrayList<T>",               documentation: "ArrayList declaration",
    insertText: "ArrayList<${1:String}> ${2:list} = new ArrayList<>();" },
  { label: "map",        detail: "HashMap<K,V>",               documentation: "HashMap declaration",
    insertText: "HashMap<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();" },
  { label: "set",        detail: "HashSet<T>",                 documentation: "HashSet declaration",
    insertText: "HashSet<${1:String}> ${2:set} = new HashSet<>();" },

  // ── I/O ──
  { label: "scanner",    detail: "Scanner(System.in)",         documentation: "Read from stdin",
    insertText: ["Scanner ${1:sc} = new Scanner(System.in);"].join("\n") },
  { label: "readint",    detail: "scanner.nextInt()",          documentation: "Read integer from stdin",
    insertText: "int ${1:n} = ${2:sc}.nextInt();" },
  { label: "readline",   detail: "scanner.nextLine()",         documentation: "Read line from stdin",
    insertText: 'String ${1:line} = ${2:sc}.nextLine();' },

  // ── Exception handling ──
  { label: "try",        detail: "try-catch block",            documentation: "Try-catch exception handling",
    insertText: ["try {", "    ${1}", "} catch (${2:Exception} e) {", "    System.err.println(e.getMessage());", "}"].join("\n") },
  { label: "tryf",       detail: "try-catch-finally",          documentation: "Try-catch-finally",
    insertText: ["try {", "    ${1}", "} catch (${2:Exception} e) {", "    ${3}", "} finally {", "    ${4}", "}"].join("\n") },
  { label: "throw",      detail: "throw new Exception",        documentation: "Throw an exception",
    insertText: 'throw new ${1:IllegalArgumentException}("${2:message}");' },
];
/* eslint-enable no-template-curly-in-string */

const editorOptions = {
  automaticLayout: true,
  autoIndent: "advanced",
  bracketPairColorization: { enabled: true },
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  fontFamily: 'JetBrains Mono, Monaco, Courier New, monospace',
  fontLigatures: true,
  fontSize: 14,
  formatOnPaste: true,
  formatOnType: true,
  glyphMargin: true,
  guides: {
    bracketPairs: false,
    indentation: true,
  },
  lineHeight: 22,
  minimap: { enabled: true, renderCharacters: false, scale: 0.75 },
  padding: { top: 14, bottom: 14 },
  quickSuggestions: { other: true, comments: false, strings: true },
  suggestOnTriggerCharacters: true,
  snippetSuggestions: "top",
  wordBasedSuggestions: "allDocuments",
  parameterHints: { enabled: true },
  suggest: {
    snippetsPreventQuickSuggestions: false,
    insertMode: 'replace',
    filterGraceful: true,
    showMethods: true,
    showFunctions: true,
    showVariables: true,
    showKeywords: true,
    showWords: true,
    showSnippets: true,
  },
  acceptSuggestionOnEnter: 'on',
  roundedSelection: false,
  scrollBeyondLastLine: false,
  scrollbar: {
    verticalScrollbarSize: 12,
    horizontalScrollbarSize: 12,
  },
  smoothScrolling: true,
  tabSize: 4,
  wordWrap: "on",
};

function parseErrorMarkers(errorText, lang) {
  if (!errorText) return [];
  const markers = [];
  if (lang === 'python') {
    const m = errorText.match(/line (\d+)/);
    if (m) {
      const lastLine = errorText.trim().split('\n').filter(l => l.trim()).pop() || errorText;
      markers.push({ startLineNumber: +m[1], endLineNumber: +m[1], startColumn: 1, endColumn: 9999, message: lastLine, severity: 8 });
    }
  } else if (lang === 'java') {
    const re = /\w+\.java:(\d+):\s*error:\s*(.*)/g;
    let m;
    while ((m = re.exec(errorText)) !== null) {
      markers.push({ startLineNumber: +m[1], endLineNumber: +m[1], startColumn: 1, endColumn: 9999, message: m[2], severity: 8 });
    }
  } else {
    const re = /(?:main\.[a-z]+):(\d+):(\d+):\s*(error|warning):\s*(.*)/g;
    let m;
    while ((m = re.exec(errorText)) !== null) {
      markers.push({ startLineNumber: +m[1], endLineNumber: +m[1], startColumn: +m[2] || 1, endColumn: 9999, message: m[4], severity: m[3] === 'error' ? 8 : 4 });
    }
  }
  return markers;
}

export default function CodeEditor({ code, onChange, currentLine, onEditRequest, language = "cpp", compact = false, compileError = null, performance = null, breakpoints = null, onBreakpointsChange = null }) {
  const lineRefs = useRef({});
  const completionProviderRef = useRef(null);
  const monacoRef = useRef(null);
  const editorRef = useRef(null);
  const decorationIdsRef = useRef([]);
  const bpDecorationsRef = useRef([]);
  const breakpointsRef = useRef(breakpoints || new Set());
  const onBreakpointsChangeRef = useRef(onBreakpointsChange);
  const containerRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => { breakpointsRef.current = breakpoints || new Set(); }, [breakpoints]);
  useEffect(() => { onBreakpointsChangeRef.current = onBreakpointsChange; }, [onBreakpointsChange]);

  // Force Monaco to recalculate layout whenever the container is resized
  // (covers: initial render where flex heights aren't resolved, sidebar appearing/disappearing)
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      editorRef.current?.layout?.();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  });

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(monacoThemeName(theme));
    }
  }, [theme]);

  useEffect(() => {
    if (!monacoRef.current || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    monacoRef.current.editor.setModelMarkers(model, 'traceon', parseErrorMarkers(compileError, language));
  }, [compileError, language]);

  // Phase 12.2: Execution Heatmap Decorations
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current || !performance) {
      if (editorRef.current) {
        decorationIdsRef.current = editorRef.current.deltaDecorations(decorationIdsRef.current, []);
      }
      return;
    }

    const { line_hits = {} } = performance;
    const maxHits = Math.max(...Object.values(line_hits), 1);
    
    const newDecorations = Object.entries(line_hits).map(([lineStr, hits]) => {
      const line = parseInt(lineStr);
      const intensity = hits / maxHits;
      
      // Calculate color (Blue 0% -> Yellow 50% -> Red 100%)
      let colorClass = "heat-low";
      if (intensity > 0.7) colorClass = "heat-high";
      else if (intensity > 0.3) colorClass = "heat-med";

      return {
        range: new monacoRef.current.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          linesDecorationsClassName: `heatmap-gutter ${colorClass}`,
          className: `heatmap-line ${colorClass}`,
          hoverMessage: { value: `Executed ${hits} times` }
        }
      };
    });

    decorationIdsRef.current = editorRef.current.deltaDecorations(decorationIdsRef.current, newDecorations);
  }, [performance]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const bp = breakpoints || new Set();
    const decors = [...bp].map(line => ({
      range: new monacoRef.current.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: 'breakpoint-line',
        glyphMarginClassName: 'breakpoint-glyph',
        glyphMarginHoverMessage: { value: 'Breakpoint — click gutter to remove' },
      },
    }));
    bpDecorationsRef.current = editorRef.current.deltaDecorations(bpDecorationsRef.current, decors);
  }, [breakpoints]);

  const handleEditorMount = (editor, monaco) => {
    monacoRef.current = monaco;
    editorRef.current = editor;

    monaco.editor.defineTheme("traceon-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword",   foreground: "7C3AED" },
        { token: "string",    foreground: "2D6A4F" },
        { token: "number",    foreground: "B45309" },
        { token: "comment",   foreground: "9CA3AF", fontStyle: "italic" },
        { token: "type",      foreground: "B45309" },
        { token: "delimiter", foreground: "5A4A3C" },
        { token: "operator",  foreground: "C96A48" },
      ],
      colors: {
        "editor.background":               "#F7F3EE",
        "editor.foreground":               "#1A1310",
        "editor.lineHighlightBackground":  "#EDE8E010",
        "editorLineNumber.foreground":     "#B0A090",
        "editorLineNumber.activeForeground": "#C96A48",
        "editor.selectionBackground":      "#C96A4828",
        "editor.inactiveSelectionBackground": "#C96A4814",
        "editorCursor.foreground":         "#C96A48",
        "editorIndentGuide.background":    "#00000010",
        "editorIndentGuide.activeBackground": "#00000020",
        "editorWhitespace.foreground":     "#00000015",
      },
    });

    monaco.editor.defineTheme("traceon-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword",   foreground: "C084FC" },
        { token: "string",    foreground: "4ADE80" },
        { token: "number",    foreground: "FBBF24" },
        { token: "comment",   foreground: "6B7280", fontStyle: "italic" },
        { token: "type",      foreground: "7DD3FC" },
        { token: "delimiter", foreground: "9CA3AF" },
        { token: "operator",  foreground: "D97757" },
      ],
      colors: {
        "editor.background":               "#1C1917",
        "editor.foreground":               "#F5EEE6",
        "editor.lineHighlightBackground":  "#2B252180",
        "editorLineNumber.foreground":     "#4A3F38",
        "editorLineNumber.activeForeground": "#D97757",
        "editor.selectionBackground":      "#D9775730",
        "editor.inactiveSelectionBackground": "#D9775718",
        "editorCursor.foreground":         "#D97757",
        "editorIndentGuide.background":    "#FFFFFF0A",
        "editorIndentGuide.activeBackground": "#FFFFFF16",
        "editorWhitespace.foreground":     "#FFFFFF0A",
        "editorBracketMatch.background":   "#D9775728",
        "editorBracketMatch.border":       "#D9775760",
      },
    });

    monaco.editor.defineTheme("traceon-ocean", {
      base: "vs-dark", inherit: true,
      rules: [
        { token: "keyword",   foreground: "FF7B72" },
        { token: "string",    foreground: "A5D6FF" },
        { token: "number",    foreground: "79C0FF" },
        { token: "comment",   foreground: "8B949E", fontStyle: "italic" },
        { token: "type",      foreground: "F0883E" },
        { token: "operator",  foreground: "58A6FF" },
      ],
      colors: {
        "editor.background":               "#0D1117",
        "editor.foreground":               "#E6EDF3",
        "editor.lineHighlightBackground":  "#161B2280",
        "editorLineNumber.foreground":     "#3A414A",
        "editorLineNumber.activeForeground": "#58A6FF",
        "editor.selectionBackground":      "#58A6FF28",
        "editorCursor.foreground":         "#58A6FF",
        "editorIndentGuide.background":    "#FFFFFF08",
        "editorIndentGuide.activeBackground": "#FFFFFF14",
      },
    });

    monaco.editor.defineTheme("traceon-forest", {
      base: "vs-dark", inherit: true,
      rules: [
        { token: "keyword",   foreground: "98E4A0" },
        { token: "string",    foreground: "C3E8C3" },
        { token: "number",    foreground: "FFD700" },
        { token: "comment",   foreground: "4A6D4E", fontStyle: "italic" },
        { token: "type",      foreground: "7DCFDA" },
        { token: "operator",  foreground: "57C87A" },
      ],
      colors: {
        "editor.background":               "#0D1A12",
        "editor.foreground":               "#D4F1D7",
        "editor.lineHighlightBackground":  "#13201980",
        "editorLineNumber.foreground":     "#2A4230",
        "editorLineNumber.activeForeground": "#57C87A",
        "editor.selectionBackground":      "#57C87A28",
        "editorCursor.foreground":         "#57C87A",
        "editorIndentGuide.background":    "#FFFFFF08",
        "editorIndentGuide.activeBackground": "#FFFFFF14",
      },
    });

    monaco.editor.defineTheme("traceon-midnight", {
      base: "vs-dark", inherit: true,
      rules: [
        { token: "keyword",   foreground: "C084FC" },
        { token: "string",    foreground: "86EFAC" },
        { token: "number",    foreground: "FCA5A5" },
        { token: "comment",   foreground: "5A5275", fontStyle: "italic" },
        { token: "type",      foreground: "818CF8" },
        { token: "operator",  foreground: "A855F7" },
      ],
      colors: {
        "editor.background":               "#0F0E17",
        "editor.foreground":               "#E8E3F5",
        "editor.lineHighlightBackground":  "#16141F80",
        "editorLineNumber.foreground":     "#2E2A45",
        "editorLineNumber.activeForeground": "#A855F7",
        "editor.selectionBackground":      "#A855F728",
        "editorCursor.foreground":         "#A855F7",
        "editorIndentGuide.background":    "#FFFFFF08",
        "editorIndentGuide.activeBackground": "#FFFFFF14",
      },
    });

    // Gutter click → toggle breakpoint
    editor.onMouseDown((e) => {
      const { type, position } = e.target;
      if (
        (type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS ||
         type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) &&
        position
      ) {
        const line = position.lineNumber;
        const next = new Set(breakpointsRef.current);
        if (next.has(line)) next.delete(line); else next.add(line);
        onBreakpointsChangeRef.current?.(next);
      }
    });

    if (!completionProviderRef.current) {
      const makeProvider = (snippets, triggerChars = []) => ({
        triggerCharacters: triggerChars,
        provideCompletionItems(model, position) {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          return {
            suggestions: snippets.map((s) => ({
              label: s.label,
              kind: monaco.languages.CompletionItemKind.Snippet,
              detail: s.detail,
              documentation: s.documentation,
              insertText: s.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
            })),
          };
        },
      });

      completionProviderRef.current = [
        monaco.languages.registerCompletionItemProvider("cpp",    makeProvider(cppSnippets, ['.', '>', ':', '#'])),
        monaco.languages.registerCompletionItemProvider("c",      makeProvider(cSnippets,   ['.', '>', '#'])),
        monaco.languages.registerCompletionItemProvider("python", makeProvider(pythonSnippets, ['.', '('])),
        monaco.languages.registerCompletionItemProvider("java",   makeProvider(javaSnippets,   ['.', '('])),
      ];
    }

    monaco.editor.setTheme(monacoThemeName(theme));
    editor.focus();

    // Force layout after initial mount — flex heights may not be resolved yet
    requestAnimationFrame(() => editor.layout());
  };

  // Auto-scroll to the active line
  useEffect(() => {
    if (currentLine && lineRefs.current[currentLine]) {
      lineRefs.current[currentLine].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLine]);

  const lines = code.split("\n");

  if (currentLine !== undefined && currentLine !== null) {
    return (
      <div className="code-editor" ref={containerRef}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>Playing — currently on line {currentLine}</span>
          <button className="edit-code-btn" onClick={onEditRequest}>
            Edit Code
          </button>
        </div>
        <div className="code-viewer">
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isActive = lineNum === currentLine;
            return (
              <div
                key={idx}
                ref={(el) => { lineRefs.current[lineNum] = el; }}
                className={`code-line${isActive ? " active-line" : ""}`}
              >
                <span className="line-arrow">{isActive ? "➤" : ""}</span>
                <span className="line-number">{lineNum}</span>
                <span className="line-content">{line || " "}</span>
              </div>
            );
          })}
        </div>
        <div className="editor-info">
          Line: <span className="line-count">{currentLine}</span> of{" "}
          <span className="char-count">{lines.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="code-editor" ref={containerRef}>
      {!compact && <div className="editor-hint">{language === "python" ? "Python" : language === "c" ? "C" : language === "java" ? "Java" : "C++"} editor with syntax highlighting, indentation, and bracket matching</div>}
      <div className="editor-shell">
        {!compact && (
          <div className="editor-toolbar">
            <span className="editor-language-pill">{language === "python" ? "Python" : language === "c" ? "C" : language === "java" ? "Java" : "C++"}</span>
            <span className="editor-toolbar-tip">Write code, then run the existing analyzer and visualizer</span>
          </div>
        )}
        <Editor
          className="monaco-editor-pane"
          height="100%"
          defaultLanguage={language === "python" ? "python" : language === "c" ? "c" : language === "java" ? "java" : "cpp"}
          language={language === "python" ? "python" : language === "c" ? "c" : language === "java" ? "java" : "cpp"}
          value={code}
          onChange={(value) => onChange(value ?? "")}
          onMount={handleEditorMount}
          options={editorOptions}
          theme={monacoThemeName(theme)}
        />
      </div>
      <div className="editor-info">
        Lines: <span className="line-count">{lines.length}</span>
        {" "}| Characters: <span className="char-count">{code.length}</span>
      </div>
    </div>
  );
}

