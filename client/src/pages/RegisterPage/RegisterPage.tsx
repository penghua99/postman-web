import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useAuth } from '@/auth/auth-context';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const uname = username.trim();
    if (uname.length < 3) {
      setError('用户名长度至少 3 个字符');
      return;
    }
    if (!/^[a-zA-Z0-9_\-.\u4e00-\u9fa5]+$/.test(uname)) {
      setError('用户名只能包含字母、数字、下划线、连字符、点或中文');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('邮箱格式不正确');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        username: uname,
        password,
        displayName: displayName.trim() || undefined,
        email: email.trim() || undefined,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'h-9 w-full rounded border border-[#2d2d38] bg-[#1e1e24] px-3 text-sm text-[#f5f5f5] outline-none transition-colors focus:border-[#ff6c37]';
  const labelCls = 'mb-1 block text-xs text-[#c8c8d0]';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0c0e] p-4">
      <div className="w-full max-w-sm rounded-lg border border-[#2d2d38] bg-[#17171c] p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff6c37]">
            <Send size={22} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-[#f5f5f5]">创建账号</h1>
            <p className="mt-1 text-xs text-[#8a8a94]">每个用户的数据相互独立</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="username">
              用户名 *
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls}
              placeholder="3-64 位，字母/数字/下划线/中文"
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="password">
              密码 *
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="至少 6 位"
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="confirmPassword">
              确认密码 *
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
              placeholder="再次输入密码"
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="displayName">
              昵称（可选）
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputCls}
              placeholder="显示名称"
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="email">
              邮箱（可选）
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@example.com"
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
            {submitting ? '注册中...' : '注 册'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#8a8a94]">
          已有账号？{' '}
          <Link
            to="/login"
            className="text-[#ff6c37] transition-colors hover:text-[#ff8555]"
          >
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
