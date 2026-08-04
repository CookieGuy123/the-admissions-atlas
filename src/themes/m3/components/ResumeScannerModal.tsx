import React, { useState, useRef, useEffect } from "react";
import { Upload, FileText, Loader2, X, AlertTriangle, CheckCircle, Search } from "lucide-react";
import { apiFetch } from "../../../lib/api";

interface Props {
  onClose: () => void;
  onData: (data: any) => void;
  data: any;
}

export default function ResumeScannerModal({ onClose, onData, data }: Props) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const extractText = async (file: File): Promise<string> => {
    if (file.type === "text/plain") return await file.text();
    if (file.type === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n";
      }
      return text;
    }
    throw new Error("Unsupported. Use .txt or .pdf files.");
  };

  const handleFile = async (file: File) => {
    setError(null); setFileName(file.name); setUploading(true);
    try {
      const text = await extractText(file);
      const res = await apiFetch("/api/analyze-resume", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resumeText: text }) });
      const result = await res.json();
      if (result.success) onData(result);
      else setError(result.error || "Analysis failed.");
    } catch (e: any) { setError(e.message || "Failed to process."); }
    finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFile(file); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="m3-dialog-overlay" onClick={onClose}>
      <div className="m3-dialog max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-on-surface">Resume Scanner</h2>
              <p className="text-sm text-on-surface-variant">Match your profile to opportunities</p>
            </div>
          </div>
          <button onClick={onClose} className="m3-btn-text p-2"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 pb-5 overflow-y-auto">
          {!data ? (
            <div onDragOver={e => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-outline-variant rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors">
              <input ref={fileInputRef} type="file" accept=".txt,.pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-primary">Analyzing...</p>
                </div>
              ) : fileName ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-medium">{fileName}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-outline" />
                  <p className="text-sm font-medium text-on-surface">Drop resume here or click to browse</p>
                  <p className="text-xs text-on-surface-variant">Supports .txt and .pdf</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {data.profile && (
                <div className="bg-surface-container rounded-xl p-3">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Extracted Profile</p>
                  <p className="text-sm mb-1">{data.profile.summary}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
                    {data.profile.gpa && <span>GPA: <strong className="text-on-surface">{data.profile.gpa}</strong></span>}
                    {data.profile.gradeLevel && <span>Level: <strong className="text-on-surface">{data.profile.gradeLevel}</strong></span>}
                    {data.profile.majors?.length > 0 && <span>Major: <strong className="text-on-surface">{data.profile.majors.join(", ")}</strong></span>}
                  </div>
                </div>
              )}
              {data.scholarships?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-success uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Scholarships ({data.scholarships.length})
                  </p>
                  <div className="space-y-1.5">
                    {data.scholarships.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 bg-surface rounded-xl border border-surface-dim">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{s.name}</p>
                          <p className="text-xs text-on-surface-variant">{s.organization}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-xs font-medium text-primary">{s.matchScore}/7</p>
                          <p className="text-sm font-semibold text-success font-mono">{s.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.internships?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-success uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Internships ({data.internships.length})
                  </p>
                  <div className="space-y-1.5">
                    {data.internships.map((i: any) => (
                      <div key={i.id} className="flex items-center justify-between p-2.5 bg-surface rounded-xl border border-surface-dim">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{i.title}</p>
                          <p className="text-xs text-on-surface-variant">{i.company}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-xs font-medium text-primary">{i.matchScore}/7</p>
                          <p className="text-xs font-medium">{i.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!data.scholarships?.length && !data.internships?.length) && (
                <div className="flex items-start gap-2 p-3 bg-warning-container rounded-xl text-sm text-warning">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> No matching opportunities found.
                </div>
              )}
              <button onClick={() => { onData(null); setFileName(null); setError(null); }}
                className="m3-btn-outlined w-full py-2 text-sm">Scan another</button>
            </div>
          )}
          {error && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-error-container rounded-xl text-sm text-on-error-container">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}