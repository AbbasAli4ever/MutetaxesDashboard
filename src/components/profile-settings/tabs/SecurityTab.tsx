"use client";

import React, { useState } from "react";
import {
  LuKeyRound,
  LuLock,
  LuShieldCheck,
  LuEye,
  LuEyeOff,
  LuCircleCheck,
  LuCircleAlert,
} from "react-icons/lu";
import { authFetch, API_BASE_URL } from "@/lib/auth";

const SecurityTab: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordValidation = {
    minLength: newPassword.length >= 8,
    differentFromCurrent:
      currentPassword.length > 0 ? newPassword !== currentPassword : true,
  };

  const isPasswordStrong = passwordValidation.minLength;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = currentPassword.length > 0 && isPasswordStrong && passwordsMatch && !isLoading;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) return setError("Please enter your current password.");
    if (!isPasswordStrong) return setError("New password does not meet the requirements.");
    if (newPassword !== confirmPassword) return setError("New passwords do not match.");
    if (currentPassword === newPassword) return setError("New password must be different from the current password.");

    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError("Current password is incorrect.");
        } else {
          const message =
            (data as { error?: { message?: string } | string; message?: string }).message ||
            (typeof (data as { error?: unknown }).error === "string"
              ? (data as { error?: string }).error
              : (data as { error?: { message?: string } }).error?.message) ||
            "Failed to update password. Please try again.";
          setError(message);
        }
        return;
      }

      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationItem = ({ valid, label }: { valid: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {valid ? (
        <LuCircleCheck className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <LuCircleAlert className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
      )}
      <span className={`text-xs ${valid ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your password regularly for security</p>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3">
            <LuCircleAlert className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3">
            <LuCircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
          </div>
        )}

        <form onSubmit={handleUpdatePassword}>
          <div className="mt-6 space-y-4">
            <PasswordField
              label="Current Password"
              value={currentPassword}
              setValue={(v) => { setCurrentPassword(v); setError(""); setSuccess(""); }}
              show={showCurrentPassword}
              setShow={setShowCurrentPassword}
              placeholder="Enter current password"
            />

            <div>
              <PasswordField
                label="New Password"
                value={newPassword}
                setValue={(v) => { setNewPassword(v); setError(""); setSuccess(""); }}
                show={showNewPassword}
                setShow={setShowNewPassword}
                placeholder="Enter new password"
              />
              {newPassword.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <ValidationItem valid={passwordValidation.minLength} label="At least 8 characters" />
                  <ValidationItem valid={passwordValidation.differentFromCurrent} label="Different from current password" />
                </div>
              )}
            </div>

            <div>
              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                setValue={(v) => { setConfirmPassword(v); setError(""); setSuccess(""); }}
                show={showConfirmPassword}
                setShow={setShowConfirmPassword}
                placeholder="Confirm new password"
                invalid={confirmPassword.length > 0 && !passwordsMatch}
                valid={confirmPassword.length > 0 && passwordsMatch}
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <LuShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">2FA Status</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Two-factor authentication is currently disabled</p>
            </div>
          </div>
          <button disabled className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 opacity-50 cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            Enable 2FA
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Session Management</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your active sessions</p>
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <LuKeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Current Session</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Authenticated browser session</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last active: Just now</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              Active
            </span>
          </div>
        </div>
        <button disabled className="mt-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 opacity-50 cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          Sign Out All Other Sessions
        </button>
      </div>
    </div>
  );
};

function PasswordField({
  label,
  value,
  setValue,
  show,
  setShow,
  placeholder,
  invalid,
  valid,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  placeholder: string;
  invalid?: boolean;
  valid?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
      <div className="relative mt-2">
        <LuLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`h-11 w-full rounded-lg border bg-gray-50 pl-9 pr-10 text-sm text-gray-700 shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-gray-200 ${
            invalid
              ? "border-red-300 dark:border-red-500/50"
              : valid
              ? "border-emerald-300 dark:border-emerald-500/50"
              : "border-gray-200 dark:border-gray-700"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {show ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default SecurityTab;
