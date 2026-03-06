"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  markNotificationRead,
  NotificationItem,
  NotificationStreamPayload,
  openNotificationStream,
} from "@/lib/notifications";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

function normalizeNotifications(items: NotificationItem[]) {
  return items
    .filter((item) => !item.isRead)
    .reduce<NotificationItem[]>((acc, current) => {
      const existingIndex = acc.findIndex((item) => item.id === current.id);
      if (existingIndex >= 0) {
        acc[existingIndex] = current;
      } else {
        acc.push(current);
      }
      return acc;
    }, [])
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

function mergeSingleNotification(
  currentList: NotificationItem[],
  notification: NotificationItem
) {
  const withoutCurrent = currentList.filter((item) => item.id !== notification.id);
  if (notification.isRead) return withoutCurrent;
  return normalizeNotifications([...withoutCurrent, notification]);
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamWarning, setStreamWarning] = useState<string | null>(null);
  const [markingIds, setMarkingIds] = useState<Record<number, boolean>>({});
  const { isAuthenticated, getToken } = useAuth();

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleStreamPayload = useCallback(
    (payload: NotificationStreamPayload) => {
      setIsLoading(false);

      if (Array.isArray(payload)) {
        setNotifications(normalizeNotifications(payload));
        setStreamWarning(null);
        return;
      }

      if ("warning" in payload) {
        setStreamWarning(payload.warning);
        return;
      }

      setStreamWarning(null);
      setNotifications((previous) => mergeSingleNotification(previous, payload));
    },
    []
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setErrorMessage(null);
      setStreamWarning(null);
      setIsLoading(false);
      return;
    }

    let isDisposed = false;
    let abortController: AbortController | null = null;
    let reconnectTimer: number | null = null;

    const connect = async () => {
      if (isDisposed) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const accessToken = await getToken();
        if (!accessToken) {
          throw new Error("Authentication token unavailable");
        }

        abortController = new AbortController();
        await openNotificationStream({
          accessToken,
          signal: abortController.signal,
          onOpen: () => {
            if (!isDisposed) {
              setIsLoading(false);
            }
          },
          onPayload: handleStreamPayload,
        });

        if (!isDisposed) {
          setIsLoading(false);
          reconnectTimer = window.setTimeout(connect, 3000);
        }
      } catch (error) {
        if (isDisposed) return;
        const message =
          error instanceof Error ? error.message : "Failed to connect notification stream";
        setErrorMessage(message);
        setIsLoading(false);
        reconnectTimer = window.setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      isDisposed = true;
      if (abortController) {
        abortController.abort();
      }
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
    };
  }, [getToken, handleStreamPayload, isAuthenticated]);

  const handleNotificationRead = async (notificationId: number) => {
    if (markingIds[notificationId]) return;

    setMarkingIds((prev) => ({ ...prev, [notificationId]: true }));
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to mark notification as read";
      setErrorMessage(message);
    } finally {
      setMarkingIds((prev) => {
        const next = { ...prev };
        delete next[notificationId];
        return next;
      });
    }
  };

  const formatRelativeTime = (isoDate: string) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "just now";

    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return "just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hr ago`;
    return `${Math.floor(diffSeconds / 86400)} day ago`;
  };

  const getActorInitials = (notification: NotificationItem) => {
    const actorName = notification.actor?.name?.trim();
    if (!actorName) return "MT";
    const words = actorName.split(/\s+/).filter(Boolean);
    if (!words.length) return "MT";
    const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
    return initials || "MT";
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            unreadCount > 0 ? "flex" : "hidden"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </h5>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {unreadCount} unread
          </span>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {isLoading && notifications.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Loading notifications...
            </li>
          )}

          {!isLoading && notifications.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No unread notifications.
            </li>
          )}

          {notifications.map((notification) => {
            const isMarking = Boolean(markingIds[notification.id]);
            return (
              <li key={notification.id}>
                <DropdownItem
                  onClick={() => handleNotificationRead(notification.id)}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 dark:border-gray-800 ${
                    isMarking
                      ? "cursor-wait opacity-70"
                      : "hover:bg-gray-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="relative mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                    {getActorInitials(notification)}
                  </span>

                  <span className="block flex-1">
                    <span className="mb-1.5 block text-theme-sm text-gray-600 dark:text-gray-300">
                      {notification.message}
                    </span>

                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                      <span>{notification.projectName || "Notification"}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                      <span>{formatRelativeTime(notification.createdAt)}</span>
                      {isMarking && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                          <span>Marking as read...</span>
                        </>
                      )}
                    </span>
                  </span>
                </DropdownItem>
              </li>
            );
          })}
        </ul>

        {(errorMessage || streamWarning) && (
          <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-300">
            {streamWarning || errorMessage}
          </div>
        )}

        <button
          onClick={closeDropdown}
          className="mt-3 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Close
        </button>
      </Dropdown>
    </div>
  );
}
