export type Severity = "high" | "medium" | "low";
export type Finding = {
  ruleId: string;
  severity: Severity;
  title: string;
  detail: string;
  file: string;
  line?: number;
};

function lineOf(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

export function isUiFile(path: string): boolean {
  return /\.(tsx?|jsx?|html|vue|svelte)$/i.test(path);
}

export function scanA11y(file: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const add = (ruleId: string, severity: Severity, title: string, detail: string, re: RegExp) => {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      findings.push({ ruleId, severity, title, detail, file, line: lineOf(content, m.index) });
    }
  };

  add(
    "img-missing-alt",
    "high",
    "<img> without alt",
    "Images need an alt attribute (use alt=\"\" only for decorative images).",
    /<img\b(?![^>]*\balt=)[^>]*>/gi,
  );
  add(
    "icon-button-no-label",
    "medium",
    "button/icon without accessible name",
    "Icon-only controls need aria-label or visible text.",
    /<button\b(?![^>]*(?:aria-label|aria-labelledby)=)[^>]*>\s*<(?:svg|i|span)[\s>]/gi,
  );
  add(
    "div-onclick",
    "medium",
    "clickable <div>/<span> without keyboard support",
    "Prefer <button> or add role/tabIndex/onKeyDown for keyboard users.",
    /<(?:div|span)\b[^>]*\bonClick\s*=/gi,
  );
  add(
    "input-no-label",
    "high",
    "input without associated label/aria",
    "Form controls need a label, aria-label, or aria-labelledby.",
    /<input\b(?![^>]*(?:aria-label|aria-labelledby|id=)|=)[^>]*>/gi,
  );
  // softer input check: input without aria-label and not type hidden
  add(
    "autofocus",
    "low",
    "autoFocus / autofocus",
    "Autofocus can confuse screen-reader and keyboard users.",
    /\bautoFocus\b|\bautofocus\b/gi,
  );

  return findings;
}

/** Only scan added lines from a unified diff for UI files. */
export function scanDiffForA11y(diff: string): Finding[] {
  const findings: Finding[] = [];
  let file = "unknown";
  let newLine = 0;
  for (const raw of diff.split(/\r?\n/)) {
    if (raw.startsWith("+++ b/")) {
      file = raw.slice(6).trim();
      continue;
    }
    if (raw.startsWith("@@")) {
      const m = raw.match(/\+(\d+)/);
      newLine = m ? Number(m[1]) : 0;
      continue;
    }
    if (raw.startsWith("+") && !raw.startsWith("+++")) {
      const text = raw.slice(1);
      if (isUiFile(file)) {
        for (const f of scanA11y(file, text)) {
          findings.push({ ...f, line: newLine });
        }
      }
      newLine += 1;
      continue;
    }
    if (!raw.startsWith("-") && !raw.startsWith("\\") && !raw.startsWith("diff ") && !raw.startsWith("index ")) {
      newLine += 1;
    }
  }
  return findings;
}
