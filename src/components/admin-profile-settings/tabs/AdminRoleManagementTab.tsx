"use client";
import React, { useState } from "react";
import { LuPencil, LuPlus, LuShield, LuX } from "react-icons/lu";
import { useEffect } from "react";
import { authFetch, API_BASE_URL } from "@/lib/auth";

interface Role {
  id: string|null;
  name: string;
  displayName: string;
  users: number;
  permissions: number | {id: string; code: string}[];
  createdAt: string;
  color: string;
}

interface Permission {
  id: string;
  displayName:string;
  code: string;
  description: string;
}


const BADGE_COLORS = [
{ label: "Red",    value: "#EF4444" },
{ label: "Blue",   value: "#3B82F6" },
{ label: "Green",  value: "#22C55E" },
{ label: "Yellow", value: "#FACC15" },
{ label: "Purple", value: "#A855F7" },
{ label: "Pink",   value: "#EC4899" },
{ label: "Indigo", value: "#6366F1" },
{ label: "Orange", value: "#F97316" },

];

const initialRoles: Role[] = [
  { id: "admin", name: "admin", displayName: "Administrator", users: 2, permissions: 18, createdAt: "01/01/2024", color: "#EF4444" },
  { id: "registration_coordinator", name: "registration_coordinator", displayName: "Registration Coordinator", users: 5, permissions: 5, createdAt: "01/01/2024", color: "#3B82F6" },
  { id: "registration_support", name: "registration_support", displayName: "Registration Support", users: 8, permissions: 5, createdAt: "01/01/2024", color: "#22C55E" },
];

/* ─── Create Role Modal ─────────────────────────────────────────────────── */
const CreateRoleModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {

const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

useEffect(() => {
  const fetchPermissions = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/permissions`);
      const data = await res.json();
      setAllPermissions(data.permissions || []);
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
    }
  };
  fetchPermissions();
}, []);



  const [roleName, setRoleName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Helper to parse permission code into type and action
  const parsePermissionCode = (code: string) => {
    const upperCode = code?.toUpperCase() || '';
    const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
    for (const action of actions) {
      if (upperCode.endsWith(`_${action}`)) {
        return { type: upperCode.replace(`_${action}`, ''), action };
      }
    }
    return { type: '', action: '' };
  };

  // Helper to find permission ID by type and action
  const findPermissionId = (type: string, action: string) => {
    const targetCode = `${type}_${action}`;
    const perm = allPermissions.find((p) => p.code?.toUpperCase() === targetCode);
    return perm?.id;
  };

  // Check if a permission is selected by type and action
  const isPermissionSelected = (type: string, action: string) => {
    const permId = findPermissionId(type, action);
    return permId ? selectedPermissions.includes(permId) : false;
  };

  // Check if a permission should be disabled based on dependencies
  const isPermissionDisabled = (perm: Permission) => {
    const { type, action } = parsePermissionCode(perm.code);
    if (!type || !action) return false;

    // READ is disabled if CREATE, UPDATE, or DELETE of same type is selected
    if (action === 'READ') {
      return isPermissionSelected(type, 'CREATE') ||
             isPermissionSelected(type, 'UPDATE') ||
             isPermissionSelected(type, 'DELETE');
    }
    // UPDATE is disabled if CREATE of same type is selected
    if (action === 'UPDATE') {
      return isPermissionSelected(type, 'CREATE');
    }
    // DELETE is disabled if CREATE of same type is selected
    if (action === 'DELETE') {
      return isPermissionSelected(type, 'CREATE');
    }
    return false;
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) => {
      const isRemoving = prev.includes(id);
      
      // Find the permission being toggled
      const permission = allPermissions.find((p) => p.id === id);
      if (!permission) return isRemoving ? prev.filter((p) => p !== id) : [...prev, id];

      const { type: permType, action: permAction } = parsePermissionCode(permission.code);
      
      // If we couldn't parse the code, just toggle the single permission
      if (!permType || !permAction) {
        return isRemoving ? prev.filter((p) => p !== id) : [...prev, id];
      }

      if (isRemoving) {
        // When unchecking CREATE, also uncheck UPDATE, DELETE, and READ (if no other dependency)
        if (permAction === 'CREATE') {
          const readId = findPermissionId(permType, 'READ');
          const updateId = findPermissionId(permType, 'UPDATE');
          const deleteId = findPermissionId(permType, 'DELETE');
          return prev.filter((p) => p !== id && p !== readId && p !== updateId && p !== deleteId);
        }
        // When unchecking UPDATE, also uncheck READ if DELETE is not selected
        if (permAction === 'UPDATE') {
          const readId = findPermissionId(permType, 'READ');
          const deleteSelected = isPermissionSelected(permType, 'DELETE');
          if (!deleteSelected && readId) {
            return prev.filter((p) => p !== id && p !== readId);
          }
          return prev.filter((p) => p !== id);
        }
        // When unchecking DELETE, also uncheck READ if UPDATE is not selected
        if (permAction === 'DELETE') {
          const readId = findPermissionId(permType, 'READ');
          const updateSelected = isPermissionSelected(permType, 'UPDATE');
          if (!updateSelected && readId) {
            return prev.filter((p) => p !== id && p !== readId);
          }
          return prev.filter((p) => p !== id);
        }
        return prev.filter((p) => p !== id);
      }

      // Adding permission
      const newSelections = [id];

      // If CREATE is selected, also select READ, UPDATE, DELETE
      if (permAction === 'CREATE') {
        const readId = findPermissionId(permType, 'READ');
        const updateId = findPermissionId(permType, 'UPDATE');
        const deleteId = findPermissionId(permType, 'DELETE');
        if (readId && !prev.includes(readId)) newSelections.push(readId);
        if (updateId && !prev.includes(updateId)) newSelections.push(updateId);
        if (deleteId && !prev.includes(deleteId)) newSelections.push(deleteId);
      }
      // If UPDATE is selected, also select READ
      else if (permAction === 'UPDATE') {
        const readId = findPermissionId(permType, 'READ');
        if (readId && !prev.includes(readId)) newSelections.push(readId);
      }
      // If DELETE is selected, also select READ
      else if (permAction === 'DELETE') {
        const readId = findPermissionId(permType, 'READ');
        if (readId && !prev.includes(readId)) newSelections.push(readId);
      }

      return [...prev, ...newSelections];
    });
  };

  const handleCreate = async () => {

  if (!roleName.trim()) return;

 

  const body = {
    name: roleName.trim(),
    displayName: displayName.trim() || roleName.trim(),
    color: selectedColor,
    permissionIds: selectedPermissions.map(id => Number(id))
  };

  try {
      console.log('BODYb',body);
    const res = await authFetch(`${API_BASE_URL}/badges`, {
      method: "POST",
      body: JSON.stringify(body)
    });

    await res.json();

    // Re-fetch badges to get accurate data from the backend
    onCreated();
    onClose();

  } catch (err) {
    console.error("Create role failed:", err);
  }
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
                  style={{ backgroundColor: c.value }}
                  className={`h-8 w-8 rounded-full transition-all ${
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
              {allPermissions.map((perm) => {
                const disabled = isPermissionDisabled(perm);
                return (
                  <label
                    key={perm.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                      disabled
                        ? 'bg-gray-50 dark:bg-gray-800/30 cursor-not-allowed'
                        : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={() => !disabled && togglePermission(perm.id)}
                      disabled={disabled}
                      className={`mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 accent-brand-500 ${
                        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      }`}
                    />
                    <div className={disabled ? 'opacity-60' : ''}>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {perm.displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {perm.description}
                      </p>
                    </div>
                  </label>
                );
              })}
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
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    const fetchPermissionsData = async () => {
      try {
        // Fetch all available permissions
        const allPermsRes = await authFetch(`${API_BASE_URL}/permissions`);
        const allPermsData = await allPermsRes.json();
        const permissions = allPermsData.permissions || [];
        setAllPermissions(permissions);

        // Fetch badge's specific permissions
        if (role.id) {
          const badgePermsRes = await authFetch(`${API_BASE_URL}/badges/${role.id}/permissions`);
          const badgePermsData = await badgePermsRes.json();
          
          if (badgePermsData.success && badgePermsData.permissions) {
            // Get permission IDs for permissions that are true
            const selectedIds: string[] = [];
            const permissionsMap = badgePermsData.permissions as Record<string, boolean>;
            
            for (const [code, isSelected] of Object.entries(permissionsMap)) {
              if (isSelected) {
                const perm = permissions.find((p: Permission) => p.code?.toUpperCase() === code.toUpperCase());
                if (perm) {
                  selectedIds.push(perm.id);
                }
              }
            }
            setSelectedPermissions(selectedIds);
          }
        }
      } catch (err) {
        console.error("Failed to fetch permissions:", err);
      }
    };
    fetchPermissionsData();
  }, [role.id]);

  // Helper to parse permission code into type and action
  const parsePermissionCode = (code: string) => {
    const upperCode = code?.toUpperCase() || '';
    const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
    for (const action of actions) {
      if (upperCode.endsWith(`_${action}`)) {
        return { type: upperCode.replace(`_${action}`, ''), action };
      }
    }
    return { type: '', action: '' };
  };

  // Helper to find permission ID by type and action
  const findPermissionId = (type: string, action: string) => {
    const targetCode = `${type}_${action}`;
    const perm = allPermissions.find((p) => p.code?.toUpperCase() === targetCode);
    return perm?.id;
  };

  // Check if a permission is selected by type and action
  const isPermissionSelected = (type: string, action: string) => {
    const permId = findPermissionId(type, action);
    return permId ? selectedPermissions.includes(permId) : false;
  };

  // Check if a permission should be disabled based on dependencies
  const isPermissionDisabled = (perm: Permission) => {
    const { type, action } = parsePermissionCode(perm.code);
    if (!type || !action) return false;

    // READ is disabled if CREATE, UPDATE, or DELETE of same type is selected
    if (action === 'READ') {
      return isPermissionSelected(type, 'CREATE') ||
             isPermissionSelected(type, 'UPDATE') ||
             isPermissionSelected(type, 'DELETE');
    }
    // UPDATE is disabled if CREATE of same type is selected
    if (action === 'UPDATE') {
      return isPermissionSelected(type, 'CREATE');
    }
    // DELETE is disabled if CREATE of same type is selected
    if (action === 'DELETE') {
      return isPermissionSelected(type, 'CREATE');
    }
    return false;
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) => {
      const isRemoving = prev.includes(id);
      
      // Find the permission being toggled
      const permission = allPermissions.find((p) => p.id === id);
      if (!permission) return isRemoving ? prev.filter((p) => p !== id) : [...prev, id];

      const { type: permType, action: permAction } = parsePermissionCode(permission.code);
      
      // If we couldn't parse the code, just toggle the single permission
      if (!permType || !permAction) {
        return isRemoving ? prev.filter((p) => p !== id) : [...prev, id];
      }

      if (isRemoving) {
        // When unchecking CREATE, also uncheck UPDATE, DELETE, and READ (if no other dependency)
        if (permAction === 'CREATE') {
          const readId = findPermissionId(permType, 'READ');
          const updateId = findPermissionId(permType, 'UPDATE');
          const deleteId = findPermissionId(permType, 'DELETE');
          return prev.filter((p) => p !== id && p !== readId && p !== updateId && p !== deleteId);
        }
        // When unchecking UPDATE, also uncheck READ if DELETE is not selected
        if (permAction === 'UPDATE') {
          const readId = findPermissionId(permType, 'READ');
          const deleteSelected = isPermissionSelected(permType, 'DELETE');
          if (!deleteSelected && readId) {
            return prev.filter((p) => p !== id && p !== readId);
          }
          return prev.filter((p) => p !== id);
        }
        // When unchecking DELETE, also uncheck READ if UPDATE is not selected
        if (permAction === 'DELETE') {
          const readId = findPermissionId(permType, 'READ');
          const updateSelected = isPermissionSelected(permType, 'UPDATE');
          if (!updateSelected && readId) {
            return prev.filter((p) => p !== id && p !== readId);
          }
          return prev.filter((p) => p !== id);
        }
        return prev.filter((p) => p !== id);
      }

      // Adding permission
      const newSelections = [id];

      // If CREATE is selected, also select READ, UPDATE, DELETE
      if (permAction === 'CREATE') {
        const readId = findPermissionId(permType, 'READ');
        const updateId = findPermissionId(permType, 'UPDATE');
        const deleteId = findPermissionId(permType, 'DELETE');
        if (readId && !prev.includes(readId)) newSelections.push(readId);
        if (updateId && !prev.includes(updateId)) newSelections.push(updateId);
        if (deleteId && !prev.includes(deleteId)) newSelections.push(deleteId);
      }
      // If UPDATE is selected, also select READ
      else if (permAction === 'UPDATE') {
        const readId = findPermissionId(permType, 'READ');
        if (readId && !prev.includes(readId)) newSelections.push(readId);
      }
      // If DELETE is selected, also select READ
      else if (permAction === 'DELETE') {
        const readId = findPermissionId(permType, 'READ');
        if (readId && !prev.includes(readId)) newSelections.push(readId);
      }

      return [...prev, ...newSelections];
    });
  };

  const handleSave = async () => {
    try {
      const body = {
        displayName: displayName.trim() || role.displayName,
        color: selectedColor,
        permissionIds: selectedPermissions.map(id => Number(id))
      };

      const res = await authFetch(`${API_BASE_URL}/badges/${role.id}`, {
        method: "PATCH",
        body: JSON.stringify(body)
      });

      await res.json();

      onSave({
        ...role,
        displayName: displayName.trim() || role.displayName,
        color: selectedColor,
        permissions: selectedPermissions.length,
      });
      onClose();
    } catch (err) {
      console.error("Update role failed:", err);
    }
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
                  style={{ backgroundColor: c.value }}
                  className={`h-8 w-8 rounded-full transition-all ${
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
              {allPermissions.map((perm) => {
                const disabled = isPermissionDisabled(perm);
                return (
                  <label
                    key={perm.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                      disabled
                        ? 'bg-gray-50 dark:bg-gray-800/30 cursor-not-allowed'
                        : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={() => !disabled && togglePermission(perm.id)}
                      disabled={disabled}
                      className={`mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 accent-brand-500 ${
                        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      }`}
                    />
                    <div className={disabled ? 'opacity-60' : ''}>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {perm.code}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {perm.description}
                      </p>
                    </div>
                  </label>
                );
              })}
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
  const [roles, setRoles] = useState<Role[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

const fetchBadges = async () => {
    const res = await authFetch(`${API_BASE_URL}/badges`, {
      method: "GET"
    });
    const data = await res.json();
    setRoles(data.badges || []);
  };

  useEffect(() => {
    fetchBadges();
  }, []);


useEffect(()=>{
  console.log(roles);
},[roles])

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
              {roles?.map((role) => (
                <tr key={role.id}>
                  <td className="py-4">
                    <span style={{ backgroundColor: role.color }} className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white">
                      {role.name}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-gray-700 dark:text-gray-300" title={role.displayName ?? ""}>
                    {(role.displayName ?? "").length > 24 ? (role.displayName ?? "").slice(0, 24) + "…" : (role.displayName ?? "")}
                  </td>
                  <td className="py-4 text-sm text-gray-700 dark:text-gray-300">{role.users ?? 0} users</td>
                  <td className="py-4">
                    <span className="text-sm text-brand-500">{Array.isArray(role.permissions) ? role.permissions.length : role.permissions} permissions</span>
                  </td>
                  <td className="py-4 text-sm text-gray-700 dark:text-gray-300">{role.createdAt ? new Date(role.createdAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : ""}</td>
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
          onCreated={() => fetchBadges()}
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
