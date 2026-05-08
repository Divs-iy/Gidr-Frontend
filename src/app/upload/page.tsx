"use client";
import { useState } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/sidebar';
import { Upload, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  // const [extractedData, setExtractedData] = useState<any>(null);
  // const [results, setResults] = useState<any>(null);
  const [extractedData, setExtractedData] = useState<any>(null);  // ✅ add this
  const [results, setResults] = useState<any>(null);

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
    
// setResults(res.data); // This populates the 'results' variable
  

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="ml-64 p-10 w-full flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
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
            {loading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}  {/* ✅ fixed size */}
            {loading ? "AI is Thinking..." : "Start Extraction"}
          </button>

          {msg && (
            <p className="mt-4 text-center text-sm font-medium text-blue-600">{msg}</p>
          )}

          {/* Show extracted result */}
          {extractedData && (
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border text-sm text-slate-700 space-y-1">
              <p><span className="font-semibold">Vendor:</span> {extractedData.vendor_name}</p>
              <p><span className="font-semibold">Invoice #:</span> {extractedData.invoice_number}</p>
              <p><span className="font-semibold">Date:</span> {extractedData.date}</p>
              <p><span className="font-semibold">Total:</span> ₹{extractedData.total_amount}</p>
            </div>
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
      </main>
    </div>
  );
}