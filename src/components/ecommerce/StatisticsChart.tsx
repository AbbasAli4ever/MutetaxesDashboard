"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import flatpickr from "flatpickr";
import ChartTab from "../common/ChartTab";
import { CalenderIcon } from "../../icons";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function StatisticsChart() {
  const datePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!datePickerRef.current) return;

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const fp = flatpickr(datePickerRef.current, {
      mode: "range",
      static: true,
      monthSelectorType: "static",
      dateFormat: "M d",
      defaultDate: [sevenDaysAgo, today],
      clickOpens: true,
      prevArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 15L7.5 10L12.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      nextArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 15L12.5 10L7.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    });

    return () => {
      if (!Array.isArray(fp)) {
        fp.destroy();
      }
    };
  }, []);

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      fontFamily: "Outfit, sans-serif",
      fontSize: "13px",
      markers: {
        size: 6,
        shape: "circle",
        strokeWidth: 0,
      },
      itemMargin: {
        horizontal: 16,
        vertical: 8,
      },
      labels: {
        colors: "#6B7280",
      },
    },
    colors: ["#22C55E", "#F87171", "#FBBF24"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 350,
      type: "area",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: [3, 3, 3],
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 0,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: {
        formatter: function (val: number) {
          return "HK$ " + (val / 1000).toFixed(0) + "K";
        },
      },
    },
    xaxis: {
      type: "category",
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: "#9CA3AF",
          fontFamily: "Outfit, sans-serif",
        },
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      min: 0,
      max: 600000,
      tickAmount: 4,
      labels: {
        style: {
          fontSize: "12px",
          colors: "#9CA3AF",
          fontFamily: "Outfit, sans-serif",
        },
        formatter: function (val: number) {
          if (val === 0) return "0K";
          return (val / 1000).toFixed(0) + "K";
        },
      },
    },
  };

  const series = [
    {
      name: "Revenue",
      data: [420000, 380000, 520000, 480000, 560000, 610000],
    },
    {
      name: "Expenses",
      data: [280000, 290000, 310000, 300000, 320000, 340000],
    },
    {
      name: "Net Profit",
      data: [140000, 90000, 210000, 180000, 240000, 270000],
    },
  ];

  // Calculate totals for the stat cards
  const totalRevenue = 2.99;
  const totalExpenses = 1.85;
  const netProfit = 1.14;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      {/* Header with title and filters */}
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Financial Summary
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Year to date performance
          </p>
        </div>
        <div className="flex items-center gap-3 sm:justify-end">
          <ChartTab />
          <div className="relative inline-flex items-center">
            <CalenderIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-3 lg:top-1/2 lg:translate-x-0 lg:-translate-y-1/2  text-gray-500 dark:text-gray-400 pointer-events-none z-10" />
            <input
              ref={datePickerRef}
              className="h-10 w-10 lg:w-40 lg:h-auto  lg:pl-10 lg:pr-3 lg:py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-transparent lg:text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:lg:text-gray-300 cursor-pointer"
              placeholder="Select date range"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        {/* Revenue Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            HK$ {totalRevenue.toFixed(2)}M
          </p>
        </div>

        {/* Expenses Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-400"></span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Expenses</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            HK$ {totalExpenses.toFixed(2)}M
          </p>
        </div>

        {/* Net Profit Card */}
        <div className="rounded-xl border-2 border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/20">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-300">Net Profit</span>
          </div>
          <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">
            HK$ {netProfit.toFixed(2)}M
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[600px] lg:min-w-full xl:min-w-full">
          <Chart options={options} series={series} type="area" height={350} />
        </div>
      </div>
    </div>
  );
}
