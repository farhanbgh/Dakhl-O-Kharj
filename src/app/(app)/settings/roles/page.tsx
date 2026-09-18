"use client";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { ALL_PERMISSIONS, Permission } from "@/lib/utils";

interface Role {
  id: number;
  name: string;
  displayName: string;
  permissions: Record<string, boolean>;
  isSystem: boolean;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", displayName: "", permissions: {} as Record<string, boolean> });
  const [saving, setSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/roles");
    const data = await res.json();
    setRoles(data.roles || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const openNew = () => {
    setEditId(null);
    setForm({ name: "", displayName: "", permissions: {} });
    setShowModal(true);
  };

  const openEdit = (r: Role) => {
    setEditId(r.id);
    setForm({ name: r.name, displayName: r.displayName, permissions: r.permissions || {} });
    setShowModal(true);
  };

  const togglePermission = (key: Permission) => {
    setForm((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  const toggleGroup = (group: string, enable: boolean) => {
    const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group);
    const newPerms = { ...form.permissions };
    for (const p of groupPerms) newPerms[p.key] = enable;
    setForm((prev) => ({ ...prev, permissions: newPerms }));
  };

  const handleSave = async () => {
    if (!form.displayName.trim()) { toast.error("نام نقش الزامی است"); return; }
    if (!editId && !form.name.trim()) { toast.error("کد نقش الزامی است"); return; }
    setSaving(true);
    try {
      const method = editId ? "PUT" : "POST";
      const body = editId
        ? { id: editId, displayName: form.displayName, permissions: form.permissions }
        : { name: form.name, displayName: form.displayName, permissions: form.permissions };
      const res = await fetch("/api/roles", {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editId ? "ویرایش شد" : "نقش افزوده شد");
        setShowModal(false);
        fetchRoles();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا");
      }
    } catch { toast.error("خطا"); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف نقش؟")) return;
    const res = await fetch(`/api/roles?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("حذف شد"); fetchRoles(); }
    else {
      const d = await res.json();
      toast.error(d.error || "خطا در حذف");
    }
  };

  const permissionGroups = [...new Set(ALL_PERMISSIONS.map((p) => p.group))];

  return (
    <div className="p-4 lg:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">نقش‌ها و دسترسی‌ها</h1>
        <button onClick={openNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          ➕ نقش جدید
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          roles.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">{r.displayName}</h3>
                  <p className="text-xs text-gray-400 font-mono">{r.name}</p>
                </div>
                {r.isSystem && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">سیستمی</span>}
              </div>
              <div className="text-xs text-gray-500 mb-3">
                {Object.values(r.permissions || {}).filter(Boolean).length} دسترسی فعال
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(r)}
                  className="flex-1 text-center bg-green-50 text-green-700 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition">
                  ✏️ ویرایش دسترسی‌ها
                </button>
                {!r.isSystem && (
                  <button onClick={() => handleDelete(r.id)}
                    className="text-red-500 px-3 py-1.5 rounded-lg text-xs hover:bg-red-50">
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">{editId ? "ویرایش نقش" : "نقش جدید"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {!editId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">کد نقش (انگلیسی) <span className="text-red-500">*</span></label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="مثال: manager"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                )}
                <div className={!editId ? "" : "col-span-2"}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام نقش <span className="text-red-500">*</span></label>
                  <input type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    placeholder="مثال: مدیر"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              {/* Permissions by group */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">دسترسی‌ها</h4>
                <div className="space-y-3">
                  {permissionGroups.map((group) => {
                    const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group);
                    const allEnabled = groupPerms.every((p) => form.permissions[p.key]);
                    return (
                      <div key={group} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-700 text-sm">{group}</h5>
                          <button onClick={() => toggleGroup(group, !allEnabled)}
                            className={`text-xs px-2 py-0.5 rounded-full ${allEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {allEnabled ? "غیرفعال کردن همه" : "فعال کردن همه"}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {groupPerms.map((p) => (
                            <label key={p.key} className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={!!form.permissions[p.key]}
                                onChange={() => togglePermission(p.key as Permission)}
                                className="w-3.5 h-3.5 rounded" />
                              <span className="text-xs text-gray-600">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60">
                {saving ? "در حال ذخیره..." : "ذخیره"}
              </button>
              <button onClick={() => setShowModal(false)} className="px-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
