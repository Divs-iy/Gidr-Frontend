"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import api from "@/lib/api";

interface InvoiceItem {
  id: number;
  description: string;
  unit?: string; 
  quantity?: number;
  amount: number;
}

interface Invoice {
  id: number;
  vendor_name: string;
  total_amount: number;
  date: string;
  confidence_score: number;
  filename: string;
  excel_link?: string;
  items?: InvoiceItem[];
}

export default function HistoryPage() {
  const [history, setHistory] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    api.get("/history")
      .then((res) => { setHistory(res.data); setLoading(false); })
      .catch((err) => {
        if (err?.response?.status === 401) {
          window.location.href = "/login";
        }
        setLoading(false);
      });
  }, []);

  const isInsurance = (items?: InvoiceItem[]) =>
    items?.some(i =>
      ["cgst", "sgst", "igst", "net premium", "stamp duty"]
        .includes(i.description?.toLowerCase())
    );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 w-full p-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Invoice History</h1>
        <p className="text-slate-500 mb-8">All extracted invoices</p>

        {loading ? (
          <div className="bg-white rounded-2xl border p-10 text-center text-slate-400">
            Syncing with database...
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="bg-slate-100">
                <tr className="text-left text-sm text-slate-600">
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4 text-center">Details</th>
                  <th className="p-4">Download</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-10 text-slate-400">
                      No invoice history found. Upload an invoice from New Upload.
                    </td>
                  </tr>
                ) : (
                  history.map((invoice) => (
                    <React.Fragment key={invoice.id}>
                      <tr
                        className="border-t hover:bg-slate-50 cursor-pointer transition"
                        onClick={() => setExpandedId(expandedId === invoice.id ? null : invoice.id)}
                      >
                        <td className="p-4 font-medium text-slate-800">{invoice.vendor_name}</td>
                        <td className="p-4 text-slate-700">₹{invoice.total_amount}</td>
                        <td className="p-4 text-slate-600">{invoice.date}</td>
                        <td className="p-4">
                          {invoice.confidence_score ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              invoice.confidence_score >= 0.9 ? "bg-green-100 text-green-700"
                              : invoice.confidence_score >= 0.75 ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                            }`}>
                              {(invoice.confidence_score * 100).toFixed(0)}%
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="p-4 text-center text-slate-500">
                          {expandedId === invoice.id ? "▲" : "▼"}
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          {invoice.excel_link && (
                            <a
                              href={invoice.excel_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              📂 Excel
                            </a>
                          )}
                        </td>
                      </tr>

                      {expandedId === invoice.id && (
                        <tr className="bg-slate-50">
                          <td colSpan={6} className="p-6">
                            <div className="flex justify-between items-center mb-3 border-b pb-2">
                              <h3 className="font-bold text-slate-800">
                                {isInsurance(invoice.items) ? "Premium Breakdown" : "Line Items"}
                              </h3>
                              {invoice.filename && (
                                <a
                                  href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/originals/${invoice.filename}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-200 text-sm font-medium hover:bg-blue-100"
                                >
                                  🔍 View Original
                                </a>
                              )}
                            </div>
                            {invoice.items && invoice.items.length > 0 ? (
                              <table className="w-full text-sm border rounded-lg overflow-hidden">
                                <thead className="bg-slate-200">
                                  <tr>
                                    <th className="text-left p-3">Description</th>
                                    <th className="text-center p-3">Qty.</th>
                                    <th className="text-right p-3">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {invoice.items.map((item) => (
                                    <tr key={item.id} className="border-t">
                                      <td className="p-3 text-slate-700">
                                        {item.description?.length > 60
                                          ? item.description.substring(0, 60) + "…"
                                          : item.description}
                                      </td>
                                      <td className="p-3 text-center text-slate-500 text-xs">{item.quantity || "—"}</td>
                                      <td className="p-3 text-right font-medium">₹{item.amount}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-slate-400 text-sm">No line items available.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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