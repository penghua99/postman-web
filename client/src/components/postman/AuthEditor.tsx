import { useState } from 'react';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import type { AuthType, AuthConfig } from '@shared/api.interface';

interface AuthEditorProps {
  authType: AuthType;
  auth: AuthConfig;
  onTypeChange: (type: AuthType) => void;
  onAuthChange: (auth: AuthConfig) => void;
}

const AUTH_TYPES: { key: AuthType; label: string }[] = [
  { key: 'none', label: 'No Auth' },
  { key: 'bearer', label: 'Bearer Token' },
  { key: 'basic', label: 'Basic Auth' },
  { key: 'apikey', label: 'API Key' },
];

const AuthEditor: React.FC<AuthEditorProps> = ({
  authType,
  auth,
  onTypeChange,
  onAuthChange,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleTypeSelect = (type: AuthType) => {
    onTypeChange(type);
    setDropdownOpen(false);
  };

  const currentLabel =
    AUTH_TYPES.find((t) => t.key === authType)?.label ?? 'No Auth';

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-pm-fg-secondary">Type:</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 h-8 px-3 bg-pm-bg-dark border border-pm-border text-pm-fg-primary text-sm rounded hover:border-pm-orange focus:outline-none"
          >
            {currentLabel}
            <ChevronDown size={14} className="text-pm-fg-muted" />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-pm-bg-dark border border-pm-border rounded shadow-lg z-50">
              {AUTH_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleTypeSelect(t.key)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-pm-bg-light text-pm-fg-primary ${
                    authType === t.key ? 'bg-pm-bg-light' : ''
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {authType === 'none' && (
        <div className="text-sm text-pm-fg-muted py-4">
          该请求不需要授权。
        </div>
      )}

      {authType === 'bearer' && (
        <div className="space-y-3 max-w-lg">
          <div>
            <label className="block text-xs text-pm-fg-secondary mb-1">
              Token
            </label>
            <PasswordInput
              value={auth.bearerToken ?? ''}
              onChange={(value) =>
                onAuthChange({ ...auth, bearerToken: value })
              }
              placeholder="Enter bearer token"
            />
          </div>
        </div>
      )}

      {authType === 'basic' && (
        <div className="space-y-3 max-w-lg">
          <div>
            <label className="block text-xs text-pm-fg-secondary mb-1">
              Username
            </label>
            <input
              type="text"
              value={auth.username ?? ''}
              onChange={(e) =>
                onAuthChange({ ...auth, username: e.target.value })
              }
              placeholder="Enter username"
              className="w-full h-8 px-3 bg-pm-bg-dark border border-pm-border text-pm-fg-primary text-sm rounded focus:border-pm-orange focus:outline-none placeholder:text-pm-fg-muted"
            />
          </div>
          <div>
            <label className="block text-xs text-pm-fg-secondary mb-1">
              Password
            </label>
            <PasswordInput
              value={auth.password ?? ''}
              onChange={(value) =>
                onAuthChange({ ...auth, password: value })
              }
              placeholder="Enter password"
            />
          </div>
        </div>
      )}

      {authType === 'apikey' && (
        <div className="space-y-3 max-w-lg">
          <div>
            <label className="block text-xs text-pm-fg-secondary mb-1">
              Key
            </label>
            <input
              type="text"
              value={auth.apiKeyName ?? ''}
              onChange={(e) =>
                onAuthChange({ ...auth, apiKeyName: e.target.value })
              }
              placeholder="Enter key name"
              className="w-full h-8 px-3 bg-pm-bg-dark border border-pm-border text-pm-fg-primary text-sm rounded focus:border-pm-orange focus:outline-none placeholder:text-pm-fg-muted"
            />
          </div>
          <div>
            <label className="block text-xs text-pm-fg-secondary mb-1">
              Value
            </label>
            <PasswordInput
              value={auth.apiKey ?? ''}
              onChange={(value) => onAuthChange({ ...auth, apiKey: value })}
              placeholder="Enter API key value"
            />
          </div>
          <div>
            <label className="block text-xs text-pm-fg-secondary mb-1">
              Add to
            </label>
            <select
              value={auth.apiKeyIn ?? 'header'}
              onChange={(e) =>
                onAuthChange({
                  ...auth,
                  apiKeyIn: e.target.value as 'header' | 'query',
                })
              }
              className="w-full h-8 px-3 bg-pm-bg-dark border border-pm-border text-pm-fg-primary text-sm rounded focus:border-pm-orange focus:outline-none"
            >
              <option value="header">Header</option>
              <option value="query">Query Params</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 px-3 pr-9 bg-pm-bg-dark border border-pm-border text-pm-fg-primary text-sm rounded focus:border-pm-orange focus:outline-none placeholder:text-pm-fg-muted"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-pm-fg-muted hover:text-pm-fg-primary"
        aria-label="Toggle visibility"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

export default AuthEditor;
