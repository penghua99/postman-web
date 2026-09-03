import { useState } from 'react';
import type { RequestBody } from '@shared/api.interface';
import { KeyValueTable, FormDataTable } from './BodyTables';

type BodyMode = 'none' | 'raw' | 'formdata' | 'urlencoded';
type RawMode = 'json' | 'text';

interface BodyEditorProps {
  body: RequestBody;
  onChange: (body: RequestBody) => void;
}

const MODES: { key: BodyMode; label: string }[] = [
  { key: 'none', label: 'none' },
  { key: 'raw', label: 'raw' },
  { key: 'formdata', label: 'form-data' },
  { key: 'urlencoded', label: 'x-www-form-urlencoded' },
];

const RAW_MODES: { key: RawMode; label: string }[] = [
  { key: 'json', label: 'JSON' },
  { key: 'text', label: 'Text' },
];

const BodyEditor: React.FC<BodyEditorProps> = ({ body, onChange }) => {
  const getMode = (): BodyMode => {
    if (body.mode === 'none') return 'none';
    if (body.mode === 'raw' || body.mode === 'json' || body.mode === 'xml')
      return 'raw';
    if (body.mode === 'formdata') return 'formdata';
    if (body.mode === 'urlencoded') return 'urlencoded';
    return 'none';
  };

  const getRawMode = (): RawMode => {
    if (body.mode === 'json') return 'json';
    return 'text';
  };

  const [mode, setMode] = useState<BodyMode>(getMode());
  const [rawMode, setRawMode] = useState<RawMode>(getRawMode());

  const rawToBodyMode = (rm: RawMode): 'json' | 'raw' =>
    rm === 'json' ? 'json' : 'raw';

  const handleModeChange = (newMode: BodyMode) => {
    setMode(newMode);
    if (newMode === 'none') {
      onChange({ mode: 'none' });
    } else if (newMode === 'raw') {
      onChange({ mode: rawToBodyMode(rawMode), raw: body.raw ?? '' });
    } else if (newMode === 'formdata') {
      onChange({ mode: 'formdata', formdata: body.formdata ?? [] });
    } else if (newMode === 'urlencoded') {
      onChange({ mode: 'urlencoded', urlencoded: body.urlencoded ?? [] });
    }
  };

  const handleRawModeChange = (newRawMode: RawMode) => {
    setRawMode(newRawMode);
    onChange({ mode: rawToBodyMode(newRawMode), raw: body.raw ?? '' });
  };

  const handleRawChange = (value: string) => {
    onChange({ mode: rawToBodyMode(rawMode), raw: value });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-4 px-3 py-2 border-b border-pm-border bg-pm-bg-dark">
        {MODES.map((m) => (
          <label
            key={m.key}
            className="flex items-center gap-1.5 text-sm text-pm-fg-secondary cursor-pointer hover:text-pm-fg-primary"
          >
            <input
              type="radio"
              name="body-mode"
              checked={mode === m.key}
              onChange={() => handleModeChange(m.key)}
              className="accent-pm-orange"
            />
            {m.label}
          </label>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {mode === 'none' && (
          <div className="flex items-center justify-center h-full text-pm-fg-muted text-sm">
            This request does not have a body.
          </div>
        )}

        {mode === 'raw' && (
          <div className="flex flex-col h-full">
            <div className="flex gap-2 px-3 py-2 border-b border-pm-border bg-pm-bg-dark">
              {RAW_MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => handleRawModeChange(m.key)}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                    rawMode === m.key
                      ? 'bg-pm-orange text-white border-pm-orange'
                      : 'bg-transparent text-pm-fg-secondary border-pm-border hover:border-pm-orange hover:text-pm-fg-primary'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <textarea
              value={body.raw ?? ''}
              onChange={(e) => handleRawChange(e.target.value)}
              className="flex-1 w-full p-3 bg-pm-bg-mid text-pm-fg-primary font-mono text-sm resize-none focus:outline-none"
              placeholder={
                rawMode === 'json'
                  ? '{\n  "key": "value"\n}'
                  : 'Enter raw body text...'
              }
              spellCheck={false}
            />
          </div>
        )}

        {mode === 'formdata' && (
          <FormDataTable
            items={body.formdata ?? []}
            onChange={(items) =>
              onChange({ mode: 'formdata', formdata: items })
            }
          />
        )}

        {mode === 'urlencoded' && (
          <KeyValueTable
            items={body.urlencoded ?? []}
            onChange={(items) =>
              onChange({ mode: 'urlencoded', urlencoded: items })
            }
          />
        )}
      </div>
    </div>
  );
};

export default BodyEditor;
