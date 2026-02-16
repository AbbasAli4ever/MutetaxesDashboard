"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  LuSearch,
  LuUserPlus,
  LuPencil,
  LuTrash2,
  LuX,
  LuChevronDown,
  LuCheck,
  LuLoader,
  LuTriangleAlert,
} from "react-icons/lu";
import {
  ModulePermissionProvider,
  useModulePermission,
} from "@/context/PermissionContext";
import PageAccessGuard from "@/components/common/PageAccessGuard";
import { authFetch } from "@/lib/auth";

const API_BASE = "http://localhost:3000";

// ─── API shapes ──────────────────────────────────────────────────────────────

interface UserListItem {
  id: number;
  name: string;
  email: string;
  active: "active" | "inactive";
  role: string; // badge displayName(s), comma-joined
  lastActive: string | null; // ISO 8601 or null
}

interface Badge {
  id: number;
  name: string;
  displayName: string;
  color: string;
}

// ─── Permission-aware sub-components ─────────────────────────────────────────

function UserActionsCell({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { can } = useModulePermission();
  const canUpdate = can("UPDATE");
  const canDelete = can("DELETE");

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={canUpdate ? onEdit : undefined}
        disabled={!canUpdate}
        className="p-2 text-gray-600 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-600 dark:disabled:hover:text-gray-400"
        title="Edit"
      >
        <LuPencil className="w-5 h-5" />
      </button>
      <button
        onClick={canDelete ? onDelete : undefined}
        disabled={!canDelete}
        className="p-2 text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-600 dark:disabled:hover:text-gray-400"
        title="Delete"
      >
        <LuTrash2 className="w-5 h-5" />
      </button>
    </div>
  );
}

function AddUserButton({ onClick }: { onClick: () => void }) {
  const { can } = useModulePermission();
  const canCreate = can("CREATE");

  return (
    <button
      onClick={canCreate ? onClick : undefined}
      disabled={!canCreate}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-500"
    >
      <LuUserPlus className="w-5 h-5" />
      Add User
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: "", email: "", password: "", badgeId: 0 });
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [isAddBadgeDropdownOpen, setIsAddBadgeDropdownOpen] = useState(false);
  const addBadgeDropdownRef = useRef<HTMLDivElement>(null);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", password: "", badgeId: 0, active: true });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditBadgeDropdownOpen, setIsEditBadgeDropdownOpen] = useState(false);
  const [isEditStatusDropdownOpen, setIsEditStatusDropdownOpen] = useState(false);
  const editBadgeDropdownRef = useRef<HTMLDivElement>(null);
  const editStatusDropdownRef = useRef<HTMLDivElement>(null);

  // Delete confirm
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  // ── Fetch users ──
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE}/users`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to fetch users");
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Fetch badges (for role dropdowns) ──
  const fetchBadges = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/badges`);
      if (!res.ok) return; // silently skip if no permission
      const data = await res.json();
      setBadges(data.badges || []);
    } catch {
      // badge list is optional — role dropdown degrades gracefully
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchBadges();
  }, [fetchUsers, fetchBadges]);

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addBadgeDropdownRef.current && !addBadgeDropdownRef.current.contains(e.target as Node)) setIsAddBadgeDropdownOpen(false);
      if (editBadgeDropdownRef.current && !editBadgeDropdownRef.current.contains(e.target as Node)) setIsEditBadgeDropdownOpen(false);
      if (editStatusDropdownRef.current && !editStatusDropdownRef.current.contains(e.target as Node)) setIsEditStatusDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Helpers ──
  const getStatusColor = (active: "active" | "inactive") =>
    active === "active"
      ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
      : "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";

  const filteredData = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(u.id).includes(searchTerm)
  );

  // ── Add user ──
  const handleAddUser = async () => {
    setIsAddSubmitting(true);
    setAddError(null);
    try {
      const res = await authFetch(`${API_BASE}/users`, {
        method: "POST",
        body: JSON.stringify({
          name: newUserData.name,
          email: newUserData.email,
          password: newUserData.password,
          badgeId: newUserData.badgeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      setIsAddModalOpen(false);
      setNewUserData({ name: "", email: "", password: "", badgeId: 0 });
      await fetchUsers();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsAddSubmitting(false);
    }
  };

  // ── Edit user ──
  const handleEditClick = (user: UserListItem) => {
    setEditUser(user);
    const badgeMatch = badges.find((b) => b.displayName === user.role || user.role.includes(b.displayName));
    setEditFormData({
      name: user.name,
      email: user.email,
      password: "",
      badgeId: badgeMatch?.id ?? 0,
      active: user.active === "active",
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    setIsEditSubmitting(true);
    setEditError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (editFormData.name !== editUser.name) payload.name = editFormData.name;
      if (editFormData.email !== editUser.email) payload.email = editFormData.email;
      if (editFormData.password.trim()) payload.password = editFormData.password;
      if (editFormData.badgeId > 0) payload.badgeId = editFormData.badgeId;
      payload.active = editFormData.active;

      const res = await authFetch(`${API_BASE}/users/${editUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      setIsEditModalOpen(false);
      setEditUser(null);
      await fetchUsers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // ── Delete user ──
  const handleDeleteConfirm = async () => {
    if (deleteUserId === null) return;
    setIsDeleteSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE}/users/${deleteUserId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      setDeleteUserId(null);
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  // ── Render ──
  return (
    <PageAccessGuard module="USER_MANAGEMENT">
    <ModulePermissionProvider module="USER_MANAGEMENT">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage system users and their roles</p>
        </div>
        <AddUserButton onClick={() => { setAddError(null); setIsAddModalOpen(true); }} />
      </div>

      <div className="relative max-w-[720px] lg:max-w-[680px] xl:max-w-full rounded-xl bg-white dark:bg-gray-900 shadow-theme-sm border border-gray-200 dark:border-gray-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="relative max-w-md">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="p-12 flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
            <LuLoader className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading users...</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="p-8 flex items-center justify-center gap-3 text-red-500">
            <LuTriangleAlert className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <div className="max-w-[720px] lg:max-w-[700px] xl:max-w-full overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  {["ID", "Name", "Email", "Role", "Status", "Last Active", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredData.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap"><span className="text-sm font-medium text-gray-900 dark:text-white">#{user.id}</span></td>
                    <td className="px-4 py-4 whitespace-nowrap"><span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span></td>
                    <td className="px-4 py-4 whitespace-nowrap"><span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span></td>
                    <td className="px-4 py-4 whitespace-nowrap"><span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">{user.role}</span></td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(user.active)}`}>
                        {user.active === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {user.lastActive ? (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(user.lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-600 italic">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <UserActionsCell onEdit={() => handleEditClick(user)} onDelete={() => setDeleteUserId(user.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && filteredData.length === 0 && (
          <div className="p-12 text-center">
            <LuUserPlus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No users found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* ── Add User Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 dark:border dark:border-gray-600 rounded-xl shadow-theme-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New User</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Create a new user account and assign their role.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><LuX className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {addError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-xs text-red-600 dark:text-red-400">
                  <LuTriangleAlert className="w-4 h-4 flex-shrink-0" />{addError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <input type="text" placeholder="John Doe" value={newUserData.name} onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input type="email" placeholder="john.doe@email.com" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <input type="password" placeholder="••••••••" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
              </div>
              <div ref={addBadgeDropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role (Badge)</label>
                <button type="button" onClick={() => setIsAddBadgeDropdownOpen(!isAddBadgeDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all">
                  <span>{badges.find((b) => b.id === newUserData.badgeId)?.displayName ?? "Select a role..."}</span>
                  <LuChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isAddBadgeDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isAddBadgeDropdownOpen && badges.length > 0 && (
                  <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-theme-lg overflow-hidden max-h-48 overflow-y-auto">
                    {badges.map((badge) => (
                      <button key={badge.id} type="button" onClick={() => { setNewUserData({ ...newUserData, badgeId: badge.id }); setIsAddBadgeDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${newUserData.badgeId === badge.id ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: badge.color }} />
                          <span>{badge.displayName}</span>
                        </div>
                        {newUserData.badgeId === badge.id && <LuCheck className="w-4 h-4 text-brand-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleAddUser} disabled={isAddSubmitting || !newUserData.name || !newUserData.email || !newUserData.password || newUserData.badgeId === 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isAddSubmitting && <LuLoader className="w-4 h-4 animate-spin" />}
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {isEditModalOpen && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 dark:border dark:border-gray-600 rounded-xl shadow-theme-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit User</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Update the user&apos;s details and role.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><LuX className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {editError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-xs text-red-600 dark:text-red-400">
                  <LuTriangleAlert className="w-4 h-4 flex-shrink-0" />{editError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  New Password <span className="text-xs text-gray-400 font-normal">(leave blank to keep current)</span>
                </label>
                <input type="password" placeholder="••••••••" value={editFormData.password} onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
              </div>
              <div ref={editBadgeDropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role (Badge)</label>
                <button type="button" onClick={() => setIsEditBadgeDropdownOpen(!isEditBadgeDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all">
                  <span>{badges.find((b) => b.id === editFormData.badgeId)?.displayName ?? editUser.role}</span>
                  <LuChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isEditBadgeDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isEditBadgeDropdownOpen && badges.length > 0 && (
                  <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-theme-lg overflow-hidden max-h-48 overflow-y-auto">
                    {badges.map((badge) => (
                      <button key={badge.id} type="button" onClick={() => { setEditFormData({ ...editFormData, badgeId: badge.id }); setIsEditBadgeDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${editFormData.badgeId === badge.id ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: badge.color }} />
                          <span>{badge.displayName}</span>
                        </div>
                        {editFormData.badgeId === badge.id && <LuCheck className="w-4 h-4 text-brand-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div ref={editStatusDropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                <button type="button" onClick={() => setIsEditStatusDropdownOpen(!isEditStatusDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all">
                  <span>{editFormData.active ? "Active" : "Inactive"}</span>
                  <LuChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isEditStatusDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isEditStatusDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-theme-lg overflow-hidden">
                    {[{ label: "Active", value: true }, { label: "Inactive", value: false }].map((opt) => (
                      <button key={opt.label} type="button" onClick={() => { setEditFormData({ ...editFormData, active: opt.value }); setIsEditStatusDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${editFormData.active === opt.value ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                        <span>{opt.label}</span>
                        {editFormData.active === opt.value && <LuCheck className="w-4 h-4 text-brand-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleUpdateUser} disabled={isEditSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isEditSubmitting && <LuLoader className="w-4 h-4 animate-spin" />}
                Update User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteUserId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 dark:border dark:border-gray-600 rounded-xl shadow-theme-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete User</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to permanently delete this user? This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteUserId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={isDeleteSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isDeleteSubmitting && <LuLoader className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ModulePermissionProvider>
    </PageAccessGuard>
  );
}
