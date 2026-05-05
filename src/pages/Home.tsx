import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateIdentity, generateBulk, countries } from "@/lib/generator";
import type { GeneratedIdentity } from "@/lib/generator";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="copy-btn"
      title="Copy to clipboard"
    >
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

function IdentityCard({ identity }: { identity: GeneratedIdentity }) {
  const [showPassword, setShowPassword] = useState(false);

  const fields = [
    { label: "Full Name", value: identity.fullName, icon: "👤" },
    { label: "Username", value: identity.username, icon: "🔖" },
    { label: "Email", value: identity.email, icon: "✉️" },
    {
      label: "Password",
      value: identity.password,
      icon: "🔐",
      masked: !showPassword,
      toggle: () => setShowPassword((v) => !v),
    },
    { label: "Date of Birth", value: `${identity.dateOfBirth} (age ${identity.age})`, icon: "🎂" },
    { label: "Gender", value: identity.gender === "male" ? "Male" : "Female", icon: "⚧️" },
    { label: "Country", value: `${identity.country.flag} ${identity.country.name}`, icon: "" },
  ];

  return (
    <motion.div
      className="identity-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="card-header">
        <span className="country-flag">{identity.country.flag}</span>
        <div className="card-header-text">
          <h2 className="card-name">{identity.fullName}</h2>
          <p className="card-subtitle">{identity.country.name} · {identity.gender === "male" ? "Male" : "Female"}</p>
        </div>
      </div>

      <div className="fields-grid">
        {fields.map((field) => (
          <div key={field.label} className="field-row">
            <span className="field-label">{field.label}</span>
            <div className="field-value-row">
              <span className={`field-value${field.masked ? " masked" : ""}`}>
                {field.masked ? "•".repeat(field.value.length) : field.value}
              </span>
              <div className="field-actions">
                {field.toggle && (
                  <button onClick={field.toggle} className="toggle-btn" title={showPassword ? "Hide" : "Show"}>
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                )}
                <CopyButton text={field.value} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function BulkRow({ identity, index }: { identity: GeneratedIdentity; index: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <td>{identity.country.flag} {identity.country.name}</td>
      <td>{identity.fullName}</td>
      <td>{identity.username}</td>
      <td>{identity.email}</td>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{"•".repeat(8)}</span>
          <CopyButton text={identity.password} />
        </div>
      </td>
      <td>{identity.dateOfBirth}</td>
    </motion.tr>
  );
}

export default function Home() {
  const [identity, setIdentity] = useState<GeneratedIdentity>(() =>
    generateIdentity()
  );
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<"male" | "female" | "">("");
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkResults, setBulkResults] = useState<GeneratedIdentity[]>([]);
  const [bulkGenerated, setBulkGenerated] = useState(false);

  const generate = useCallback(() => {
    const result = generateIdentity(
      selectedCountry || undefined,
      (selectedGender as "male" | "female") || undefined
    );
    setIdentity(result);
  }, [selectedCountry, selectedGender]);

  const generateBulkResults = useCallback(() => {
    const results = generateBulk(
      bulkCount,
      selectedCountry || undefined,
      (selectedGender as "male" | "female") || undefined
    );
    setBulkResults(results);
    setBulkGenerated(true);
  }, [bulkCount, selectedCountry, selectedGender]);

  const exportCSV = () => {
    const headers = ["Country", "Full Name", "Username", "Email", "Password", "Date of Birth", "Age", "Gender"];
    const rows = bulkResults.map((id) => [
      id.country.name,
      id.fullName,
      id.username,
      id.email,
      id.password,
      id.dateOfBirth,
      id.age.toString(),
      id.gender,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fake-names.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🎭</span>
            <div>
              <h1 className="logo-title">FakeNames</h1>
              <p className="logo-tagline">European Identity Generator</p>
            </div>
          </div>
          <div className="mode-tabs">
            <button
              className={`mode-tab${mode === "single" ? " active" : ""}`}
              onClick={() => setMode("single")}
            >
              Single
            </button>
            <button
              className={`mode-tab${mode === "bulk" ? " active" : ""}`}
              onClick={() => setMode("bulk")}
            >
              Bulk
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Controls */}
        <div className="controls">
          <div className="control-group">
            <label className="control-label">Country</label>
            <select
              className="control-select"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">🌍 Any Country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Gender</label>
            <select
              className="control-select"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value as "male" | "female" | "")}
            >
              <option value="">⚧ Any Gender</option>
              <option value="male">♂ Male</option>
              <option value="female">♀ Female</option>
            </select>
          </div>

          {mode === "bulk" && (
            <div className="control-group">
              <label className="control-label">Count</label>
              <select
                className="control-select"
                value={bulkCount}
                onChange={(e) => setBulkCount(Number(e.target.value))}
              >
                {[5, 10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} identities</option>
                ))}
              </select>
            </div>
          )}

          <button
            className="generate-btn"
            onClick={mode === "single" ? generate : generateBulkResults}
          >
            <span className="btn-icon">⚡</span>
            {mode === "single" ? "Generate" : `Generate ${bulkCount}`}
          </button>
        </div>

        {/* Single Mode */}
        {mode === "single" && (
          <AnimatePresence mode="wait">
            <IdentityCard key={identity.email + identity.fullName} identity={identity} />
          </AnimatePresence>
        )}

        {/* Bulk Mode */}
        {mode === "bulk" && (
          <div className="bulk-section">
            {!bulkGenerated ? (
              <div className="bulk-placeholder">
                <span className="placeholder-icon">📋</span>
                <p>Configure your options and click Generate to create multiple identities at once.</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bulk-results"
              >
                <div className="bulk-header">
                  <span className="bulk-count">{bulkResults.length} identities generated</span>
                  <button className="export-btn" onClick={exportCSV}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export CSV
                  </button>
                </div>
                <div className="table-wrapper">
                  <table className="bulk-table">
                    <thead>
                      <tr>
                        <th>Country</th>
                        <th>Full Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Password</th>
                        <th>Date of Birth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResults.map((id, i) => (
                        <BulkRow key={i} identity={id} index={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-number">33</span>
            <span className="stat-label">Countries</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">18M+</span>
            <span className="stat-label">Combinations per country</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">540M+</span>
            <span className="stat-label">Total unique identities</span>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Generated data is entirely fictional. For testing and development purposes only.</p>
      </footer>
    </div>
  );
}
