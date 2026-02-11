"use client";

import React from "react";
import { LuDollarSign, LuClock, LuTrendingUp } from "react-icons/lu";

interface Payment {
  id: string;
  registrationId: string;
  client: string;
  amount: number;
  method: string;
  status: "Pending" | "Completed";
  date: string;
}

const paymentsData: Payment[] = [
  { id: "PAY-001", registrationId: "REG-001", client: "John Doe", amount: 299.99, method: "Credit Card", status: "Pending", date: "2026-01-25" },
  { id: "PAY-002", registrationId: "REG-002", client: "Jane Smith", amount: 499.99, method: "Bank Transfer", status: "Completed", date: "2026-01-20" },
  { id: "PAY-003", registrationId: "REG-003", client: "Tech Innovations Inc", amount: 899.99, method: "Credit Card", status: "Completed", date: "2026-01-15" },
  { id: "PAY-004", registrationId: "REG-004", client: "Green Solutions", amount: 399.99, method: "PayPal", status: "Completed", date: "2026-01-10" },
];

export default function Payments() {
  const totalRevenue = paymentsData.filter((p) => p.status === "Completed").reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = paymentsData.filter((p) => p.status === "Pending").length;
  const totalTransactions = paymentsData.length;

  const getStatusColor = (status: Payment["status"]) => {
    switch (status) {
      case "Completed": return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
      case "Pending": return "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";
      default: return "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track all payment transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-theme-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</h3>
            <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-lg"><LuDollarSign className="w-5 h-5 text-brand-600 dark:text-brand-400" /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">From completed payments</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-theme-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payments</h3>
            <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg"><LuClock className="w-5 h-5 text-orange-600 dark:text-orange-400" /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{pendingPayments}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Awaiting processing</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-theme-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</h3>
            <div className="p-2 bg-success-50 dark:bg-success-500/10 rounded-lg"><LuTrendingUp className="w-5 h-5 text-success-600 dark:text-success-400" /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalTransactions}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">All time</p>
        </div>
      </div>

      <div className="bg-white max-w-[720px] lg:max-w-[685px] xl:max-w-full dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
        </div>
        <div className="max-w-[720px] lg:max-w-[700px] xl:max-w-full overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                {["Payment ID", "Registration ID", "Client", "Amount", "Method", "Status", "Date"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {paymentsData.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm font-medium text-gray-900 dark:text-white">{payment.id}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-600 dark:text-gray-400">{payment.registrationId}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm font-medium text-gray-900 dark:text-white">{payment.client}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm font-semibold text-gray-900 dark:text-white">${payment.amount.toFixed(2)}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-600 dark:text-gray-400">{payment.method}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(payment.status)}`}>{payment.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-600 dark:text-gray-400">{payment.date}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
