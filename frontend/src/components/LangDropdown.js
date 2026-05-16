import React, { useEffect, useRef, useState } from "react";

export const LANG_OPTIONS = [
  { value: "cpp",    label: "C++"    },
  { value: "c",      label: "C"      },
  { value: "python", label: "Python" },
  { value: "java",   label: "Java"   },
];

export default function LangDropdown({ language, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANG_OPTIONS.find(o => o.value === language);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="ex-dropdown" ref={ref}>
      <button className="ex-dropdown-trigger" onClick={() => setOpen(o => !o)}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--primary)" }}>code</span>
        {current?.label}
        <span className="material-symbols-outlined ex-chevron" style={{ transform: open ? "rotate(180deg)" : "none" }}>expand_more</span>
      </button>
      {open && (
        <ul className="ex-dropdown-menu">
          {LANG_OPTIONS.map(opt => (
            <li key={opt.value}
              className={`ex-dropdown-item ${opt.value === language ? "active" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}>
              {opt.value === language && <span className="material-symbols-outlined ex-check">check</span>}
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
