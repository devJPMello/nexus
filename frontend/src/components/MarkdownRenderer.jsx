import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer = ({ content, className = '' }) => {
  const styles = `
    .markdown-content {
      line-height: 1.6;
      color: inherit;
    }

    .markdown-content h1,
    .markdown-content h2,
    .markdown-content h3,
    .markdown-content h4,
    .markdown-content h5,
    .markdown-content h6 {
      margin: 1.5rem 0 1rem 0;
      font-weight: 600;
      line-height: 1.25;
      color: #ffffff;
    }

    .markdown-content h1 {
      font-size: 1.5rem;
      border-bottom: 1px solid #4b5563;
      padding-bottom: 0.5rem;
    }

    .markdown-content h2 {
      font-size: 1.25rem;
    }

    .markdown-content h3 {
      font-size: 1.125rem;
    }

    .markdown-content h4 {
      font-size: 1rem;
    }

    .markdown-content p {
      margin: 0.75rem 0;
    }

    .markdown-content ul,
    .markdown-content ol {
      margin: 0.75rem 0;
      padding-left: 1.5rem;
    }

    .markdown-content li {
      margin: 0.25rem 0;
    }

    .markdown-content blockquote {
      margin: 1rem 0;
      padding: 0.75rem 1rem;
      border-left: 4px solid #8b5cf6;
      background: rgba(139, 92, 246, 0.1);
      border-radius: 0 6px 6px 0;
      color: #ffffff;
    }

    .markdown-content blockquote p {
      margin: 0;
      font-style: italic;
      color: #ffffff;
    }

    .markdown-content code {
      background: rgba(255, 255, 255, 0.1);
      padding: 0.125rem 0.25rem;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875em;
      color: #ffffff;
    }

    .markdown-content pre {
      background: #1f2937;
      color: #e5e7eb;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1rem 0;
      border: 1px solid #374151;
    }

    .markdown-content pre code {
      background: none;
      padding: 0;
      color: inherit;
      font-size: 0.875rem;
    }

    .markdown-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      background: #2d2d2d;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .markdown-content th,
    .markdown-content td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #4b5563;
      color: #ffffff;
    }

    .markdown-content th {
      background: #374151;
      font-weight: 600;
      color: #ffffff;
    }

    .markdown-content tr:last-child td {
      border-bottom: none;
    }

    .markdown-content tr:nth-child(even) {
      background: #2d2d2d;
    }

    .markdown-content tr:nth-child(odd) {
      background: #374151;
    }

    .markdown-content a {
      color: #8b5cf6;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: all 0.2s ease;
    }

    .markdown-content a:hover {
      border-bottom-color: #8b5cf6;
    }

    .markdown-content strong {
      font-weight: 600;
    }

    .markdown-content em {
      font-style: italic;
    }

    .markdown-content hr {
      border: none;
      height: 1px;
      background: #4b5563;
      margin: 2rem 0;
    }

    .markdown-content img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1rem 0;
    }

    /* Text color adjustments for assistant messages */
    .markdown-content {
      color: #ffffff;
    }

    .markdown-content.dark-theme table {
      background: #2d2d2d;
      color: #e5e5e5;
    }

    .markdown-content.dark-theme th {
      background: #374151;
      color: #f3f4f6;
    }

    .markdown-content.dark-theme tr:nth-child(even) {
      background: #2d2d2d;
    }

    .markdown-content.dark-theme tr:nth-child(odd) {
      background: #374151;
    }

    .markdown-content.dark-theme th,
    .markdown-content.dark-theme td {
      border-bottom-color: #4b5563;
    }

    .markdown-content.dark-theme blockquote {
      background: rgba(139, 92, 246, 0.1);
      border-left-color: #8b5cf6;
    }

    .markdown-content.dark-theme code {
      background: rgba(255, 255, 255, 0.1);
    }

    .markdown-content.dark-theme pre {
      background: #1f2937;
      border-color: #4b5563;
    }

    .markdown-content.dark-theme hr {
      background: #4b5563;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className={`markdown-content ${className}`}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom components for better styling
            table: ({ children, ...props }) => (
              <div style={{ overflowX: 'auto' }}>
                <table {...props}>{children}</table>
              </div>
            ),
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline ? (
                <pre {...props}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </>
  );
};

export default MarkdownRenderer;
