import React, { useState, useEffect, useRef } from 'react';
import { createProject, createFile } from '../services/api';
import Modal from './ui/Modal';
import Button from './ui/Button';

const LANG_OPTIONS = [
  { value: 'cpp',    label: 'C++',    icon: 'code' },
  { value: 'c',      label: 'C',      icon: 'code' },
  { value: 'python', label: 'Python', icon: 'code' },
  { value: 'java',   label: 'Java',   icon: 'code' },
];

const TEMPLATES = {
  'Hello World': {
    icon: 'waving_hand',
    description: 'Print a greeting to the console',
    cpp: `#include <iostream>
using namespace std;

int main() {
    string message = "Hello, World!";
    cout << message << endl;
    return 0;
}`,
    c: `#include <stdio.h>

int main() {
    char message[] = "Hello, World!";
    printf("%s\\n", message);
    return 0;
}`,
    python: `def greet(name):
    message = f"Hello, {name}!"
    return message

result = greet("World")
print(result)`,
    java: `public class Main {
    public static void main(String[] args) {
        String message = "Hello, World!";
        System.out.println(message);
    }
}`,
  },
  'Fibonacci': {
    icon: 'functions',
    description: 'Compute the Fibonacci sequence iteratively',
    cpp: `#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    int a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        int c = a + b;
        a = b;
        b = c;
    }
    return b;
}

int main() {
    for (int i = 0; i <= 10; i++) {
        cout << "fib(" << i << ") = " << fibonacci(i) << endl;
    }
    return 0;
}`,
    c: `#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    int a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        int c = a + b;
        a = b;
        b = c;
    }
    return b;
}

int main() {
    for (int i = 0; i <= 10; i++) {
        printf("fib(%d) = %d\\n", i, fibonacci(i));
    }
    return 0;
}`,
    python: `def fibonacci(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

for i in range(11):
    print(f"fib({i}) = {fibonacci(i)}")`,
    java: `public class Main {
    static int fibonacci(int n) {
        if (n <= 1) return n;
        int a = 0, b = 1;
        for (int i = 2; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }

    public static void main(String[] args) {
        for (int i = 0; i <= 10; i++) {
            System.out.println("fib(" + i + ") = " + fibonacci(i));
        }
    }
}`,
  },
  'Sorting Demo': {
    icon: 'sort',
    description: 'Bubble sort an array of integers',
    cpp: `#include <iostream>
using namespace std;

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = 7;
    bubbleSort(arr, n);
    cout << "Sorted: ";
    for (int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    return 0;
}`,
    c: `#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = 7;
    bubbleSort(arr, n);
    printf("Sorted: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    return 0;
}`,
    python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

numbers = [64, 34, 25, 12, 22, 11, 90]
sorted_nums = bubble_sort(numbers.copy())
print("Original:", numbers)
print("Sorted:  ", sorted_nums)`,
    java: `public class Main {
    static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }

    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        bubbleSort(arr);
        System.out.print("Sorted: ");
        for (int x : arr) System.out.print(x + " ");
        System.out.println();
    }
}`,
  },
};

const FILE_NAMES = { cpp: 'main.cpp', c: 'main.c', python: 'main.py', java: 'Main.java' };

const NewProjectModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName]         = useState('');
  const [language, setLanguage] = useState('cpp');
  const [template, setTemplate] = useState('Hello World');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const nameRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setLanguage('cpp');
      setTemplate('Hello World');
      setError(null);
      setTimeout(() => nameRef.current?.focus(), 60);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Project name is required'); return; }

    setLoading(true);
    setError(null);
    try {
      const { project } = await createProject(trimmed, language);
      const code = TEMPLATES[template][language];
      const fileName = FILE_NAMES[language];
      const { file } = await createFile(project.id, fileName, language, code);
      onCreate({ project, file, code, language });
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) handleCreate();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      subtitle="Set up a new workspace for code execution and debugging."
      maxWidth="500px"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="add"
            loading={loading}
            disabled={!name.trim()}
            onClick={handleCreate}
          >
            Create Project
          </Button>
        </>
      }
    >
      <div onKeyDown={handleKeyDown} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Name */}
        <div>
          <label className="npm-label" style={{ marginTop: 0 }}>Project Name</label>
          <input
            ref={nameRef}
            className="npm-input"
            type="text"
            placeholder="e.g. Binary Search Tree"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            maxLength={60}
            autoFocus
          />
        </div>

        {/* Language */}
        <div>
          <label className="npm-label">Language</label>
          <div className="npm-lang-tabs">
            {LANG_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`npm-lang-tab ${language === opt.value ? 'active' : ''} lang-tab-${opt.value}`}
                onClick={() => setLanguage(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template */}
        <div>
          <label className="npm-label">Starter Template</label>
          <div className="npm-templates">
            {Object.entries(TEMPLATES).map(([key, tmpl]) => (
              <button
                key={key}
                type="button"
                className={`npm-template-card ${template === key ? 'active' : ''}`}
                onClick={() => setTemplate(key)}
              >
                <span className="material-symbols-outlined npm-tmpl-icon">{tmpl.icon}</span>
                <span className="npm-tmpl-name">{key}</span>
                <span className="npm-tmpl-desc">{tmpl.description}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="npm-error">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default NewProjectModal;
export { TEMPLATES, FILE_NAMES };

