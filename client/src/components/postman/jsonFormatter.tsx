import type { JSX } from 'react';

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isJsonContentType(contentType: string): boolean {
  if (!contentType) return false;
  return /application\/json|\+json/i.test(contentType);
}

interface JsonToken {
  type:
    | 'bracket'
    | 'key'
    | 'string'
    | 'number'
    | 'boolean'
    | 'null'
    | 'punctuation'
    | 'indent';
  value: string;
}

const COLOR_MAP: Record<JsonToken['type'], string> = {
  bracket: '#d4d4d4',
  key: '#9cdcfe',
  string: '#ce9178',
  number: '#b5cea8',
  boolean: '#569cd6',
  null: '#569cd6',
  punctuation: '#d4d4d4',
  indent: 'inherit',
};

/**
 * High-level JSON tokenizer for syntax highlighting.
 * Walks character by character and classifies each token.
 */
function tokenizeJson(jsonStr: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let i = 0;
  const len = jsonStr.length;

  const pushIndent = (n: number): void => {
    if (n > 0) tokens.push({ type: 'indent', value: '  '.repeat(n) });
  };

  let indent = 0;
  let inKey = false; // whether next string is an object key

  while (i < len) {
    const ch = jsonStr[i];

    // whitespace → handle newlines for indentation
    if (ch === '\n') {
      tokens.push({ type: 'indent', value: '\n' });
      i += 1;
      // count subsequent spaces/tabs → we'll replace with our own indent
      while (i < len && (jsonStr[i] === ' ' || jsonStr[i] === '\t')) {
        i += 1;
      }
      // the next meaningful token will add its own indent
      continue;
    }

    if (ch === ' ' || ch === '\t') {
      i += 1;
      continue;
    }

    // determine indent level for next non-whitespace token after newline
    // We peek back: last token was newline → emit indent spaces
    const last = tokens[tokens.length - 1];
    if (last && last.type === 'indent' && last.value === '\n') {
      // compute current indent depth based on upcoming char
      let depth = indent;
      if (ch === '}' || ch === ']') depth = Math.max(0, indent - 1);
      pushIndent(depth);
    }

    // Brackets
    if (ch === '{' || ch === '[') {
      tokens.push({ type: 'bracket', value: ch });
      indent += 1;
      inKey = ch === '{';
      i += 1;
      continue;
    }
    if (ch === '}' || ch === ']') {
      indent = Math.max(0, indent - 1);
      // if last token was newline indent, re-adjust it
      const prev = tokens[tokens.length - 1];
      const prevPrev = tokens[tokens.length - 2];
      if (prev && prev.type === 'indent' && prev.value !== '\n' &&
          prevPrev && prevPrev.type === 'indent' && prevPrev.value === '\n') {
        // adjust the indent we just emitted
        tokens[tokens.length - 1] = { type: 'indent', value: '  '.repeat(indent) };
      }
      tokens.push({ type: 'bracket', value: ch });
      inKey = false;
      i += 1;
      continue;
    }

    // Punctuation
    if (ch === ':') {
      tokens.push({ type: 'punctuation', value: ': ' });
      inKey = false;
      i += 1;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'punctuation', value: ',' });
      inKey = true; // after comma in object, next string is key
      i += 1;
      continue;
    }

    // String
    if (ch === '"') {
      let j = i + 1;
      let str = '';
      while (j < len) {
        const c = jsonStr[j];
        if (c === '\\') {
          str += c + (jsonStr[j + 1] ?? '');
          j += 2;
          continue;
        }
        if (c === '"') break;
        str += c;
        j += 1;
      }
      tokens.push({
        type: inKey ? 'key' : 'string',
        value: `"${str}"`,
      });
      i = j + 1;
      continue;
    }

    // Number
    if (/^-?\d/.test(ch)) {
      let j = i;
      let numStr = '';
      while (j < len && /^[0-9.eE+\-]$/.test(jsonStr[j])) {
        numStr += jsonStr[j];
        j += 1;
      }
      tokens.push({ type: 'number', value: numStr });
      i = j;
      continue;
    }

    // Boolean / null
    if (/^[tfn]/.test(ch)) {
      const rest = jsonStr.slice(i, i + 5);
      if (rest.startsWith('true')) {
        tokens.push({ type: 'boolean', value: 'true' });
        i += 4;
        continue;
      }
      if (rest.startsWith('false')) {
        tokens.push({ type: 'boolean', value: 'false' });
        i += 5;
        continue;
      }
      if (rest.startsWith('null')) {
        tokens.push({ type: 'null', value: 'null' });
        i += 4;
        continue;
      }
    }

    // Fallback: emit char as-is
    tokens.push({ type: 'punctuation', value: ch });
    i += 1;
  }

  return tokens;
}

export function formatJson(jsonStr: string): JSX.Element[] | string {
  let pretty: string;
  try {
    pretty = JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch {
    return jsonStr;
  }

  const tokens = tokenizeJson(pretty);

  const elements: JSX.Element[] = tokens.map((token, idx) => (
    <span key={idx} style={{ color: COLOR_MAP[token.type] }}>
      {token.value}
    </span>
  ));

  return elements;
}
