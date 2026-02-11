"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  LuSearch,
  LuUserPlus,
  LuPencil,
  LuTrash2,
  LuX,
  LuChevronDown,
  LuCheck,
} from "react-icons/lu";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Coordinator" | "Support";
  status: "Active" | "Inactive";
  lastActive: string;
  registrationsHandled: number;
}

const usersData: User[] = [
  { id: "USR-001", name: "Sarah Johnson", email: "sarah.j@company.com", role: "Coordinator", status: "Active", lastActive: "28/01/2026, 10:30:00", registrationsHandled: 45 },
  { id: "USR-002", name: "Michael Chen", email: "michael.c@company.com", role: "Coordinator", status: "Active", lastActive: "28/01/2026, 09:15:00", registrationsHandled: 38 },
  { id: "USR-003", name: "Emily Rodriguez", email: "emily.r@company.com", role: "Support", status: "Active", lastActive: "28/01/2026, 11:00:00", registrationsHandled: 0 },
  { id: "USR-004", name: "Admin User", email: "admin@company.com", role: "Admin", status: "Active", lastActive: "28/01/2026, 11:30:00", registrationsHandled: 120 },
];

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState({ name: "", email: "", role: "Coordinator" as User["role"], status: "Active" as User["status"] });
  const [users, setUsers] = useState<User[]>(usersData);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isAddRoleDropdownOpen, setIsAddRoleDropdownOpen] = useState(false);
  const [isAddStatusDropdownOpen, setIsAddStatusDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const addRoleDropdownRef = useRef<HTMLDivElement>(null);
  const addStatusDropdownRef = useRef<HTMLDivElement>(null);

  const getRoleColor = (role: User["role"]) => {
    switch (role) {
      case "Admin": return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
      case "Coordinator": return "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400";
      case "Support": return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
      default: return "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
    }
  };

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "Active": return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
      case "Inactive": return "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
      default: return "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
    }
  };

  const filteredData = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (user: User) => { setEditFormData({ ...user }); setIsEditModalOpen(true); };
  const handleCloseEditModal = () => { setIsEditModalOpen(false); setEditFormData(null); };
  const handleUpdateUser = () => { setIsEditModalOpen(false); setEditFormData(null); };
  const handleInputChange = (field: keyof User, value: string | number) => {
    if (editFormData) setEditFormData({ ...editFormData, [field]: value });
  };

  const handleAddUser = () => {
    const newUser: User = {
      id: `USR-${String(users.length + 1).padStart(3, "0")}`,
      name: newUserData.name,
      email: newUserData.email,
      role: newUserData.role,
      status: newUserData.status,
      lastActive: new Date().toLocaleString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
      registrationsHandled: 0,
    };
    setUsers([...users, newUser]);
    setIsAddModalOpen(false);
    setNewUserData({ name: "", email: "", role: "Coordinator", status: "Active" });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) setIsRoleDropdownOpen(false);
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) setIsStatusDropdownOpen(false);
      if (addRoleDropdownRef.current && !addRoleDropdownRef.current.contains(event.target as Node)) setIsAddRoleDropdownOpen(false);
      if (addStatusDropdownRef.current && !addStatusDropdownRef.current.contains(event.target as Node)) setIsAddStatusDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleOptions = [
    { value: "Admin", label: "Administrator" },
    { value: "Coordinator", label: "Registration Coordinator" },
    { value: "Support", label: "Registration Support" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage system users and their roles</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
          <LuUserPlus className="w-5 h-5" />
          Add User
        </button>
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

        <div className="max-w-[720px] lg:max-w-[700px] xl:max-w-full overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                {["ID", "Name", "Email", "Role", "Status", "Last Active", "Registrations Handled", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredData.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-sm font-medium text-gray-900 dark:text-white">{user.id}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getRoleColor(user.role)}`}>{user.role}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(user.status)}`}>{user.status}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-sm text-gray-600 dark:text-gray-400">{user.lastActive}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-sm font-medium text-gray-900 dark:text-white">{user.registrationsHandled}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditClick(user)} className="p-2 text-gray-600 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 transition-colors" title="Edit"><LuPencil className="w-5 h-5" /></button>
                      <button className="p-2 text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors" title="Delete"><LuTrash2 className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="p-12 text-center">
            <LuUserPlus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No users found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 dark:border dark:border-gray-600 rounded-xl shadow-theme-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New User</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Create a new user account and assign their role in the system.</p>
              </div>
              <button onClick={() => { setIsAddModalOpen(false); setNewUserData({ name: "", email: "", role: "Coordinator", status: "Active" }); }} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><LuX className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
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
              <div ref={addRoleDropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
                <button type="button" onClick={() => setIsAddRoleDropdownOpen(!isAddRoleDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all">
                  <span>{roleOptions.find((r) => r.value === newUserData.role)?.label}</span>
                  <LuChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isAddRoleDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isAddRoleDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-theme-lg overflow-hidden">
                    {roleOptions.map((option) => (
                      <button key={option.value} type="button" onClick={() => { setNewUserData({ ...newUserData, role: option.value as User["role"] }); setIsAddRoleDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${newUserData.role === option.value ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                        <span>{option.label}</span>
                        {newUserData.role === option.value && <LuCheck className="w-4 h-4 text-brand-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div ref={addStatusDropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                <button type="button" onClick={() => setIsAddStatusDropdownOpen(!isAddStatusDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all">
                  <span>{newUserData.status}</span>
                  <LuChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isAddStatusDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isAddStatusDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-theme-lg overflow-hidden">
                    {["Active", "Inactive"].map((option) => (
                      <button key={option} type="button" onClick={() => { setNewUserData({ ...newUserData, status: option as User["status"] }); setIsAddStatusDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${newUserData.status === option ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                        <span>{option}</span>
                        {newUserData.status === option && <LuCheck className="w-4 h-4 text-brand-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
              <button onClick={() => { setIsAddModalOpen(false); setNewUserData({ name: "", email: "", role: "Coordinator", status: "Active" }); }} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleAddUser} disabled={!newUserData.name || !newUserData.email} className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Add User</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 dark:border dark:border-gray-600 rounded-xl shadow-theme-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit User</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Update the user&apos;s details and role in the system.</p>
              </div>
              <button onClick={handleCloseEditModal} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><LuX className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <input type="text" value={editFormData.name} onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input type="email" value={editFormData.email} onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
              </div>
              <div ref={roleDropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
                <button type="button" onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all">
                  <span>{roleOptions.find((r) => r.value === editFormData.role)?.label ?? editFormData.role}</span>
                  <LuChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isRoleDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isRoleDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-theme-lg overflow-hidden">
                    {roleOptions.map((option) => (
                      <button key={option.value} type="button" onClick={() => { handleInputChange("role", option.value as User["role"]); setIsRoleDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${editFormData.role === option.value ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                        <span>{option.label}</span>
                        {editFormData.role === option.value && <LuCheck className="w-4 h-4 text-brand-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div ref={statusDropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                <button type="button" onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all">
                  <span>{editFormData.status}</span>
                  <LuChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isStatusDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-theme-lg overflow-hidden">
                    {["Active", "Inactive"].map((option) => (
                      <button key={option} type="button" onClick={() => { handleInputChange("status", option as User["status"]); setIsStatusDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${editFormData.status === option ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                        <span>{option}</span>
                        {editFormData.status === option && <LuCheck className="w-4 h-4 text-brand-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
              <button onClick={handleCloseEditModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleUpdateUser} className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">Update User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
