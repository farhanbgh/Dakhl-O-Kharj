"use client";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  isActive: boolean;
  roleId: number;
  roleName: string;
}

interface Role { id: number; name: string; displayName: string; }

const AVATARS = ["👤", "👨‍💼", "👩‍💼", "🧑‍💻", "👨‍🔧", "👩‍🔧", "🧑‍🏫", "👨‍💻", "🧑‍🎨", "👷"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", username: "", password: "", roleId: "", avatar: "👤", isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [usersRes, rolesRes] = await Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/roles").then((r) => r.json()),
    ]);
    setUsers(usersRes.users || []);
    setRoles(rolesRes.roles || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditId(null);
    setForm({ name: "", username: "", password: "", roleId: "", avatar: "👤", isActive: true });
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditId(u.id);
    setForm({ name: u.name, username: u.username, password: "",
      roleId: u.roleId?.toString() || "", avatar: u.avatar || "👤", isActive: u.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim()) { toast.error("نام و نام کاربری الزامی است"); return; }
    setSaving(true);
    try {
      const url = editId ? `/api/users/${editId}` : "/api/users";
      const method = editId ? "PUT" : "POST";
      const body: Record<string, unknown> = {
        name: form.name, username: form.username,
        roleId: form.roleId ? parseInt(form.roleId) : null,
        avatar: form.avatar, isActive: form.isActive,
      };
      if (!editId || form.password) body.password = form.password;
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editId ? "ویرایش شد" : "کاربر افزوده شد");
        setShowModal(false);
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا");
      }
    } catch { toast.error("خطا"); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف کاربر؟")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("حذف شد"); fetchData(); }
    else toast.error("خطا در حذف");
  };

  return (
    <div className="p-4 lg:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت کاربران</h1>
        <button onClick={openNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          ➕ کاربر جدید
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{u.avatar}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-500">
                      @{u.username} • {u.roleName || "بدون نقش"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.isActive ? "فعال" : "غیرفعال"}
                  </span>
                  <button onClick={() => openEdit(u)} className="text-green-600 text-xs px-2 py-1 rounded hover:bg-green-50">ویرایش</button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-500 text-xs px-2 py-1 rounded hover:bg-red-50">حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
              <h3 className="font-bold text-gray-800">{editId ? "ویرایش کاربر" : "کاربر جدید"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">آواتار</label>
                <div className="flex gap-2 flex-wrap">
                  {AVATARS.map((av) => (
                    <button key={av} onClick={() => setForm({ ...form, avatar: av })}
                      className={`text-2xl p-2 rounded-lg border-2 transition ${form.avatar === av ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                      {av}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام نمایشی <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام کاربری <span className="text-red-500">*</span></label>
                  <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رمز عبور {editId && <span className="text-xs text-gray-400">(خالی = بدون تغییر)</span>}
                  </label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نقش</label>
                  <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">بدون نقش</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.displayName}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded" />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">کاربر فعال</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60">
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button onClick={() => setShowModal(false)} className="px-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">انصراف</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
