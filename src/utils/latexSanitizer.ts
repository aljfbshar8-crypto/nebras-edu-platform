import katex from 'katex';

/**
 * Sanitizes and cleans raw LaTeX strings to prevent KaTeX ParseErrors
 * and eliminate leaked HTML tags (such as <span>, <div>, <br>).
 */
export function cleanLatexString(raw: string): string {
  if (!raw) return '';

  let sanitized = raw;

  // 1. Remove leaked HTML tags that LLMs sometimes embed inside math strings
  sanitized = sanitized.replace(/<\/?(?:span|div|p|b|i|strong|em|br|hr|code|pre)[^>]*>/gi, ' ');
  sanitized = sanitized.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

  // 2. Fix broken `\&` escapes which crash KaTeX with:
  // "ParseError: KaTeX parse error: Can't use function '\&' in math mode"
  // If inside an alignment environment (matrix, align, cases), replace with standard column separator &
  const isMatrixEnvironment =
    sanitized.includes('\\begin{matrix}') ||
    sanitized.includes('\\begin{pmatrix}') ||
    sanitized.includes('\\begin{bmatrix}') ||
    sanitized.includes('\\begin{vmatrix}') ||
    sanitized.includes('\\begin{aligned}') ||
    sanitized.includes('\\begin{cases}') ||
    sanitized.includes('\\begin{array}');

  if (isMatrixEnvironment) {
    sanitized = sanitized.replace(/\\&/g, ' & ');
  } else {
    // Outside matrices, replace `\&` or bare `&` with text conjunction or quad
    sanitized = sanitized.replace(/\\&/g, ' \\text{ و } ');
    sanitized = sanitized.replace(/([^\\&])&([^&])/g, '$1 \\text{ و } $2');
  }

  // 3. Prevent % comments in LaTeX from cutting off the remaining expression
  // Replace bare % not preceded by backslash with \%
  sanitized = sanitized.replace(/(^|[^\\])%/g, '$1\\%');

  // 4. Normalize brackets \[ ... \] to $$ and \( ... \) to $
  sanitized = sanitized.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$');
  sanitized = sanitized.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

  // 5. Clean up multiple spaces and empty braces
  sanitized = sanitized.replace(/\\text\{\s*\}/g, '');
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized.trim();
}

/**
 * Safely renders LaTeX via KaTeX without crashing or leaking red/grey ParseError blocks.
 * If KaTeX fails, falls back to a clean mathematical typographical rendering.
 */
export function safeRenderKatex(equation: string, displayMode: boolean = false): string {
  const cleaned = cleanLatexString(equation);
  if (!cleaned) return '';

  try {
    // Try rendering with throwOnError true so we catch any parse issues immediately
    return katex.renderToString(cleaned, {
      displayMode,
      throwOnError: true,
      strict: false,
    });
  } catch {
    // Secondary attempt: strip any remaining complex macros that might cause errors
    try {
      const relaxed = cleaned
        .replace(/\\[a-zA-Z]+/g, (match) => {
          // Keep common safe math macros
          const safeMacros = [
            '\\frac', '\\sqrt', '\\int', '\\sum', '\\lim', '\\sin', '\\cos', '\\tan',
            '\\alpha', '\\beta', '\\gamma', '\\theta', '\\pi', '\\infty', '\\cdot',
            '\\times', '\\pm', '\\leq', '\\geq', '\\neq', '\\approx', '\\text', '\\quad',
            '\\to', '\\partial', '\\Delta', '\\lambda', '\\sigma', '\\in', '\\subset'
          ];
          return safeMacros.includes(match) ? match : '';
        })
        .replace(/[{}]/g, ' ')
        .trim();

      return katex.renderToString(relaxed, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch {
      // Elegant clean fallback without any ParseError banner
      const modeClass = displayMode
        ? 'block my-3 px-4 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-center text-cyan-300 font-mono text-sm overflow-x-auto shadow-inner'
        : 'inline-block px-1.5 py-0.5 mx-0.5 bg-slate-800/80 border border-slate-700/50 rounded-md text-cyan-300 font-mono text-xs';

      // Escape HTML in the fallback output
      const escaped = cleaned
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      return `<span class="${modeClass}" dir="ltr">${escaped}</span>`;
    }
  }
}
