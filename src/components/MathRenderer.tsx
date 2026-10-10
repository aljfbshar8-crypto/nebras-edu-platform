import React, { useMemo } from 'react';
import { cleanLatexString, safeRenderKatex } from '../utils/latexSanitizer';

interface MathRendererProps {
  content: string;
  className?: string;
  block?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', block = false }) => {
  const renderedContent = useMemo(() => {
    if (!content) return '';

    // If pure block LaTeX without $ marks
    if (block && !content.includes('$')) {
      return safeRenderKatex(content, true);
    }

    // First sanitize leaked HTML tags outside of math
    let parsed = content;

    // Replace display block math $$ ... $$
    parsed = parsed.replace(/\$\$([\s\S]*?)\$\$/g, (_, equation) => {
      const rendered = safeRenderKatex(equation, true);
      return `<div class="katex-display my-2.5 overflow-x-auto">${rendered}</div>`;
    });

    // Replace brackets \[ ... \] if any remain
    parsed = parsed.replace(/\\\[([\s\S]*?)\\\]/g, (_, equation) => {
      const rendered = safeRenderKatex(equation, true);
      return `<div class="katex-display my-2.5 overflow-x-auto">${rendered}</div>`;
    });

    // Replace inline math $ ... $
    parsed = parsed.replace(/\$([^\$\n]+?)\$/g, (_, equation) => {
      return safeRenderKatex(equation, false);
    });

    // Replace inline parentheses \( ... \)
    parsed = parsed.replace(/\\\(([\s\S]*?)\\\)/g, (_, equation) => {
      return safeRenderKatex(equation, false);
    });

    // Format newlines into line breaks
    parsed = parsed.replace(/\n/g, '<br />');

    return parsed;
  }, [content, block]);

  return (
    <div
      className={`leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

