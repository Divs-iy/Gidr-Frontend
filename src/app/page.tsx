"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import api from "@/lib/api";
import axios from "axios";

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
  items?: InvoiceItem[];
  excel_link?: string;        // ✅ ADD
  document_type?: string;
}

export default function Dashboard() {
  const [history, setHistory] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savedQuoteFilename, setSavedQuoteFilename] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);   // invoice for compare
  const [results, setResults] = useState<any>(null);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [quoteFile, setQuoteFile] = useState<File | null>(null);       // ✅ bring back
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceFilename_saved, setInvoiceFilename_saved] = useState<string>("");
  // ✅ Load saved comparison result from localStorage on mount
useEffect(() => {
  const saved = localStorage.getItem("gidr_comparison");
  const savedQuote = localStorage.getItem("gidr_quote_filename");
  const savedInvoice = localStorage.getItem("gidr_invoice_filename");
  if (saved) setComparisonResult(JSON.parse(saved));
  if (savedQuote) setSavedQuoteFilename(savedQuote);
  if (savedInvoice) setInvoiceFilename_saved(savedInvoice);
}, []);

  useEffect(() => {
    api
      .get("/history")
      .then((res) => {
        console.log("Data received:", res.data);
        setHistory(res.data);
        setLoading(false);
      })
      .catch((err) => {
  console.error("Fetch error:", err);
  if (err.response?.status === 401) {
    window.location.href = "/login";
  }
  setLoading(false);
});
  }, []);

  const handleUploadQuote = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/upload", formData);
  setSavedQuoteFilename(res.data.saved_as);  // backend now returns this
  alert(`Quote uploaded! Reference: ${res.data.saved_as}`);
};

  // handle updates to invoice fields (e.g., vendor_name, total_amount)
  const handleUpdate = async (id: number, field: string, currentValue: string) => {
  const newValue = window.prompt(`Edit ${field.replace("_", " ")}:`, currentValue);
  if (newValue !== null && newValue !== currentValue) {
    try {
      const response = await api.put(`/invoices/${id}`, {
        [field]: newValue,
      });
      if (response.status === 200) {
        alert("Update successful!");
        setHistory((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, [field]: newValue } : item
          )
        );
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update record.");
    }
  }
};

  // handle deletion of an invoice
  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      "Delete this entry?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/invoices/${id}`);

      // Remove from UI immediately
      setHistory((prev) =>
        prev.filter((item) => item.id !== id)
      );

      // Collapse if deleted row was open
      if (expandedId === id) {
        setExpandedId(null);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };
  const handleFileChange = (
  e: React.ChangeEvent<HTMLInputElement>, 
  setter: (file: File | null) => void
) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    setter(files[0]);
  } else {
    setter(null);
  }
};
  // 1. Change this: (invoiceFile: File) => 
// 2. To this: () => 
const handleCompare = async () => {
  if (!selectedFile || !savedQuoteFilename) {
    alert("Please upload a quote first!");
    return;
  }

  const formData = new FormData();
  formData.append('invoice', selectedFile);

  try {
    // Attach the filename as a query parameter in the URL
    const res = await api.post(
      `/compare?quote_filename=${encodeURIComponent(savedQuoteFilename)}`, 
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000 
      }
    );
    setResults(res.data);
  } catch (err) {
    console.error("Comparison failed:", err);
    // Add an alert so the loop stops and you see the error
    alert("Check the console - the comparison failed.");
  }
};
  return (
  <div className="flex min-h-screen bg-slate-50">
    <Sidebar />
    <main className="ml-64 w-full p-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gidr Dashboard</h1>
          <p className="text-slate-500 mt-1">AI-powered invoice extraction history</p>
          <button
            onClick={async () => {
              const res = await api.get('/export-all');
              alert(`Master Report saved to: ${res.data.path}`);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          >
            Excel Global Export
          </button>
        </div>
        <div className="bg-white shadow-sm rounded-xl px-6 py-4 border">
          <p className="text-sm text-slate-500">Total Records</p>
          <p className="text-2xl font-bold text-slate-900">{history.length}</p>
        </div>
      </div>

      {/* ✅ COMPARE PANEL — lives here, outside the table */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Quote vs Invoice Verification</h2>
        <div className="grid grid-cols-2 gap-6">

          {/* Step 1: Upload Quote */}
          <div className="border-2 border-dashed border-slate-200 p-5 rounded-lg">
            <p className="text-sm font-semibold text-slate-600 mb-2">
              Step 1 — Upload Quotation
            </p>
            <input
              type="file"
              onChange={(e) => handleFileChange(e, setQuoteFile)}  // ✅ now valid
              className="text-sm"
            />
            <button
              onClick={async () => {
                if (!quoteFile) return alert("Select a quote file first.");
                const formData = new FormData();
                formData.append("file", quoteFile);
                try {
    const res = await api.post("/upload?source=quote", formData, {  // ✅ was axios.post
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
    setSavedQuoteFilename(res.data.saved_as);
    alert(`Quote saved as: ${res.data.saved_as}`);
  } catch (err) {
    console.error("Quote upload failed:", err);
    alert("Quote upload failed.");
  }
}}
              className="mt-3 bg-slate-700 text-white px-4 py-2 rounded text-sm"
            >
              Save Quote
            </button>
            {savedQuoteFilename && (
              <p className="text-xs text-green-600 mt-2">✅ Quote ready: {savedQuoteFilename}</p>
            )}
          </div>

          {/* Step 2: Upload Invoice to compare */}
          <div className="border-2 border-dashed border-slate-200 p-5 rounded-lg">
            <p className="text-sm font-semibold text-slate-600 mb-2">
              Step 2 — Upload Invoice to Compare
            </p>
            <input
              type="file"
              onChange={(e) => handleFileChange(e, setInvoiceFile)}  // ✅ now valid
              className="text-sm"
            />
          </div>
        </div>

        <button
          onClick={async () => {
            if (!invoiceFile || !savedQuoteFilename) {
              return alert("Complete both steps first.");
            }
            const formData = new FormData();
            formData.append("invoice", invoiceFile);
            try {
              const res = await api.post(   // ✅ was axios.post — this was causing 401
      `/compare?quote_filename=${encodeURIComponent(savedQuoteFilename)}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 }
    );
    setComparisonResult(res.data);
    localStorage.setItem("gidr_comparison", JSON.stringify(res.data));
localStorage.setItem("gidr_quote_filename", savedQuoteFilename || "");
localStorage.setItem("gidr_invoice_filename", invoiceFile?.name || "");
          } catch (err) {
    console.error("Comparison failed:", err);
    alert("Comparison failed — check console.");
  }}}
          className="mt-5 bg-indigo-600 text-white px-6 py-2 rounded"
        >
          Run Verification
        </button>

        {/* Result */}
        {/* {comparisonResult && (
          <div className={`mt-5 p-4 rounded-lg border ${
            comparisonResult.status === "MATCH"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}>
            <h3 className="font-bold">
              {comparisonResult.status === "MATCH" ? "✅ All Figures Match" : "⚠️ Discrepancy Detected"}
            </h3>
            <ul className="mt-2 space-y-1">
              {comparisonResult.discrepancies.map((d: any, i: number) => (
                <li key={i} className="text-sm text-red-700">
                  • <strong>{d.field}</strong>: Quote ₹{d.quote} vs Invoice ₹{d.invoice} (Diff: ₹{d.diff})
                </li>
              ))}
            </ul>
          </div>
        )} */}
        {comparisonResult && (
  <AuditPanel
  comparisonResult={comparisonResult}
  quoteFilename={savedQuoteFilename || ""}
  invoiceFilename={invoiceFile?.name || invoiceFilename_saved}
/>
)}
      </div>
      {/* END COMPARE PANEL */}

      {/* Invoice History Table */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border p-10 text-center text-slate-400">
          Syncing with database...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-100">
                <tr className="text-left text-sm text-slate-600">
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4 text-center">Details</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-10 text-slate-400">
                      No invoice history found.
                    </td>
                  </tr>
                ) : (
                  history.map((invoice) => (
                    <React.Fragment key={invoice.id}>
                      <tr
                        className="border-t hover:bg-slate-50 cursor-pointer transition"
                        onClick={() =>
                          setExpandedId(expandedId === invoice.id ? null : invoice.id)
                        }
                      >
                        <td className="p-4 font-medium text-slate-800">{invoice.vendor_name}</td>
                        <td className="p-4 text-slate-700">₹{invoice.total_amount}</td>
                        <td className="p-4 text-slate-600">{invoice.date}</td>
                        <td className="p-4">
                        
  {/* ✅ Guard against null/0 — show N/A if score not available */}
  {invoice.confidence_score ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
      invoice.confidence_score >= 0.9
        ? "bg-green-100 text-green-700"
        : invoice.confidence_score >= 0.75
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700"
    }`}>
      {(invoice.confidence_score * 100).toFixed(0)}%
    </span>
    ) : (
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-400">
      N/A
    </span>
  )}
</td>
                        
                        <td className="p-4 text-center text-slate-500">
                          {expandedId === invoice.id ? "▲" : "▼"}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleUpdate(invoice.id, "vendor_name", invoice.vendor_name)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleUpdate(invoice.id, "total_amount", invoice.total_amount.toString())}
                              className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                            >
                              Edit Amount
                            </button>
                            <button
                              onClick={() => handleDelete(invoice.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ✅ Expanded row — only line items, no compare UI here */}
                      {/* Replace the entire expanded row section */}
{expandedId === invoice.id && (
  <tr className="bg-slate-50">
    <td colSpan={6} className="p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        {/* ✅ Correct label based on document type */}
        <h3 className="font-bold text-slate-800 text-lg">
          {invoice.items?.some(i =>
            ["cgst","sgst","igst","net premium","stamp duty"].includes(i.description?.toLowerCase())
          ) ? "Premium Breakdown" : "Line Items"}
        </h3>
        {/* ✅ Link to archived original file */}
        {invoice.filename && (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/originals/${invoice.filename}`}
  target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-200 text-sm font-medium hover:bg-blue-100"
          >
            🔍 View Original Document
            
          </a>
        )}
        {/* ✅ Also show Excel download if available */}
        {invoice.excel_link && (
          <a
            href={invoice.excel_link}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-50 text-green-600 px-3 py-1 rounded border border-green-200 text-sm font-medium hover:bg-green-100 ml-2"
          >
            📂 Download Excel
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
                <td className="p-3 text-slate-700">{item.description}</td>
                <td className="p-3 text-center font-medium text-slate-800">
                  {item.quantity || "—"}
                </td>
                <td className="p-3 text-right font-medium text-slate-800">
                  ₹{item.amount}
                </td>
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
        </div>
      )}
    </main>
  </div>
);
function AuditPanel({ comparisonResult, quoteFilename, invoiceFilename }: {
  comparisonResult: any;
  quoteFilename: string;
  invoiceFilename: string;
}) {
  const buildAuditItems = () => {
  const items: any[] = [];
  const qItems = comparisonResult.quote_data?.line_items || [];
  const iItems = comparisonResult.invoice_data?.line_items || [];

  // Track which invoice items have been matched
  const matchedInvoiceIndexes = new Set<number>();

  // Process all quote items first
  qItems.forEach((q: any) => {
    const qAmt = Math.round((q.amount || 0) * 100);

    // Try match by amount first
    const iMatchIdx = iItems.findIndex((i: any, idx: number) =>
      !matchedInvoiceIndexes.has(idx) &&
      Math.abs(Math.round((i.amount || 0) * 100) - qAmt) < 2
    );

    if (iMatchIdx !== -1) {
      matchedInvoiceIndexes.add(iMatchIdx);
      items.push({
        description: q.description,
        quoted_price: q.amount,
        invoiced_price: iItems[iMatchIdx].amount,
        status: "MATCH",
        reason: "Price matches quotation exactly.",
        action: "APPROVED",
        comment: ""
      });
    } else {
      // Try match by description
      const descMatchIdx = iItems.findIndex((i: any, idx: number) =>
        !matchedInvoiceIndexes.has(idx) &&
        i.description?.toLowerCase().trim() === q.description?.toLowerCase().trim()
      );

      if (descMatchIdx !== -1) {
        matchedInvoiceIndexes.add(descMatchIdx);
        const diff = Math.round(((iItems[descMatchIdx].amount || 0) - (q.amount || 0)) * 100) / 100;
        const isMatch = Math.abs(diff) < 0.02;
        items.push({
          description: q.description,
          quoted_price: q.amount,
          invoiced_price: iItems[descMatchIdx].amount,
          status: isMatch ? "MATCH" : "PRICE MISMATCH",
          reason: isMatch
            ? "Price matches quotation exactly."
            : diff > 0
              ? `Invoiced price is ₹${diff} higher than quoted price.`
              : `Invoiced price is ₹${Math.abs(diff)} lower than quoted price.`,
          action: isMatch ? "APPROVED" : "FLAGGED",
          comment: ""
        });
      } else {
        // Not found in invoice at all
        items.push({
          description: q.description,
          quoted_price: q.amount,
          invoiced_price: 0,
          status: "MISSING IN INVOICE",
          reason: "Item present in quote but missing from invoice.",
          action: "FLAGGED",
          comment: ""
        });
      }
    }
  });

  // Only add truly unmatched invoice items as NOT IN QUOTE
  iItems.forEach((i: any, idx: number) => {
    if (!matchedInvoiceIndexes.has(idx) && (i.amount || 0) > 0) {
      items.push({
        description: i.description,
        quoted_price: 0,
        invoiced_price: i.amount,
        status: "NOT IN QUOTE",
        reason: "Item was never approved in the initial quotation.",
        action: "FLAGGED",
        comment: ""
      });
    }
  });

  return items;
};

  const [auditItems, setAuditItems] = React.useState(buildAuditItems);
  const [saving, setSaving] = React.useState(false);
  const [reportId, setReportId] = React.useState<number | null>(null);

  const updateItem = (idx: number, field: string, value: string) => {
    setAuditItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  const handleSaveAndDownload = async () => {
  setSaving(true);
  try {
    const res = await api.post("/audit/save", {
      quote_filename: quoteFilename,
      invoice_filename: invoiceFilename,
      items: auditItems
    });
    const id = res.data.report_id;
    setReportId(id);

    // ✅ Download with token in header via blob
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
  } catch (err) {
    console.error("Save failed:", err);
    alert("Failed to save audit report.");
  } finally {
    setSaving(false);
  }
};

  const flagged = auditItems.filter(i => i.action === "FLAGGED" && i.status !== "MATCH").length;
  const totalDisputed = auditItems
    .filter(i => i.action === "FLAGGED" && i.status !== "MATCH")
    .reduce((sum, i) => sum + Math.abs((i.invoiced_price || 0) - (i.quoted_price || 0)), 0);

  return (
    <div className="mt-6">
      {/* Summary bar */}
      <div className="flex gap-4 mb-4">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex-1 text-center">
          <p className="text-xs text-red-500 font-medium">Flagged Items</p>
          <p className="text-2xl font-bold text-red-700">{flagged}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex-1 text-center">
          <p className="text-xs text-yellow-600 font-medium">Total Disputed</p>
          <p className="text-2xl font-bold text-yellow-700">₹{totalDisputed.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex-1 text-center">
          <p className="text-xs text-green-600 font-medium">Matched Items</p>
          <p className="text-2xl font-bold text-green-700">
            {auditItems.filter(i => i.status === "MATCH").length}
          </p>
        </div>
      </div>

      {/* Audit table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">Item Description</th>
              <th className="p-3 text-right">Quoted (₹)</th>
              <th className="p-3 text-right">Invoiced (₹)</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-center">Action</th>
              <th className="p-3 text-left">Accountant Note</th>
            </tr>
          </thead>
          <tbody>
            {auditItems.map((item, idx) => (
              <tr key={idx} className={`border-t ${
                item.status === "MATCH" ? "bg-green-50" :
                item.action === "APPROVED" ? "bg-yellow-50" :
                "bg-red-50"
              }`}>
                <td className="p-3 text-slate-800 font-medium max-w-[200px]">
                  {item.description}
                </td>
                <td className="p-3 text-right text-slate-700">
                  {item.quoted_price > 0 ? `₹${item.quoted_price}` : "—"}
                </td>
                <td className="p-3 text-right text-slate-700">
                  {item.invoiced_price > 0 ? `₹${item.invoiced_price}` : "—"}
                </td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    item.status === "MATCH" ? "bg-green-200 text-green-800" :
                    item.status === "PRICE MISMATCH" ? "bg-red-200 text-red-800" :
                    item.status === "NOT IN QUOTE" ? "bg-purple-200 text-purple-800" :
                    "bg-orange-200 text-orange-800"
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-3 text-slate-600 text-xs max-w-[200px]">{item.reason}</td>
                <td className="p-3 text-center">
                  {item.status !== "MATCH" && (
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => updateItem(idx, "action", "FLAGGED")}
                        className={`px-2 py-1 rounded text-xs font-bold transition ${
                          item.action === "FLAGGED"
                            ? "bg-red-500 text-white"
                            : "bg-red-100 text-red-600 hover:bg-red-200"
                        }`}
                      >
                        🔴 Flag
                      </button>
                      <button
                        onClick={() => updateItem(idx, "action", "APPROVED")}
                        className={`px-2 py-1 rounded text-xs font-bold transition ${
                          item.action === "APPROVED"
                            ? "bg-green-500 text-white"
                            : "bg-green-100 text-green-600 hover:bg-green-200"
                        }`}
                      >
                        🟢 Approve
                      </button>
                    </div>
                  )}
                  {item.status === "MATCH" && (
                    <span className="text-green-600 text-xs font-semibold">✓ OK</span>
                  )}
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    value={item.comment}
                    onChange={(e) => updateItem(idx, "comment", e.target.value)}
                    placeholder={item.status === "MATCH" ? "Optional note..." : "Add justification..."}
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-400"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Download button */}
      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={handleSaveAndDownload}
          disabled={saving}
          className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-700 disabled:bg-slate-300 flex items-center gap-2"
        >
          {saving ? "Saving..." : "📥 Download Excel Audit Data"}
        </button>
      </div>
    </div>
  );
}
}