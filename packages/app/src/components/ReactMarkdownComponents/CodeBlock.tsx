import { CodeComponent } from 'react-markdown/lib/ast-to-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import styles from './CodeBlock.module.scss';

export const CodeBlock: CodeComponent = ({ inline, className, children }) => {
  if (inline) {
    return <code className={`code-inline ${styles['code-inline']} ${className ?? ''}`}>{children}</code>;
  }

  // TODO: set border according to the value of 'customize:highlightJsStyleBorder'

  const match = /language-(\w+)(:?.+)?/.exec(className || '');
  const lang = match && match[1] ? match[1] : '';
  const name = match && match[2] ? match[2].slice(1) : null;

  return (
    <>
      {name != null && (
        <cite className={`code-highlighted-title ${styles['code-highlighted-title']}`}>{name}</cite>
      )}
      <SyntaxHighlighter
        className="code-highlighted"
        PreTag="div"
        style={oneLight}
        language={lang}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </>
  );
};
