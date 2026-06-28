import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateIdentity, generateBulk, extractIdentityFromEmail, countries } from "@/lib/generator";
import type { GeneratedIdentity } from "@/lib/generator";
import { lookupZip, SUPPORTED_COUNTRIES } from "@/lib/zipLookup";
import type { ZipLookupResult } from "@/lib/zipLookup";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sound";
import { initTheme, setTheme } from "@/lib/theme";
import type { Theme } from "@/lib/theme";

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

function buildTsv(identities: GeneratedIdentity[]): string {
  return identities.map((id) =>
    [id.firstName, id.lastName, id.username, id.email, id.password, id.gender === "male" ? "Male" : "Female"].join("\t")
  ).join("\n");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

function CopyAllButton({ identities, label = "Copy All" }: { identities: GeneratedIdentity[]; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(buildTsv(identities));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="export-btn" onClick={handleCopy} title="Copy as tab-separated — paste directly into Excel">
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

function CopyEmailsButton({ identities }: { identities: GeneratedIdentity[] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(identities.map((id) => id.email).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="export-btn" onClick={handleCopy} title="Copy all email addresses, one per line">
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Copy All Emails
        </>
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
        <div style={{ marginLeft: "auto" }}>
          <CopyAllButton identities={[identity]} label="Copy All" />
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
  const [selectedEmailDomain, setSelectedEmailDomain] = useState<string>("");
  const [mode, setMode] = useState<"single" | "bulk" | "extractor" | "zip">("single");
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkResults, setBulkResults] = useState<GeneratedIdentity[]>([]);
  const [bulkGenerated, setBulkGenerated] = useState(false);

  // Extractor state
  const [extractorEmail, setExtractorEmail] = useState("");
  const [extractorCountry, setExtractorCountry] = useState("");
  const [extractorError, setExtractorError] = useState("");
  const [extractedIdentity, setExtractedIdentity] = useState<GeneratedIdentity | null>(null);

  // Theme toggle
  const [theme, setThemeState] = useState<Theme>(initTheme);
  const handleThemeToggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      setTheme(next);
      return next;
    });
  }, []);

  // Sound toggle
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const toggleSound = useCallback(() => {
    setSoundOn((v) => {
      const next = !v;
      setSoundEnabled(next);
      return next;
    });
  }, []);

  // ZIP lookup state
  const [zipCode, setZipCode] = useState("");
  const [zipCountry, setZipCountry] = useState("US");
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState("");
  const [zipResult, setZipResult] = useState<ZipLookupResult | null>(null);

  const handleZipLookup = useCallback(async () => {
    const trimmed = zipCode.trim();
    if (!trimmed) { setZipError("Please enter a ZIP / postal code."); return; }
    setZipError("");
    setZipLoading(true);
    setZipResult(null);
    try {
      const result = await lookupZip(trimmed, zipCountry);
      setZipResult(result);
    } catch (err: unknown) {
      setZipError(err instanceof Error ? err.message : "Lookup failed. Please try again.");
    } finally {
      setZipLoading(false);
    }
  }, [zipCode, zipCountry]);

  const handleExtract = useCallback(() => {
    const trimmed = extractorEmail.trim();
    if (!trimmed) { setExtractorError("Please enter an email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setExtractorError("Please enter a valid email address."); return; }
    setExtractorError("");
    setExtractedIdentity(extractIdentityFromEmail(trimmed, extractorCountry || undefined));
  }, [extractorEmail, extractorCountry]);

  const currentCountryDomains = selectedCountry
    ? (countries.find((c) => c.code === selectedCountry)?.emailDomains ?? [])
    : [];

  const generate = useCallback(() => {
    const result = generateIdentity(
      selectedCountry || undefined,
      (selectedGender as "male" | "female") || undefined,
      selectedEmailDomain || undefined
    );
    setIdentity(result);
  }, [selectedCountry, selectedGender, selectedEmailDomain]);

  const generateBulkResults = useCallback(() => {
    const results = generateBulk(
      bulkCount,
      selectedCountry || undefined,
      (selectedGender as "male" | "female") || undefined,
      selectedEmailDomain || undefined
    );
    setBulkResults(results);
    setBulkGenerated(true);
  }, [bulkCount, selectedCountry, selectedGender, selectedEmailDomain]);

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
            <button
              className={`mode-tab${mode === "extractor" ? " active" : ""}`}
              onClick={() => setMode("extractor")}
            >
              ✉️ Extractor
            </button>
            <button
              className={`mode-tab${mode === "zip" ? " active" : ""}`}
              onClick={() => setMode("zip")}
            >
              📍 ZIP Lookup
            </button>
          </div>
          <div className="header-controls">
            <button
              className="icon-toggle"
              onClick={handleThemeToggle}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button
              className="icon-toggle"
              onClick={toggleSound}
              title={soundOn ? "Sound On — click to mute" : "Sound Off — click to enable"}
              aria-label={soundOn ? "Mute click sounds" : "Enable click sounds"}
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Controls — hidden in extractor mode */}
        <div className="controls" style={mode === "extractor" || mode === "zip" ? { display: "none" } : undefined}>
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

          <div className="control-group">
            <label className="control-label">Email Domain</label>
            <select
              className="control-select"
              value={selectedEmailDomain}
              onChange={(e) => setSelectedEmailDomain(e.target.value)}
            >
              <option value="">@ Any Domain</option>
              {currentCountryDomains.length > 0 ? (
                currentCountryDomains.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))
              ) : (
                <>
                  <option value="gmail.com">gmail.com</option>
                  <option value="yahoo.com">yahoo.com</option>
                  <option value="outlook.com">outlook.com</option>
                  <option value="hotmail.com">hotmail.com</option>
                  <option value="icloud.com">icloud.com</option>
                  <option value="protonmail.com">protonmail.com</option>
                </>
              )}
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
                  <div style={{ display: "flex", gap: "8px" }}>
                    <CopyAllButton identities={bulkResults} label="Copy All" />
                    <CopyEmailsButton identities={bulkResults} />
                    <button className="export-btn" onClick={exportCSV}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Export CSV
                    </button>
                  </div>
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

        {/* Email Extractor Mode */}
        {mode === "extractor" && (
          <div className="bulk-section">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div style={{ maxWidth: 560, margin: "0 auto" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                  Enter an email address, choose a country, and the app will extract a realistic matching identity.
                  Emails generated by the Name Generator will produce consistent, matching results.
                </p>

                {/* Country selector */}
                <div className="control-group" style={{ marginBottom: "12px" }}>
                  <label className="control-label">Country</label>
                  <select
                    className="control-select"
                    value={extractorCountry}
                    onChange={(e) => setExtractorCountry(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="">🌍 Auto-detect from email</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email input + Extract button */}
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="email"
                      className="control-select"
                      placeholder="e.g. acereynolds@gmail.com"
                      value={extractorEmail}
                      onChange={(e) => { setExtractorEmail(e.target.value); setExtractorError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                    {extractorError && (
                      <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "4px" }}>{extractorError}</p>
                    )}
                  </div>
                  <button className="generate-btn" onClick={handleExtract} style={{ whiteSpace: "nowrap" }}>
                    <span className="btn-icon">🔍</span>
                    Extract
                  </button>
                </div>

                {extractedIdentity && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={extractedIdentity.email + extractedIdentity.firstName}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ marginTop: "1.5rem" }}
                    >
                      <div className="identity-card">
                        <div className="card-header">
                          <span className="country-flag">{extractedIdentity.country.flag}</span>
                          <div className="card-header-text">
                            <h2 className="card-name">{extractedIdentity.fullName}</h2>
                            <p className="card-subtitle">
                              {extractedIdentity.country.name} · {extractedIdentity.gender === "male" ? "Male" : "Female"}
                            </p>
                          </div>
                          <div style={{ marginLeft: "auto" }}>
                            <CopyAllButton identities={[extractedIdentity]} label="Copy All" />
                          </div>
                        </div>
                        <div className="fields-grid">
                          {[
                            { label: "First Name", value: extractedIdentity.firstName },
                            { label: "Last Name", value: extractedIdentity.lastName },
                            { label: "Username", value: extractedIdentity.username },
                            { label: "Email", value: extractedIdentity.email },
                            { label: "Password", value: extractedIdentity.password, mono: true },
                            { label: "Gender", value: extractedIdentity.gender === "male" ? "Male" : "Female" },
                            { label: "Date of Birth", value: `${extractedIdentity.dateOfBirth} (age ${extractedIdentity.age})` },
                          ].map((f) => (
                            <div key={f.label} className="field-row">
                              <span className="field-label">{f.label}</span>
                              <div className="field-value-row">
                                <span className="field-value" style={f.mono ? { fontFamily: "monospace" } : undefined}>
                                  {f.value}
                                </span>
                                <div className="field-actions">
                                  <CopyButton text={f.value} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* ZIP Lookup Mode */}
        {mode === "zip" && (
          <div className="bulk-section">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div style={{ padding: "1.5rem" }}>
                <div className="zip-lookup-wrap">
                  <p className="zip-lookup-hint">
                    Enter a ZIP / postal code to get real location info — city, state, area codes,
                    sample addresses, and phone numbers formatted for that area.
                  </p>

                  <div className="zip-input-row">
                    <div className="control-group" style={{ flex: "0 0 auto", minWidth: 160 }}>
                      <label className="control-label">Country</label>
                      <select
                        className="control-select"
                        value={zipCountry}
                        onChange={(e) => { setZipCountry(e.target.value); setZipResult(null); setZipError(""); }}
                        style={{ width: "100%" }}
                      >
                        {SUPPORTED_COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="control-group" style={{ flex: 1 }}>
                      <label className="control-label">ZIP / Postal Code</label>
                      <input
                        type="text"
                        className="control-select"
                        placeholder={zipCountry === "US" ? "e.g. 10001" : zipCountry === "GB" ? "e.g. SW1A" : "e.g. 10115"}
                        value={zipCode}
                        onChange={(e) => { setZipCode(e.target.value); setZipError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleZipLookup()}
                        style={{ width: "100%", boxSizing: "border-box" }}
                      />
                    </div>

                    <button
                      className="generate-btn"
                      onClick={handleZipLookup}
                      disabled={zipLoading}
                      style={{ flexShrink: 0 }}
                    >
                      <span className="btn-icon">🔍</span>
                      {zipLoading ? "Looking up…" : "Lookup"}
                    </button>
                  </div>

                  {zipError && <div className="zip-error">⚠️ {zipError}</div>}

                  {zipLoading && (
                    <div className="zip-loading">
                      <div className="zip-spinner" />
                      Fetching location data…
                    </div>
                  )}

                  {zipResult && !zipLoading && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={zipResult.postCode + zipResult.countryCode}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="zip-results"
                      >
                        {/* Location info card */}
                        <div className="zip-info-card">
                          <div className="zip-info-header">
                            <span className="zip-info-icon">📍</span>
                            <div>
                              <div className="zip-info-title">{zipResult.city}{zipResult.state ? `, ${zipResult.state}` : ""}</div>
                              <div className="zip-info-sub">{zipResult.country} · ZIP {zipResult.postCode}</div>
                            </div>
                          </div>
                          <div className="zip-meta-grid">
                            <div className="zip-meta-item">
                              <div className="zip-meta-label">City</div>
                              <div className="zip-meta-value">{zipResult.city}</div>
                            </div>
                            {zipResult.state && (
                              <div className="zip-meta-item">
                                <div className="zip-meta-label">State / Region</div>
                                <div className="zip-meta-value">{zipResult.state}</div>
                              </div>
                            )}
                            <div className="zip-meta-item">
                              <div className="zip-meta-label">Country</div>
                              <div className="zip-meta-value">{zipResult.country}</div>
                            </div>
                            <div className="zip-meta-item">
                              <div className="zip-meta-label">Coordinates</div>
                              <div className="zip-meta-value" style={{ fontSize: "0.75rem" }}>
                                {parseFloat(zipResult.latitude).toFixed(4)}, {parseFloat(zipResult.longitude).toFixed(4)}
                              </div>
                            </div>
                            <div className="zip-meta-item" style={{ gridColumn: "1 / -1" }}>
                              <div className="zip-meta-label">Area Code{zipResult.areaCodes.length > 1 ? "s" : ""}</div>
                              <div className="zip-area-codes">
                                {zipResult.areaCodes.slice(0, 12).map((ac) => (
                                  <span key={ac} className="zip-area-badge">{ac}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Address list */}
                        <div>
                          <div className="zip-addresses-label">📬 Sample Addresses in {zipResult.postCode}</div>
                          <div className="zip-address-list">
                            {zipResult.addresses.map((addr, i) => (
                              <motion.div
                                key={i}
                                className="zip-address-card"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                              >
                                <div className="zip-address-left">
                                  <div className="zip-address-street">{addr.street}</div>
                                  <div className="zip-address-location">
                                    {addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.zip} · {addr.country}
                                  </div>
                                  <div className="zip-address-phone">📞 {addr.phone}</div>
                                </div>
                                <div className="zip-address-right">
                                  <CopyButton text={`${addr.street}, ${addr.city}${addr.state ? `, ${addr.state}` : ""} ${addr.zip}`} />
                                  <a
                                    href={addr.mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="zip-maps-btn"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                      <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    View on Maps
                                  </a>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-number">31</span>
            <span className="stat-label">Countries</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">57k+</span>
            <span className="stat-label">Names in database</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">540M+</span>
            <span className="stat-label">Total unique identities</span>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>
          Generated data is entirely fictional. For testing and development purposes only.{" "}
          © {new Date().getFullYear()} Md Jubaer Rahman | Phone:{" "}
          <a href="tel:+8801767248131">01767-248131</a>
        </p>
      </footer>
    </div>
  );
}
