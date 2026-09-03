import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  Users as UsersIcon,
  KeyRound,
  Pencil,
} from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import {
  adminUsersApi,
  adminRolesApi,
  adminPermissionsApi,
} from '@/api';
import type {
  AdminUserItem,
  AdminRoleItem,
  AdminPermissionItem,
} from '@shared/api.interface';

function extractError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string | string[] } } })
      .response;
    const msg = res?.data?.message;
    if (Array.isArray(msg)) return msg.join('，');
    if (msg) return msg;
  }
  return err instanceof Error ? err.message : '操作失败，请稍后重试';
}

// ── 通用小组件 ──────────────────────────────────────────────────

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    onClick={onClose}
  >
    <div
      className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[#2d2d38] bg-[#17171c] p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="mb-4 text-base font-semibold text-[#f5f5f5]">{title}</h3>
      {children}
    </div>
  </div>
);

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  required?: boolean;
}> = ({ label, children, required }) => (
  <div className="mb-3">
    <label className="mb-1 block text-xs text-[#c8c8d0]">
      {label}
      {required && <span className="ml-0.5 text-[#ff6c37]">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  'h-9 w-full rounded border border-[#2d2d38] bg-[#1e1e24] px-3 text-sm text-[#f5f5f5] outline-none transition-colors focus:border-[#ff6c37]';
const btnPrimary =
  'inline-flex h-8 items-center gap-1.5 rounded bg-[#ff6c37] px-3 text-xs font-medium text-white transition-colors hover:bg-[#ff8555] disabled:cursor-not-allowed disabled:opacity-60';
const btnGhost =
  'inline-flex h-8 items-center gap-1.5 rounded border border-[#2d2d38] bg-transparent px-3 text-xs text-[#c8c8d0] transition-colors hover:border-[#3a3a46] hover:text-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-60';
const btnDanger =
  'inline-flex h-8 items-center gap-1.5 rounded border border-[#ef4444]/40 bg-transparent px-3 text-xs text-[#ef4444] transition-colors hover:bg-[#ef4444]/10 disabled:cursor-not-allowed disabled:opacity-60';

const tableCls = 'w-full text-left text-xs';
const thCls =
  'border-b border-[#2d2d38] px-3 py-2.5 font-medium text-[#8a8a94]';
const tdCls = 'border-b border-[#2d2d38]/60 px-3 py-2.5 text-[#c8c8d0]';

function statusBadge(status: string) {
  return status === 'active' ? (
    <span className="rounded bg-[#22c55e]/15 px-2 py-0.5 text-[11px] text-[#22c55e]">
      正常
    </span>
  ) : (
    <span className="rounded bg-[#ef4444]/15 px-2 py-0.5 text-[11px] text-[#ef4444]">
      禁用
    </span>
  );
}

// ── 用户管理 Tab ────────────────────────────────────────────────

interface UserFormState {
  username: string;
  password: string;
  displayName: string;
  email: string;
  status: 'active' | 'disabled';
  roleIds: string[];
}

const emptyUserForm: UserFormState = {
  username: '',
  password: '',
  displayName: '',
  email: '',
  status: 'active',
  roleIds: [],
};

const UsersTab: React.FC = () => {
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [roles, setRoles] = useState<AdminRoleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminUserItem | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyUserForm);
  const [resetTarget, setResetTarget] = useState<AdminUserItem | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminUsersApi.list({
        page,
        pageSize,
        keyword: keyword.trim() || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    adminRolesApi.list().then(setRoles).catch(() => undefined);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyUserForm);
    setShowModal(true);
  };

  const openEdit = (item: AdminUserItem) => {
    setEditing(item);
    setForm({
      username: item.username,
      password: '',
      displayName: item.displayName ?? '',
      email: item.email ?? '',
      status: item.status,
      roleIds: item.roles.map((r) => r.id),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editing) {
        await adminUsersApi.update(editing.id, {
          displayName: form.displayName || undefined,
          email: form.email || undefined,
          status: form.status,
          roleIds: form.roleIds,
        });
      } else {
        await adminUsersApi.create({
          username: form.username,
          password: form.password,
          displayName: form.displayName || undefined,
          email: form.email || undefined,
          status: form.status,
          roleIds: form.roleIds,
        });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(extractError(err));
    }
  };

  const handleRemove = async (item: AdminUserItem) => {
    if (!window.confirm(`确定删除用户「${item.username}」？其所有数据将一并删除。`)) return;
    try {
      await adminUsersApi.remove(item.id);
      load();
    } catch (err) {
      window.alert(extractError(err));
    }
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    try {
      await adminUsersApi.resetPassword(resetTarget.id, resetPassword);
      setResetTarget(null);
      setResetPassword('');
    } catch (err) {
      window.alert(extractError(err));
    }
  };

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a94]" />
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            className={`${inputCls} pl-9`}
            placeholder="搜索用户名 / 昵称 / 邮箱"
          />
        </div>
        <button type="button" className={btnPrimary} onClick={openCreate}>
          <Plus size={14} /> 新建用户
        </button>
        <button type="button" className={btnGhost} onClick={load}>
          <RefreshCw size={14} /> 刷新
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded border border-[#2d2d38]">
        <table className={tableCls}>
          <thead>
            <tr>
              <th className={thCls}>用户名</th>
              <th className={thCls}>昵称</th>
              <th className={thCls}>邮箱</th>
              <th className={thCls}>角色</th>
              <th className={thCls}>状态</th>
              <th className={thCls}>创建时间</th>
              <th className={`${thCls} text-right`}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className={`${tdCls} py-8 text-center text-[#8a8a94]`}>
                  加载中...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className={`${tdCls} py-8 text-center text-[#8a8a94]`}>
                  暂无用户
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-[#1e1e24]">
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      <span className="text-[#f5f5f5]">{item.username}</span>
                      {item.isSuperAdmin && (
                        <span className="rounded bg-[#ff6c37]/15 px-1.5 py-0.5 text-[10px] text-[#ff6c37]">
                          超管
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={tdCls}>{item.displayName ?? '-'}</td>
                  <td className={tdCls}>{item.email ?? '-'}</td>
                  <td className={tdCls}>
                    <div className="flex flex-wrap gap-1">
                      {item.roles.length === 0 ? (
                        <span className="text-[#8a8a94]">-</span>
                      ) : (
                        item.roles.map((r) => (
                          <span
                            key={r.id}
                            className="rounded bg-[#3b82f6]/15 px-1.5 py-0.5 text-[10px] text-[#3b82f6]"
                          >
                            {r.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className={tdCls}>{statusBadge(item.status)}</td>
                  <td className={tdCls}>
                    {new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}
                  </td>
                  <td className={`${tdCls} text-right`}>
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        title="编辑"
                        className="rounded p-1 text-[#8a8a94] transition-colors hover:bg-[#2d2d38] hover:text-[#f5f5f5]"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        title="重置密码"
                        className="rounded p-1 text-[#8a8a94] transition-colors hover:bg-[#2d2d38] hover:text-[#f5b40e]"
                        onClick={() => {
                          setResetTarget(item);
                          setResetPassword('');
                        }}
                      >
                        <KeyRound size={14} />
                      </button>
                      {!item.isSuperAdmin && (
                        <button
                          type="button"
                          title="删除"
                          className="rounded p-1 text-[#8a8a94] transition-colors hover:bg-[#2d2d38] hover:text-[#ef4444]"
                          onClick={() => handleRemove(item)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="mt-3 flex items-center justify-between text-xs text-[#8a8a94]">
        <span>
          共 {total} 个用户，第 {page}/{totalPages} 页
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={btnGhost}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </button>
          <button
            type="button"
            className={btnGhost}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </button>
        </div>
      </div>

      {/* 创建/编辑弹窗 */}
      {showModal && (
        <Modal
          title={editing ? `编辑用户：${editing.username}` : '新建用户'}
          onClose={() => setShowModal(false)}
        >
          <Field label="用户名" required>
            <input
              className={inputCls}
              value={form.username}
              disabled={Boolean(editing)}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="3-64 位"
            />
          </Field>
          {!editing && (
            <Field label="初始密码" required>
              <input
                type="password"
                className={inputCls}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="至少 6 位"
              />
            </Field>
          )}
          <Field label="昵称">
            <input
              className={inputCls}
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </Field>
          <Field label="邮箱">
            <input
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="状态">
            <select
              className={inputCls}
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as 'active' | 'disabled' })
              }
            >
              <option value="active">正常</option>
              <option value="disabled">禁用</option>
            </select>
          </Field>
          <Field label="分配角色">
            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded border border-[#2d2d38] bg-[#1e1e24] p-2">
              {roles.length === 0 ? (
                <div className="text-xs text-[#8a8a94]">暂无角色</div>
              ) : (
                roles.map((r) => (
                  <label
                    key={r.id}
                    className="flex cursor-pointer items-center gap-2 text-xs text-[#c8c8d0]"
                  >
                    <input
                      type="checkbox"
                      checked={form.roleIds.includes(r.id)}
                      onChange={(e) => {
                        const roleIds = e.target.checked
                          ? [...form.roleIds, r.id]
                          : form.roleIds.filter((id) => id !== r.id);
                        setForm({ ...form, roleIds });
                      }}
                      className="accent-[#ff6c37]"
                    />
                    <span>
                      {r.name}
                      <span className="ml-1 text-[10px] text-[#8a8a94]">({r.code})</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </Field>

          {error && (
            <div className="mb-3 rounded border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">
              {error}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setShowModal(false)}>
              取消
            </button>
            <button type="button" className={btnPrimary} onClick={handleSave}>
              <Save size={14} /> 保存
            </button>
          </div>
        </Modal>
      )}

      {/* 重置密码弹窗 */}
      {resetTarget && (
        <Modal title={`重置密码：${resetTarget.username}`} onClose={() => setResetTarget(null)}>
          <Field label="新密码" required>
            <input
              type="password"
              className={inputCls}
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="至少 6 位"
            />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setResetTarget(null)}>
              取消
            </button>
            <button type="button" className={btnPrimary} onClick={handleReset}>
              <Lock size={14} /> 确认重置
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── 角色管理 Tab ────────────────────────────────────────────────

interface RoleFormState {
  name: string;
  code: string;
  description: string;
  permissionIds: string[];
}

const emptyRoleForm: RoleFormState = {
  name: '',
  code: '',
  description: '',
  permissionIds: [],
};

const RolesTab: React.FC = () => {
  const [items, setItems] = useState<AdminRoleItem[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminRoleItem | null>(null);
  const [form, setForm] = useState<RoleFormState>(emptyRoleForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await adminRolesApi.list());
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    adminPermissionsApi.list().then(setPermissions).catch(() => undefined);
  }, [load]);

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, AdminPermissionItem[]>();
    for (const p of permissions) {
      const key = p.group ?? '其他';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return Array.from(groups.entries());
  }, [permissions]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyRoleForm);
    setShowModal(true);
  };

  const openEdit = (item: AdminRoleItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      code: item.code,
      description: item.description ?? '',
      permissionIds: item.permissionIds,
    });
    setShowModal(true);
  };

  const togglePermission = (id: string) => {
    setForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter((x) => x !== id)
        : [...prev.permissionIds, id],
    }));
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editing) {
        await adminRolesApi.update(editing.id, {
          name: form.name,
          description: form.description || undefined,
          permissionIds: form.permissionIds,
        });
      } else {
        await adminRolesApi.create({
          name: form.name,
          code: form.code,
          description: form.description || undefined,
          permissionIds: form.permissionIds,
        });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(extractError(err));
    }
  };

  const handleRemove = async (item: AdminRoleItem) => {
    if (item.isBuiltin) return;
    if (!window.confirm(`确定删除角色「${item.name}」？`)) return;
    try {
      await adminRolesApi.remove(item.id);
      load();
    } catch (err) {
      window.alert(extractError(err));
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" className={btnPrimary} onClick={openCreate}>
          <Plus size={14} /> 新建角色
        </button>
        <button type="button" className={btnGhost} onClick={load}>
          <RefreshCw size={14} /> 刷新
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded border border-[#2d2d38]">
        <table className={tableCls}>
          <thead>
            <tr>
              <th className={thCls}>角色名称</th>
              <th className={thCls}>编码</th>
              <th className={thCls}>描述</th>
              <th className={thCls}>权限数</th>
              <th className={thCls}>类型</th>
              <th className={`${thCls} text-right`}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className={`${tdCls} py-8 text-center text-[#8a8a94]`}>
                  加载中...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className={`${tdCls} py-8 text-center text-[#8a8a94]`}>
                  暂无角色
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-[#1e1e24]">
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-[#3b82f6]" />
                      <span className="text-[#f5f5f5]">{item.name}</span>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <code className="rounded bg-[#1e1e24] px-1.5 py-0.5 text-[11px] text-[#ffb86c]">
                      {item.code}
                    </code>
                  </td>
                  <td className={`${tdCls} max-w-[240px] truncate`}>
                    {item.description ?? '-'}
                  </td>
                  <td className={tdCls}>{item.permissionIds.length}</td>
                  <td className={tdCls}>
                    {item.isBuiltin ? (
                      <span className="rounded bg-[#f59e0b]/15 px-2 py-0.5 text-[11px] text-[#f59e0b]">
                        内置
                      </span>
                    ) : (
                      <span className="rounded bg-[#3b82f6]/15 px-2 py-0.5 text-[11px] text-[#3b82f6]">
                        自定义
                      </span>
                    )}
                  </td>
                  <td className={`${tdCls} text-right`}>
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        title="编辑"
                        className="rounded p-1 text-[#8a8a94] transition-colors hover:bg-[#2d2d38] hover:text-[#f5f5f5]"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil size={14} />
                      </button>
                      {!item.isBuiltin && (
                        <button
                          type="button"
                          title="删除"
                          className="rounded p-1 text-[#8a8a94] transition-colors hover:bg-[#2d2d38] hover:text-[#ef4444]"
                          onClick={() => handleRemove(item)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal
          title={editing ? `编辑角色：${editing.name}` : '新建角色'}
          onClose={() => setShowModal(false)}
        >
          <Field label="角色名称" required>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="角色编码" required>
            <input
              className={inputCls}
              value={form.code}
              disabled={Boolean(editing)}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="小写字母/数字/下划线，如 editor"
            />
          </Field>
          <Field label="描述">
            <textarea
              className={`${inputCls} h-20 resize-none py-2`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="权限">
            <div className="max-h-52 space-y-3 overflow-y-auto rounded border border-[#2d2d38] bg-[#1e1e24] p-3">
              {groupedPermissions.length === 0 ? (
                <div className="text-xs text-[#8a8a94]">暂无权限项</div>
              ) : (
                groupedPermissions.map(([group, list]) => (
                  <div key={group}>
                    <div className="mb-1.5 text-[11px] font-medium text-[#8a8a94]">
                      {group}
                    </div>
                    <div className="space-y-1.5 pl-1">
                      {list.map((p) => (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-2 text-xs text-[#c8c8d0]"
                        >
                          <input
                            type="checkbox"
                            checked={form.permissionIds.includes(p.id)}
                            onChange={() => togglePermission(p.id)}
                            className="accent-[#ff6c37]"
                          />
                          <span>
                            {p.name}
                            <span className="ml-1 text-[10px] text-[#8a8a94]">
                              ({p.code})
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Field>

          {error && (
            <div className="mb-3 rounded border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">
              {error}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setShowModal(false)}>
              取消
            </button>
            <button type="button" className={btnPrimary} onClick={handleSave}>
              <Save size={14} /> 保存
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── 权限管理 Tab ────────────────────────────────────────────────

interface PermissionFormState {
  name: string;
  code: string;
  description: string;
  group: string;
}

const emptyPermissionForm: PermissionFormState = {
  name: '',
  code: '',
  description: '',
  group: '',
};

const PermissionsTab: React.FC = () => {
  const [items, setItems] = useState<AdminPermissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminPermissionItem | null>(null);
  const [form, setForm] = useState<PermissionFormState>(emptyPermissionForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await adminPermissionsApi.list());
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPermissionForm);
    setShowModal(true);
  };

  const openEdit = (item: AdminPermissionItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      code: item.code,
      description: item.description ?? '',
      group: item.group ?? '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editing) {
        await adminPermissionsApi.update(editing.id, {
          name: form.name,
          description: form.description || undefined,
          group: form.group || undefined,
        });
      } else {
        await adminPermissionsApi.create({
          name: form.name,
          code: form.code,
          description: form.description || undefined,
          group: form.group || undefined,
        });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(extractError(err));
    }
  };

  const handleRemove = async (item: AdminPermissionItem) => {
    if (!window.confirm(`确定删除权限「${item.name}」？`)) return;
    try {
      await adminPermissionsApi.remove(item.id);
      load();
    } catch (err) {
      window.alert(extractError(err));
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" className={btnPrimary} onClick={openCreate}>
          <Plus size={14} /> 新建权限
        </button>
        <button type="button" className={btnGhost} onClick={load}>
          <RefreshCw size={14} /> 刷新
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded border border-[#2d2d38]">
        <table className={tableCls}>
          <thead>
            <tr>
              <th className={thCls}>权限名称</th>
              <th className={thCls}>编码</th>
              <th className={thCls}>分组</th>
              <th className={thCls}>描述</th>
              <th className={`${thCls} text-right`}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={5} className={`${tdCls} py-8 text-center text-[#8a8a94]`}>
                  加载中...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className={`${tdCls} py-8 text-center text-[#8a8a94]`}>
                  暂无权限
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-[#1e1e24]">
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      <KeyRound size={14} className="text-[#f59e0b]" />
                      <span className="text-[#f5f5f5]">{item.name}</span>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <code className="rounded bg-[#1e1e24] px-1.5 py-0.5 text-[11px] text-[#ffb86c]">
                      {item.code}
                    </code>
                  </td>
                  <td className={tdCls}>{item.group ?? '-'}</td>
                  <td className={`${tdCls} max-w-[260px] truncate`}>
                    {item.description ?? '-'}
                  </td>
                  <td className={`${tdCls} text-right`}>
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        title="编辑"
                        className="rounded p-1 text-[#8a8a94] transition-colors hover:bg-[#2d2d38] hover:text-[#f5f5f5]"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        title="删除"
                        className="rounded p-1 text-[#8a8a94] transition-colors hover:bg-[#2d2d38] hover:text-[#ef4444]"
                        onClick={() => handleRemove(item)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal
          title={editing ? `编辑权限：${editing.name}` : '新建权限'}
          onClose={() => setShowModal(false)}
        >
          <Field label="权限名称" required>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="权限编码" required>
            <input
              className={inputCls}
              value={form.code}
              disabled={Boolean(editing)}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="如 postman:collection.read"
            />
          </Field>
          <Field label="分组">
            <input
              className={inputCls}
              value={form.group}
              onChange={(e) => setForm({ ...form, group: e.target.value })}
              placeholder="如 Postman / 管理端"
            />
          </Field>
          <Field label="描述">
            <textarea
              className={`${inputCls} h-20 resize-none py-2`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          {error && (
            <div className="mb-3 rounded border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">
              {error}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setShowModal(false)}>
              取消
            </button>
            <button type="button" className={btnPrimary} onClick={handleSave}>
              <Save size={14} /> 保存
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── 管理端主页面 ────────────────────────────────────────────────

type TabKey = 'users' | 'roles' | 'permissions';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'users', label: '用户管理', icon: <UsersIcon size={14} /> },
  { key: 'roles', label: '角色管理', icon: <Shield size={14} /> },
  { key: 'permissions', label: '权限管理', icon: <KeyRound size={14} /> },
];

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState<TabKey>('users');

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0c0c0e] text-[#c8c8d0]">
        <p className="mb-4 text-sm">你无权访问管理端</p>
        <button type="button" className={btnPrimary} onClick={() => navigate('/')}>
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0c0c0e]">
      {/* 顶栏 */}
      <header className="flex h-12 items-center justify-between border-b border-[#2d2d38] bg-[#17171c] px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded px-2 text-xs text-[#8a8a94] transition-colors hover:bg-[#1e1e24] hover:text-[#f5f5f5]"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={14} /> 返回工作台
          </button>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#ff6c37]" />
            <span className="text-sm font-semibold text-[#f5f5f5]">管理端</span>
          </div>
        </div>
        <div className="text-xs text-[#8a8a94]">
          当前用户：<span className="text-[#f5f5f5]">{user?.username}</span>
        </div>
      </header>

      {/* Tab 导航 */}
      <div className="flex border-b border-[#2d2d38] bg-[#17171c] px-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-medium transition-colors ${
              tab === t.key
                ? 'border-[#ff6c37] text-[#ff6c37]'
                : 'border-transparent text-[#8a8a94] hover:text-[#f5f5f5]'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <main className="flex-1 p-5">
        {tab === 'users' && <UsersTab />}
        {tab === 'roles' && <RolesTab />}
        {tab === 'permissions' && <PermissionsTab />}
      </main>
    </div>
  );
};

export default AdminPage;
