"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import api from "@/lib/api";

interface AuditReport {
  id: number;
  quote_filename: string;
  invoice_filename: string;
  created_at: string;
  item_count: number;
}

export default function AuditsPage() {
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/audit/list")
      .then((res) => { setReports(res.data); setLoading(false); })
      .catch((err) => {
        if (err?.response?.status === 401) window.location.href = "/login";
        setLoading(false);
      });
  }, []);

  const handleDownload = async (id: number) => {
    const token = localStorage.getItem("token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/audit/report/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Gidr_Audit_Report_${id}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 w-full p-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Audit Reports</h1>
        <p className="text-slate-500 mb-8">Saved discrepancy audit reports</p>

        {loading ? (
          <div className="bg-white rounded-2xl border p-10 text-center text-slate-400">
            Loading reports...
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="bg-slate-100">
                <tr className="text-left text-sm text-slate-600">
                  <th className="p-4">Quote File</th>
                  <th className="p-4">Invoice File</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Download</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-10 text-slate-400">
                      No audit reports yet. Run a verification from the Dashboard.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="border-t hover:bg-slate-50">
                      <td className="p-4 text-slate-800">{report.quote_filename}</td>
                      <td className="p-4 text-slate-600">{report.invoice_filename}</td>
                      <td className="p-4 text-slate-600">{report.item_count} items</td>
                      <td className="p-4 text-slate-500 text-sm">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDownload(report.id)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          🟢 Download Excel
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}