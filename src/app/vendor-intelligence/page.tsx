"use client";
import { useState } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/sidebar';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface Answer {
  answer: string;
  model_used?: string;
  cost?: string | number;
  routed_via?: string;
  complexity?: string;
}

export default function VendorIntelligencePage() {
  const [question, setQuestion] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await api.post('/vendor-intelligence/ask', {
        question,
        vendor_name: vendorName || undefined
      });
      setAnswer(res.data);
    } catch (e) {
      setAnswer({ answer: "Something went wrong. Please try again." });
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="ml-64 p-10 w-full flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            <Sparkles size={20} className="text-indigo-600" />
            Vendor Intelligence
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Ask questions about vendor history — powered by persistent memory and intelligent model routing.
          </p>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <input
              type="text"
              placeholder="Vendor name (optional — leave blank to search all vendors)"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full mb-3 px-4 py-2 border border-slate-200 rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. What's this vendor's average invoice amount?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ask()}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <button
                onClick={ask}
                disabled={loading || !question.trim()}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg disabled:bg-slate-300"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </div>

            <div className="flex gap-2 mt-3 flex-wrap">
              {["What's the average invoice amount?", "Any discrepancies flagged recently?", "How many invoices have been processed?"].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuestion(q)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {answer && (
            <div className="mt-6 bg-white rounded-2xl border shadow-sm p-6">
              <p className="text-slate-800 whitespace-pre-wrap">{answer.answer}</p>

              {answer.model_used && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
                    Model: {answer.model_used}
                  </span>
                  {answer.complexity && (
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      answer.complexity === "complex"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-green-50 text-green-700"
                    }`}>
                      {answer.complexity === "complex" ? "🔴 Escalated (complex query)" : "🟢 Fast path (simple query)"}
                    </span>
                  )}
                  {answer.cost && (
                    <span className="text-xs bg-slate-50 text-slate-600 px-3 py-1 rounded-full font-medium">
                      Cost: {answer.cost}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}