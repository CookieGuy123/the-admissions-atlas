import React, { useState, useEffect } from "react";
import { Calculator, DollarSign, AlertTriangle, BarChart3, Clock } from "lucide-react";
import { collegesData } from "../data/colleges";

const n = (v: string) => parseInt(v) || 0;

interface Props {
  initialCollege?: any;
}

export default function AidCalculatorPanel({ initialCollege }: Props) {
  const [collegeName, setCollegeName] = useState("");
  const [tuition, setTuition] = useState("");
  const [scholarships, setScholarships] = useState("");
  const [grants, setGrants] = useState("");
  const [workStudy, setWorkStudy] = useState("");
  const [familyContribution, setFamilyContribution] = useState("");
  const [years, setYears] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [loadedCollege, setLoadedCollege] = useState<any>(null);

  useEffect(() => {
    if (initialCollege) {
      setCollegeName(initialCollege.name);
      setTuition(String(initialCollege.tuitionSticker));
      setLoadedCollege(initialCollege);
    }
  }, [initialCollege]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadCollege = async (name: string) => {
    if (!name.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const found = collegesData.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
      if (found) {
        setCollegeName(found.name);
        setTuition(String(found.tuitionSticker));
        setGrants(String(found.avgAidPackage));
        setLoadedCollege(found);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/colleges/lookup?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (data.success && data.college) {
        setCollegeName(data.college.name);
        setTuition(String(data.college.tuitionSticker));
        setGrants(String(data.college.avgAidPackage));
        setLoadedCollege(data.college);
      } else {
        setErrorMsg("College not found or AI lookup failed.");
      }
    } catch {
      setErrorMsg("Failed to connect to lookup service.");
    } finally {
      setLoading(false);
    }
  };

  const t = n(tuition), s = n(scholarships), g = n(grants), w = n(workStudy), f = n(familyContribution), y = n(years), r = parseFloat(interestRate) || 0;
  const netCost = t - s - g - w;
  const remainingAfterFamily = Math.max(0, netCost - f);
  const totalLoanPrincipal = remainingAfterFamily * y;
  const monthlyPayment = totalLoanPrincipal > 0 && r > 0
    ? (totalLoanPrincipal * (r / 100 / 12) * Math.pow(1 + r / 100 / 12, 120)) / (Math.pow(1 + r / 100 / 12, 120) - 1)
    : 0;
  const totalRepaid = monthlyPayment * 120;
  const totalInterest = Math.max(0, totalRepaid - totalLoanPrincipal);

  const maxBar = Math.max(t, 1);
  const segments = [
    { label: "Scholarships", value: s, color: "bg-primary" },
    { label: "Grants", value: g, color: "bg-secondary" },
    { label: "Work-Study", value: w, color: "bg-tertiary" },
    { label: "Family", value: f, color: "bg-on-surface-variant" },
    { label: "Borrowing", value: remainingAfterFamily, color: "bg-error" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="m3-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-on-surface">Inputs</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">College</label>
            <div className="flex gap-2">
              <input value={collegeName} onChange={e => setCollegeName(e.target.value)}
                className="m3-field flex-1" placeholder="Type name..." />
              <button onClick={() => loadCollege(collegeName)} disabled={loading} className="m3-btn-outlined text-sm px-4 py-2 flex items-center gap-1.5">
                {loading ? <span className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" /> : null}
                {loading ? "Looking up..." : "Look up"}
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs text-error mt-1 font-medium">{errorMsg}</p>
            )}
            {loadedCollege && !loading && (
              <p className="text-xs text-secondary mt-1 font-medium">
                Loaded: {loadedCollege.name} — avg aid ${loadedCollege.avgAidPackage.toLocaleString()}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Sticker Tuition", value: tuition, set: setTuition },
              { label: "Scholarships", value: scholarships, set: setScholarships },
              { label: "Grants", value: grants, set: setGrants },
              { label: "Work-Study", value: workStudy, set: setWorkStudy },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm font-medium text-on-surface mb-1">{f.label}</label>
                <input type="number" value={f.value} onChange={e => f.set(e.target.value)} className="m3-field w-full" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Family Contribution</label>
              <input type="number" value={familyContribution} onChange={e => setFamilyContribution(e.target.value)} className="m3-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Loan Years</label>
              <input type="number" min={1} max={10} value={years} onChange={e => setYears(e.target.value)} className="m3-field w-full" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Interest Rate: {interestRate || "0"}%</label>
            <input type="range" min={0} max={15} step={0.5} value={interestRate} onChange={e => setInterestRate(e.target.value)}
              className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-on-surface-variant mt-0.5">
              <span>0%</span><span>5%</span><span>10%</span><span>15%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="m3-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-secondary" />
          <h2 className="text-lg font-semibold text-on-surface">Projections</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-surface-container rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface-variant">Net Cost per Year</span>
            <span className="text-2xl font-bold tabular-nums text-on-surface">${netCost.toLocaleString()}</span>
          </div>

          <div>
            <p className="text-sm font-medium text-on-surface mb-2">Funding Sources</p>
            <div className="h-4 flex rounded-lg overflow-hidden">
              {segments.map(s => (
                <div key={s.label}
                  className={`${s.color} ${s.value === 0 ? "opacity-0" : ""} first:rounded-l-lg last:rounded-r-lg`}
                  style={{ width: `${(s.value / maxBar) * 100}%`, minWidth: s.value > 0 ? "4px" : 0 }} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {segments.map(s => (
                <div key={s.label} className="flex items-center gap-2 text-sm">
                  <div className={`w-2.5 h-2.5 rounded-sm ${s.color}`} />
                  <span className="text-on-surface-variant">{s.label}</span>
                  <span className="font-mono tabular-nums font-medium ml-auto">${s.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-surface-dim pt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Total loans (all years)</span>
              <span className="font-mono tabular-nums font-semibold text-error">${totalLoanPrincipal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Monthly payment</span>
              <span className="font-mono tabular-nums font-semibold">${monthlyPayment.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Total repaid</span>
              <span className="font-mono tabular-nums font-semibold">${totalRepaid.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Total interest</span>
              <span className={`font-mono tabular-nums font-semibold ${totalInterest > 0 ? "text-error" : "text-success"}`}>
                ${Math.max(0, totalInterest).toFixed(2)}
              </span>
            </div>
          </div>

          {remainingAfterFamily > t * 0.5 && (
            <div className="flex items-start gap-2 p-3 bg-error-container rounded-xl text-sm text-on-error-container">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>High borrowing. Consider more scholarships or a lower-cost school.</span>
            </div>
          )}
          {r >= 10 && (
            <div className="flex items-start gap-2 p-3 bg-warning-container rounded-xl text-sm text-warning">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Rate above 10%. Explore federal loan options.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}