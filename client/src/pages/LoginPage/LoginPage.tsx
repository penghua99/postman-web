import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useAuth } from '@/auth/auth-context';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: string } | null)?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('请输入用户名和密码');
      return;
    }
    setSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0c0e] p-4">
      <div className="w-full max-w-sm rounded-lg border border-[#2d2d38] bg-[#17171c] p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff6c37]">
            <Send size={22} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-[#f5f5f5]">API Tester</h1>
            <p className="mt-1 text-xs text-[#8a8a94]">登录后继续使用</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-[#c8c8d0]" htmlFor="username">
              用户名
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-9 w-full rounded border border-[#2d2d38] bg-[#1e1e24] px-3 text-sm text-[#f5f5f5] outline-none transition-colors focus:border-[#ff6c37]"
              placeholder="请输入用户名"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#c8c8d0]" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 w-full rounded border border-[#2d2d38] bg-[#1e1e24] px-3 text-sm text-[#f5f5f5] outline-none transition-colors focus:border-[#ff6c37]"
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <div className="rounded border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="h-9 w-full rounded bg-[#ff6c37] text-sm font-medium text-white transition-colors hover:bg-[#ff8555] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? '登录中...' : '登 录'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#8a8a94]">
          还没有账号？{' '}
          <Link
            to="/register"
            className="text-[#ff6c37] transition-colors hover:text-[#ff8555]"
          >
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
