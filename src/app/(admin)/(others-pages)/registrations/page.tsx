"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  LuFileText,
  LuEye,
  LuPencil,
  LuDownload,
  LuPlus,
  LuSearch,
  LuChevronDown,
  LuCheck,
  LuX,
} from "react-icons/lu";

interface Document {
  name: string;
  url: string;
}

interface Registration {
  id: string;
  clientName: string;
  clientEmail: string;
  phone: string;
  type: string;
  status: "pending" | "in-progress" | "completed";
  assignedTo: string;
  submittedDate: string;
  lastUpdated: string;
  documents: number;
  documentList: Document[];
}

const registrationsData: Registration[] = [
  {
    id: "REG-001",
    clientName: "John Doe",
    clientEmail: "john.doe@example.com",
    phone: "+1-555-0001",
    type: "Business Registration",
    status: "pending",
    assignedTo: "Sarah Johnson",
    submittedDate: "2026-01-25",
    lastUpdated: "2026-01-27",
    documents: 3,
    documentList: [
      { name: "Document 1.pdf", url: "#" },
      { name: "Document 2.pdf", url: "#" },
      { name: "Document 3.pdf", url: "#" },
    ],
  },
  {
    id: "REG-002",
    clientName: "Jane Smith",
    clientEmail: "jane.smith@example.com",
    phone: "+1-555-0002",
    type: "LLC Formation",
    status: "in-progress",
    assignedTo: "Michael Chen",
    submittedDate: "2026-01-20",
    lastUpdated: "2026-01-26",
    documents: 5,
    documentList: [
      { name: "Articles of Organization.pdf", url: "#" },
      { name: "Operating Agreement.pdf", url: "#" },
      { name: "EIN Application.pdf", url: "#" },
      { name: "Business License.pdf", url: "#" },
      { name: "Tax Forms.pdf", url: "#" },
    ],
  },
  {
    id: "REG-003",
    clientName: "Tech Innovations Inc",
    clientEmail: "contact@techinnovations.com",
    phone: "+1-555-0003",
    type: "Corporation Setup",
    status: "completed",
    assignedTo: "Sarah Johnson",
    submittedDate: "2026-01-15",
    lastUpdated: "2026-01-22",
    documents: 8,
    documentList: [
      { name: "Articles of Incorporation.pdf", url: "#" },
      { name: "Bylaws.pdf", url: "#" },
      { name: "Stock Certificates.pdf", url: "#" },
      { name: "Board Resolutions.pdf", url: "#" },
      { name: "EIN Confirmation.pdf", url: "#" },
      { name: "S-Corp Election.pdf", url: "#" },
      { name: "Shareholder Agreement.pdf", url: "#" },
      { name: "Initial Report.pdf", url: "#" },
    ],
  },
  {
    id: "REG-004",
    clientName: "Green Solutions",
    clientEmail: "info@greensolutions.com",
    phone: "+1-555-0004",
    type: "Non-Profit Registration",
    status: "completed",
    assignedTo: "Michael Chen",
    submittedDate: "2026-01-10",
    lastUpdated: "2026-01-18",
    documents: 4,
    documentList: [
      { name: "501(c)(3) Application.pdf", url: "#" },
      { name: "Mission Statement.pdf", url: "#" },
      { name: "Board Member List.pdf", url: "#" },
      { name: "Financial Projections.pdf", url: "#" },
    ],
  },
];

const statusOptions = [
  { value: "All Status", label: "All Status", color: "gray" },
  { value: "Pending", label: "Pending", color: "orange" },
  { value: "In Progress", label: "In Progress", color: "brand" },
  { value: "Completed", label: "Completed", color: "success" },
];

export default function Registrations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [editFormData, setEditFormData] = useState<Registration | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusColor = (status: Registration["status"]) => {
    switch (status) {
      case "completed": return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
      case "pending": return "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";
      case "in-progress": return "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400";
      default: return "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
    }
  };

  const formatStatus = (status: string) =>
    status.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  const filteredData = registrationsData.filter((reg) => {
    const matchesSearch =
      reg.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "All Status" || formatStatus(reg.status) === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (registration: Registration) => { setSelectedRegistration(registration); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedRegistration(null); };
  const handleEditClick = (registration: Registration) => { setEditFormData({ ...registration }); setIsEditModalOpen(true); };
  const handleCloseEditModal = () => { setIsEditModalOpen(false); setEditFormData(null); };
  const handleSaveChanges = () => { setIsEditModalOpen(false); setEditFormData(null); };
  const handleInputChange = (field: keyof Registration, value: string | number) => {
    if (editFormData) setEditFormData({ ...editFormData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registrations</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage all registration cases</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
          <LuPlus className="w-5 h-5" />
          Register a New Company
        </button>
      </div>

      <div className="relative max-w-[720px] lg:max-w-[680px] xl:max-w-full rounded-xl bg-white dark:bg-gray-900 shadow-theme-sm border border-gray-200 dark:border-gray-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between gap-3 pl-4 pr-3 py-2.5 min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                >
                  <span>{selectedStatus}</span>
                  <LuChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-theme-lg overflow-hidden">
                    <div className="py-1">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { setSelectedStatus(option.value); setIsDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
                            selectedStatus === option.value
                              ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <span>{option.label}</span>
                          {selectedStatus === option.value && <LuCheck className="w-4 h-4 text-brand-500 dark:text-brand-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors">
                <LuDownload className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[720px] lg:max-w-[700px] xl:max-w-full overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                {["ID", "Client Name", "Type", "Status", "Assigned To", "Submitted Date", "Documents", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredData.map((registration) => (
                <tr key={registration.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-sm font-medium text-gray-900 dark:text-white">{registration.id}</span></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{registration.clientName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{registration.clientEmail}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-sm text-gray-600 dark:text-gray-400">{registration.type}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(registration.status)}`}>
                      {formatStatus(registration.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-sm text-gray-600 dark:text-gray-400">{registration.assignedTo}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap"><span className="text-sm text-gray-600 dark:text-gray-400">{registration.submittedDate}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <LuFileText className="w-4 h-4" /><span>{registration.documents}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleViewDetails(registration)} className="p-2 text-gray-600 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 transition-colors" title="View"><LuEye className="w-5 h-5" /></button>
                      <button onClick={() => handleEditClick(registration)} className="p-2 text-gray-600 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 transition-colors" title="Edit"><LuPencil className="w-5 h-5" /></button>
                      <button className="p-2 text-gray-600 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 transition-colors" title="Download"><LuDownload className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="p-12 text-center">
            <LuFileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No registrations found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 dark:border dark:border-gray-600 rounded-xl shadow-theme-xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Registration</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Update the details of this registration case</p>
              </div>
              <button onClick={handleCloseEditModal} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><LuX className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(85vh-160px)]">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                {[
                  { label: "Client Name", field: "clientName" as keyof Registration, type: "text" },
                  { label: "Email", field: "clientEmail" as keyof Registration, type: "email" },
                  { label: "Phone", field: "phone" as keyof Registration, type: "tel" },
                  { label: "Type", field: "type" as keyof Registration, type: "text" },
                  { label: "Assigned To", field: "assignedTo" as keyof Registration, type: "text" },
                  { label: "Submitted Date", field: "submittedDate" as keyof Registration, type: "date" },
                  { label: "Last Updated", field: "lastUpdated" as keyof Registration, type: "date" },
                ].map(({ label, field, type }) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={String(editFormData[field])}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => handleInputChange("status", e.target.value as Registration["status"])}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="mt-5">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Documents</label>
                <div className="space-y-2">
                  {editFormData.documentList.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <LuFileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</span>
                      </div>
                      <button className="p-1.5 text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 rounded-lg transition-colors" title="Download"><LuDownload className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <button onClick={handleCloseEditModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleSaveChanges} className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isModalOpen && selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 dark:border dark:border-gray-600 rounded-xl shadow-theme-xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Registration Details - {selectedRegistration.id}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Complete information about this registration case</p>
              </div>
              <button onClick={handleCloseModal} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><LuX className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: "Client Name", value: selectedRegistration.clientName },
                  { label: "Email", value: selectedRegistration.clientEmail },
                  { label: "Phone", value: selectedRegistration.phone },
                  { label: "Type", value: selectedRegistration.type },
                  { label: "Assigned To", value: selectedRegistration.assignedTo },
                  { label: "Submitted Date", value: selectedRegistration.submittedDate },
                  { label: "Last Updated", value: selectedRegistration.lastUpdated },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusColor(selectedRegistration.status)}`}>
                    {formatStatus(selectedRegistration.status)}
                  </span>
                </div>
              </div>
              <div className="mt-5">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Documents</label>
                <div className="space-y-2">
                  {selectedRegistration.documentList.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <LuFileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</span>
                      </div>
                      <button className="p-1.5 text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors" title="Download"><LuDownload className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
