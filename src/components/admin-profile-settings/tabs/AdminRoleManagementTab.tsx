"use client";
import React, { useState } from "react";
import { LuPencil, LuPlus, LuShield, LuX } from "react-icons/lu";

interface Role {
  id: string;
  name: string;
  displayName: string;
  users: number;
  permissions: number;
  created: string;
  color: string;
}

interface Permission {
  id: string;
  label: string;
  description: string;
}

const ALL_PERMISSIONS: Permission[] = [
  { id: "view_dashboard", label: "View Dashboard", description: "Access to main dashboard and analytics" },
  { id: "view_registrations", label: "View Registrations", description: "View registration records" },
  { id: "edit_registrations", label: "Edit Registrations", description: "Create and modify registrations" },
  { id: "delete_registrations", label: "Delete Registrations", description: "Remove registration records" },
  { id: "view_users", label: "View Users", description: "View user accounts" },
  { id: "manage_users", label: "Manage Users", description: "Create, edit, and delete users" },
  { id: "view_payments", label: "View Payments", description: "View payment records" },
  { id: "process_payments", label: "Process Payments", description: "Handle payment transactions" },
  { id: "view_compliance", label: "View Compliance", description: "Access compliance monitoring" },
  { id: "manage_compliance", label: "Manage Compliance", description: "Update compliance settings" },
  { id: "view_reports", label: "View Reports", description: "Access analytics and reports" },
  { id: "export_reports", label: "Export Reports", description: "Download and export report data" },
  { id: "view_messages", label: "View Messages", description: "Read communication messages" },
  { id: "send_messages", label: "Send Messages", description: "Send and reply to messages" },
  { id: "manage_settings", label: "Manage Settings", description: "Modify system settings" },
  { id: "manage_roles", label: "Manage Roles", description: "Create and edit roles" },
  { id: "view_audit_log", label: "View Audit Log", description: "Access system audit logs" },
  { id: "manage_support", label: "Manage Support", description: "Handle support tickets" },
];

const BADGE_COLORS = [
  { label: "Red",    value: "bg-red-500" },
  { label: "Blue",   value: "bg-blue-500" },
  { label: "Green",  value: "bg-green-500" },
  { label: "Yellow", value: "bg-yellow-400" },
  { label: "Purple", value: "bg-purple-500" },
  { label: "Pink",   value: "bg-pink-500" },
  { label: "Indigo", value: "bg-indigo-500" },
  { label: "Orange", value: "bg-orange-500" },
];

const initialRoles: Role[] = [
  { id: "admin", name: "admin", displayName: "Administrator", users: 2, permissions: 18, created: "01/01/2024", color: "bg-red-500" },
  { id: "registration_coordinator", name: "registration_coordinator", displayName: "Registration Coordinator", users: 5, permissions: 5, created: "01/01/2024", color: "bg-blue-500" },
  { id: "registration_support", name: "registration_support", displayName: "Registration Support", users: 8, permissions: 5, created: "01/01/2024", color: "bg-green-500" },
];

/* ─── Create Role Modal ─────────────────────────────────────────────────── */
const CreateRoleModal: React.FC<{ onClose: () => void; onAdd: (role: Role) => void }> = ({ onClose, onAdd }) => {
  const [roleName, setRoleName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-blue-500");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!roleName.trim()) return;
    const today = new Date();
    const created = `${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}/${today.getFullYear()}`;
    onAdd({
      id: roleName.trim(),
      name: roleName.trim(),
      displayName: displayName.trim() || roleName.trim(),
      users: 0,
      permissions: selectedPermissions.length,
      created,
      color: selectedColor,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 dark:border-blue-500/30">
              <LuShield className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Create New Role
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Define a custom role with specific permissions for your team members.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Role Name + Display Name side-by-side */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Role Name (Internal)
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g., data_analyst"
                className="mt-2 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Data Analyst"
                className="mt-2 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Badge Color */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Badge Color
            </label>
            <div className="mt-3 flex flex-wrap gap-3">
              {BADGE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  title={c.label}
                  className={`h-8 w-8 rounded-full ${c.value} transition-all ${
                    selectedColor === c.value
                      ? "ring-2 ring-offset-1 ring-[#4560ff] dark:ring-offset-[#4560ff] scale-110"
                      : "hover:scale-105"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Permissions
            </label>
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              {ALL_PERMISSIONS.map((perm) => (
                <label
                  key={perm.id}
                  className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 accent-brand-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {perm.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {perm.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 dark:border-gray-800 p-6 pt-4">
          <button
            onClick={handleCreate}
            disabled={!roleName.trim()}
            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Role
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Edit Role Modal ───────────────────────────────────────────────────── */
const EditRoleModal: React.FC<{ role: Role; onClose: () => void; onSave: (updated: Role) => void }> = ({ role, onClose, onSave }) => {
  const [displayName, setDisplayName] = useState(role.displayName);
  const [selectedColor, setSelectedColor] = useState(role.color);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(() =>
    // seed with a dummy spread of the role's permission count so checkboxes reflect it
    ALL_PERMISSIONS.slice(0, role.permissions).map((p) => p.id)
  );

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave({
      ...role,
      displayName: displayName.trim() || role.displayName,
      color: selectedColor,
      permissions: selectedPermissions.length,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 dark:border-blue-500/30">
              <LuShield className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Edit Role
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Modify role details and permissions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Role Name (Internal)
              </label>
              <input
                type="text"
                defaultValue={role.name}
                disabled
                className="mt-2 h-11 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Badge Color */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Badge Color
            </label>
            <div className="mt-3 flex flex-wrap gap-3">
              {BADGE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  title={c.label}
                  className={`h-8 w-8 rounded-full ${c.value} transition-all ${
                    selectedColor === c.value
                      ? "ring-2 ring-offset-1 ring-[#4560ff] dark:ring-offset-[#4560ff] scale-110"
                      : "hover:scale-105"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Permissions
            </label>
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              {ALL_PERMISSIONS.map((perm) => (
                <label
                  key={perm.id}
                  className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 accent-brand-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {perm.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {perm.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 dark:border-gray-800 p-6 pt-4">
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Tab ──────────────────────────────────────────────────────────── */
const AdminRoleManagementTab: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Custom Roles
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create and manage custom roles with specific permissions
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <LuPlus className="h-4 w-4" />
            Create Role
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Role Name</th>
                <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Display Name</th>
                <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Users</th>
                <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Permissions</th>
                <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Created</th>
                <th className="pb-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className="py-4">
                    <span className={`inline-flex items-center rounded-full ${role.color} px-2.5 py-1 text-xs font-medium text-white`}>
                      {role.name}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-gray-700 dark:text-gray-300" title={role.displayName}>
                    {role.displayName.length > 24 ? role.displayName.slice(0, 24) + "…" : role.displayName}
                  </td>
                  <td className="py-4 text-sm text-gray-700 dark:text-gray-300">{role.users} users</td>
                  <td className="py-4">
                    <span className="text-sm text-brand-500">{role.permissions} permissions</span>
                  </td>
                  <td className="py-4 text-sm text-gray-700 dark:text-gray-300">{role.created}</td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => setEditingRole(role)}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                    >
                      <LuPencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onAdd={(role) => setRoles((prev) => [...prev, role])}
        />
      )}

      {editingRole && (
        <EditRoleModal
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSave={(updated) => {
            setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setEditingRole(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminRoleManagementTab;
