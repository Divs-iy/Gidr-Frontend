"use client";
import { useState } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/sidebar';
import { Upload, Loader2, Zap, FileText } from 'lucide-react';
import axios from 'axios';
import IntelligenceAlerts from '@/components/Intelligencealerts';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  // const [extractedData, setExtractedData] = useState<any>(null);
  // const [results, setResults] = useState<any>(null);
  const [extractedData, setExtractedData] = useState<any>(null);  // ✅ add this
  const [results, setResults] = useState<any>(null);

  // --- SMART MODE STATE ---
  const [mode, setMode] = useState<"invoice" | "smart">("invoice");
  const [smartFile, setSmartFile] = useState<File | null>(null);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartMsg, setSmartMsg] = useState("");
  const [smartResults, setSmartResults] = useState<any>(null);
  const [smartSummary, setSmartSummary] = useState<any>(null);

  const uploadFile = async () => {
    if (!file) return;
    setLoading(true);
    setMsg("");

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await api.post('/upload', fd, {
        timeout: 300000,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setExtractedData(res.data.extracted_data);
      setResults(res.data);              // ✅ populate results for download link
      setMsg("Excel Generated!");        // ✅ matches the condition below for download button
    } catch (e) {
      setMsg("Upload failed. Check console.");
      console.error(e);
    } finally {
      setLoading(false);
    }
    // ✅ DELETE the rogue axios.post call that was here — it was causing the second timeout
  };
  // --- SMART UPLOAD ---
  const uploadSmart = async () => {
    if (!smartFile) return;
    setSmartLoading(true);
    setSmartMsg("");
    setSmartResults(null);
    setSmartSummary(null);
    const fd = new FormData();
    fd.append('file', smartFile);
    try {
      const res = await api.post('/upload/smart', fd, {
        timeout: 300000,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSmartResults(res.data);
      setSmartSummary(res.data.summary);
      setSmartMsg("Done!");
    } catch (e) {
      setSmartMsg("Upload failed. Check console.");
      console.error(e);
    } finally {
      setSmartLoading(false);
    }
  };
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="ml-64 p-10 w-full flex flex-col items-center justify-center">

        {/* Mode Toggle */}
        <div className="w-full max-w-xl mb-6 flex rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          <button
            onClick={() => setMode("invoice")}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition ${
              mode === "invoice"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <FileText size={16} />
            Invoice / BOQ
          </button>
          <button
            onClick={() => setMode("smart")}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition ${
              mode === "smart"
                ? "bg-indigo-600 text-white"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Zap size={16} />
            Smart Extract 
          </button>
        </div>

        {/* INVOICE MODE — exactly as before */}
        {mode === "invoice" && (
          <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-6">Upload New Invoice</h2>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 mb-6 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
            />
            <button
              onClick={uploadFile}
              disabled={!file || loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold disabled:bg-slate-300 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
              {loading ? "AI is Thinking..." : "Start Extraction"}
            </button>
            {msg && (
              <p className="mt-4 text-center text-sm font-medium text-blue-600">{msg}</p>
            )}
            {extractedData && (
  <div className="mt-6 space-y-3">
    {/* ✅ Handwritten bill alert */}
    {extractedData.document_type === "HANDWRITTEN_BILL" && (
      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
        <span className="text-lg"></span>
        <div>
          <p className="text-xs font-bold text-orange-700">Handwritten Bill Detected</p>
          <p className="text-xs text-orange-600 mt-0.5">AI extracted this from handwriting. Please verify the details below before downloading.</p>
        </div>
      </div>
    )}

    {/* ✅ Low confidence warning */}
    {extractedData.confidence_score > 0 && extractedData.confidence_score < 0.6 && (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
        <span className="text-lg">⚠️</span>
        <div>
          <p className="text-xs font-bold text-yellow-700">Low Confidence ({Math.round(extractedData.confidence_score * 100)}%)</p>
          <p className="text-xs text-yellow-600 mt-0.5">Document may be unclear or low quality. Verify extracted data carefully.</p>
        </div>
      </div>
    )}

    {/* ✅ Translation notice */}
    {extractedData.translated && (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <span className="text-lg">🌐</span>
        <div>
          <p className="text-xs font-bold text-blue-700">Regional Language Detected</p>
          <p className="text-xs text-blue-600 mt-0.5">Content translated to English automatically.</p>
        </div>
      </div>
    )}

    {/* Extracted data card */}
    <div className="p-4 bg-slate-50 rounded-xl border text-sm text-slate-700 space-y-1">
      <p><span className="font-semibold">Vendor:</span> {extractedData.vendor_name}</p>
      <p><span className="font-semibold">Invoice #:</span> {extractedData.invoice_number}</p>
      <p><span className="font-semibold">Date:</span> {extractedData.date}</p>
      <p><span className="font-semibold">Total:</span> ₹{extractedData.total_amount}</p>
      {extractedData.document_type && (
        <p><span className="font-semibold">Type:</span> {extractedData.document_type.replace("_", " ")}</p>
      )}
    </div>
  </div>
)}
            {results && (
  <IntelligenceAlerts
    duplicateAlert={results.duplicate_alert}
    anomalyAlert={results.anomaly_alert}
  />
)}
            {msg === "Excel Generated!" && results?.download_url && (
              <a
                href={results.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block bg-green-500 text-white px-6 py-2 rounded font-bold hover:bg-green-600"
              >
                📂 Download Generated Excel
              </a>
            )}
          </div>
        )}

        {extractedData?.translated && (
  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
    🌐 Content detected in regional language and translated to English automatically.
  </div>
)}
{extractedData?.confidence_score < 0.6 && (
  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
    ⚠️ Low confidence score — this may be a handwritten or low quality document. Please verify the extracted data.
  </div>
)}

        {/* SMART MODE */}
        {mode === "smart" && (
          <div className="w-full max-w-xl">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-1">Smart Document Extract </h2>
              <p className="text-slate-500 text-sm mb-6">
                Upload any document — contract, invoice, agreement, receipt. AI detects the type and extracts everything automatically.
              </p>
              <input
                type="file"
                onChange={(e) => setSmartFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-500 mb-6 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700"
              />
              <button
                onClick={uploadSmart}
                disabled={!smartFile || smartLoading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold disabled:bg-slate-300 flex justify-center items-center gap-2"
              >
                {smartLoading ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
                {smartLoading ? "AI is Reading..." : "Smart Extract"}
              </button>
              {smartMsg && (
                <p className="mt-4 text-center text-sm font-medium text-indigo-600">{smartMsg}</p>
              )}
            </div>

            {/* Summary Card */}
            {smartSummary && (
              <div className="mt-6 bg-white rounded-2xl border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4 border-b pb-3">
                  <div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                      {smartSummary.document_type || "Document"}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800 mt-2">
                      {smartSummary.title || "Extracted Document"}
                    </h3>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    (smartSummary.confidence || 0) >= 0.9
                      ? "bg-green-100 text-green-700"
                      : (smartSummary.confidence || 0) >= 0.75
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {Math.round((smartSummary.confidence || 0) * 100)}% confidence
                  </span>
                </div>

                {/* Key Fields */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {smartSummary.key_fields?.map((field: any, i: number) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 font-medium">{field.label}</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{field.value}</p>
                    </div>
                  ))}
                </div>

                {/* Sections preview */}
                {smartSummary.sections_found?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2">SECTIONS DETECTED</p>
                    <div className="flex flex-wrap gap-2">
                      {smartSummary.sections_found.map((s: string, i: number) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download */}
                {smartResults?.download_url && (
                  <a
                    href={smartResults.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700"
                  >
                    📂 Download Excel
                  </a>
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
