"use client";
import React, { useMemo, useRef, useState } from "react";
import {
  LuBuilding2,
  LuMail,
  LuShield,
  LuCamera,
} from "react-icons/lu";
import { FaRegUser } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

const AdminProfileTab: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const userName = user?.name || "User";
  const userEmail = user?.email || "";

  const initials = useMemo(() => {
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return userName.slice(0, 2).toUpperCase();
  }, [userName]);

  const userRole = user?.role || "N/A";

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your profile details
        </p>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xl font-semibold">
                  {initials}
                </div>
              )}
              <button
                onClick={handlePhotoClick}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <LuCamera className="w-5 h-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userName}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Hover on photo to change
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                JPG, PNG or GIF (max 2MB)
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Full Name
            </label>
            <div className="relative mt-2">
              <FaRegUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={userName}
                disabled
                className="h-11 w-full rounded-lg border border-gray-200 bg-gray-100 pl-9 pr-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Email Address
            </label>
            <div className="relative mt-2">
              <LuMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={userEmail}
                disabled
                className="h-11 w-full rounded-lg border border-gray-200 bg-gray-100 pl-9 pr-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Role
            </label>
            <div className="relative mt-2">
              <LuShield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={userRole}
                disabled
                className="h-11 w-full rounded-lg border border-gray-200 bg-gray-100 pl-9 pr-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            disabled
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white opacity-40 cursor-not-allowed"
          >
            Save Changes
          </button>
          <button
            disabled
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 opacity-40 cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Organisation Information
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Details about your organisation
        </p>

        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <LuBuilding2 className="mt-0.5 h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Organisation Name
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                MuteTaxes Limited
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Registration Number
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              MT-2024-00123
            </p>
          </div>
          <div className="flex items-start gap-3">
            <FaRegUser className="mt-0.5 h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Admin Role
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userRole}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Account Status
            </p>
            <span className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileTab;
