import React, { useState, useEffect } from 'react';
import { api, RoleItem, PermissionItem } from '../services/api';
import {
  ShieldCheck,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Users,
  CheckSquare,
  Square,
  Lock,
} from 'lucide-react';

const ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT'];

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, PermissionItem[]>>({});
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [activeRolePermissions, setActiveRolePermissions] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Role Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permRes] = await Promise.all([api.getRoles(), api.getPermissions()]);
      if (rolesRes.success) {
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0) {
          setSelectedRoleId(rolesRes.data[0].id);
        }
      }
      if (permRes.success) {
        setPermissions(permRes.data.permissions);
        setGroupedPermissions(permRes.data.grouped);
      }
    } catch (err) {
      console.error('Failed to load RBAC data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const res = await api.getRolePermissions(roleId);
      if (res.success) {
        setActiveRolePermissions(new Set(res.data.permissionIds));
      }
    } catch (err) {
      console.error('Failed to load role permissions:', err);
    }
  };

  const handleTogglePermission = (permId: string) => {
    const next = new Set(activeRolePermissions);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setActiveRolePermissions(next);
  };

  const handleToggleModuleAll = (moduleName: string) => {
    const modulePerms = groupedPermissions[moduleName] || [];
    const modulePermIds = modulePerms.map((p) => p.id);
    const allChecked = modulePermIds.every((id) => activeRolePermissions.has(id));

    const next = new Set(activeRolePermissions);
    if (allChecked) {
      modulePermIds.forEach((id) => next.delete(id));
    } else {
      modulePermIds.forEach((id) => next.add(id));
    }
    setActiveRolePermissions(next);
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      const permissionIds = Array.from(activeRolePermissions);
      const res = await api.updateRolePermissions(selectedRoleId, permissionIds);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: res.message });
        // Refresh roles list to update permission count badge
        const rolesRes = await api.getRoles();
        if (rolesRes.success) setRoles(rolesRes.data);
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to save permissions',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      const res = await api.createRole({ name: newRoleName, description: newRoleDesc });
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'New role created successfully!' });
        setIsCreateOpen(false);
        setNewRoleName('');
        setNewRoleDesc('');
        const rolesRes = await api.getRoles();
        if (rolesRes.success) setRoles(rolesRes.data);
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to create role',
      });
    }
  };

  const activeRole = roles.find((r) => r.id === selectedRoleId);
  const isSuperAdmin = activeRole?.name === 'Super Admin';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={24} /> Roles & Permission Matrix
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure system roles and grant granular module-level capabilities across the application.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition"
        >
          <Plus size={18} /> Create Custom Role
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-500 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Roles Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((r) => {
          const isSelected = r.id === selectedRoleId;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedRoleId(r.id)}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-brand-50/80 border-brand-300 ring-2 ring-brand-500/20 shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold text-sm ${isSelected ? 'text-brand-900' : 'text-slate-900'}`}>{r.name}</span>
                  {r.name === 'Super Admin' && <Lock size={14} className="text-amber-500" />}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{r.description || 'System security role'}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                  <Users size={12} className="text-slate-400" /> {r.userCount} users
                </span>
                <span className="font-semibold text-brand-700 bg-brand-100/60 px-2 py-0.5 rounded">
                  {r.name === 'Super Admin' ? 'ALL' : `${r.permissionCount} perms`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Permission Matrix Section */}
      {activeRole && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Permission Matrix for <span className="text-brand-700">{activeRole.name}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isSuperAdmin
                  ? 'Super Admin automatically possesses all system permissions.'
                  : 'Check or uncheck capability permissions and click Save Changes below.'}
              </p>
            </div>

            {!isSuperAdmin && (
              <button
                onClick={handleSavePermissions}
                disabled={isSaving}
                className="bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-md shadow-brand-600/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5 w-64">Module</th>
                  {ACTIONS.map((action) => (
                    <th key={action} className="px-4 py-3.5 text-center w-28">
                      {action}
                    </th>
                  ))}
                  <th className="px-4 py-3.5 text-right w-28">Select All</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      <Loader2 size={24} className="animate-spin inline-block mb-2" />
                      <p>Loading permission matrix...</p>
                    </td>
                  </tr>
                ) : (
                  Object.keys(groupedPermissions).map((moduleName) => {
                    const modulePerms = groupedPermissions[moduleName] || [];
                    const permByAction: Record<string, PermissionItem> = {};
                    modulePerms.forEach((p) => (permByAction[p.action] = p));

                    const allModulePermIds = modulePerms.map((p) => p.id);
                    const isAllModuleChecked =
                      isSuperAdmin || allModulePermIds.every((id) => activeRolePermissions.has(id));

                    return (
                      <tr key={moduleName} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-3.5 font-bold text-slate-800 capitalize flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                          {moduleName.replace('_', ' ')}
                        </td>

                        {ACTIONS.map((action) => {
                          const perm = permByAction[action];
                          if (!perm) {
                            return <td key={action} className="px-4 py-3.5 text-center text-slate-300">—</td>;
                          }
                          const isChecked = isSuperAdmin || activeRolePermissions.has(perm.id);

                          return (
                            <td key={action} className="px-4 py-3.5 text-center">
                              <button
                                disabled={isSuperAdmin}
                                onClick={() => handleTogglePermission(perm.id)}
                                className={`p-1 rounded-md transition ${
                                  isSuperAdmin ? 'cursor-not-allowed opacity-75' : 'hover:bg-slate-100'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckSquare size={18} className="text-brand-600" />
                                ) : (
                                  <Square size={18} className="text-slate-300" />
                                )}
                              </button>
                            </td>
                          );
                        })}

                        <td className="px-4 py-3.5 text-right">
                          <button
                            disabled={isSuperAdmin}
                            onClick={() => handleToggleModuleAll(moduleName)}
                            className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-40"
                          >
                            {isAllModuleChecked ? 'Clear' : 'All'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE ROLE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create Custom Security Role</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Regional Sales Manager"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Access permissions for regional sales team members"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
