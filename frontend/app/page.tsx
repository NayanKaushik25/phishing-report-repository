"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Role = "REPORTER" | "ANALYST" | "ADMIN";
type User = { userId: number; name: string; email: string; role: Role };
type Report = {
  reportId: number; title: string; description: string; severity: string; status: string;
  reportedAt: string; reporterName: string; accountUsername: string; platformName: string; categoryName: string;
};
type Catalogs = {
  accounts: { accountId: number; username: string; platformName: string }[];
  categories: { categoryId: number; categoryName: string }[];
  analysts: { analystId: number; name: string; department: string | null }[];
};
type Detail = { investigation?: { finding: string; remarks: string | null; analystName: string; investigatedAt: string }; evidence: { evidenceId: number; evidenceType: string; description: string | null; filePathOrUrl: string | null }[] };

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const request = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`${API}${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || "Something went wrong");
  return data;
};

function Icon({ name }: { name: "shield" | "search" | "plus" | "logout" | "arrow" | "close" }) {
  const paths = {
    shield: <><path d="M12 3 4.5 6v5.5c0 4.7 3.2 8.1 7.5 9.5 4.3-1.4 7.5-4.8 7.5-9.5V6L12 3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  } as const;
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [selected, setSelected] = useState<Report | null>(null);
  const [detail, setDetail] = useState<Detail>({ evidence: [] });
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [reportForm, setReportForm] = useState({ title: "", description: "", severity: "MEDIUM", accountId: "", categoryId: "" });
  const [evidenceForm, setEvidenceForm] = useState({ evidenceType: "URL", description: "", filePathOrUrl: "" });
  const [investigationForm, setInvestigationForm] = useState({ finding: "", remarks: "" });
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeNav, setActiveNav] = useState<"overview" | "reports">("overview");
  const displayName = user?.email === "demo@classroom.local" ? "Nihar" : user?.name;

  const refresh = async () => {
    const data = await request("/api/reports");
    setReports(data.reports);
    const catalogData = await request("/api/catalogs");
    setCatalogs(catalogData);
  };
  useEffect(() => {
    request("/api/auth/me")
      .then((data) => { setUser(data.user); return refresh(); })
      .catch(() => request("/api/auth/demo", { method: "POST" })
        .then((data) => { setUser(data.user); return refresh(); })
        .catch(() => undefined));
  }, []);
  const filteredReports = useMemo(() => reports.filter((report) => (filter === "ALL" || report.status === filter) && (!query || `${report.title} ${report.description} ${report.accountUsername}`.toLowerCase().includes(query.toLowerCase()))), [reports, filter, query]);
  const stats = useMemo(() => ({ total: reports.length, active: reports.filter((r) => r.status === "UNDER_REVIEW").length, critical: reports.filter((r) => r.severity === "CRITICAL").length, resolved: reports.filter((r) => r.status === "RESOLVED").length }), [reports]);

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setNotice("");
    try { const data = await request(`/api/auth/${authMode}`, { method: "POST", body: JSON.stringify(authForm) }); setUser(data.user); await refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Authentication failed"); }
    finally { setBusy(false); }
  };
  const submitReport = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try { await request("/api/reports", { method: "POST", body: JSON.stringify({ ...reportForm, accountId: Number(reportForm.accountId), categoryId: Number(reportForm.categoryId) }) }); setReportForm({ title: "", description: "", severity: "MEDIUM", accountId: "", categoryId: "" }); setNotice("Report submitted to the review queue."); await refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not submit report"); }
    finally { setBusy(false); }
  };
  const openReport = async (report: Report) => { setSelected(report); setNotice(""); try { const [evidence, investigation] = await Promise.all([request(`/api/reports/${report.reportId}/evidence`), request(`/api/reports/${report.reportId}/investigation`).catch(() => ({}))]); setDetail({ evidence: evidence.evidence || [], investigation: investigation.investigation }); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not load report details"); } };
  const updateStatus = async (status: string) => { if (!selected) return; try { await request(`/api/reports/${selected.reportId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); setSelected({ ...selected, status }); setReports(reports.map((r) => r.reportId === selected.reportId ? { ...r, status } : r)); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not update status"); } };
  const addEvidence = async (event: FormEvent) => { event.preventDefault(); if (!selected) return; try { await request(`/api/reports/${selected.reportId}/evidence`, { method: "POST", body: JSON.stringify(evidenceForm) }); setEvidenceForm({ evidenceType: "URL", description: "", filePathOrUrl: "" }); await openReport(selected); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not add evidence"); } };
  const addInvestigation = async (event: FormEvent) => { event.preventDefault(); if (!selected) return; try { await request(`/api/reports/${selected.reportId}/investigation`, { method: "POST", body: JSON.stringify(investigationForm) }); setInvestigationForm({ finding: "", remarks: "" }); await openReport(selected); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not record investigation"); } };
  const assign = async (analystId: string) => { if (!selected || !analystId) return; try { await request(`/api/reports/${selected.reportId}/assign`, { method: "POST", body: JSON.stringify({ analystId: Number(analystId) }) }); setNotice("Report assigned successfully."); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not assign report"); } };

  if (!user) return <main className="auth-shell"><div className="auth-art"><div className="brand"><span className="brand-mark"><Icon name="shield" /></span> SIGNAL<span>DESK</span></div><div className="hero-copy"><p className="eyebrow">PHISHING INTELLIGENCE PLATFORM</p><h1>Turn suspicious signals into <em>clear action.</em></h1><p>One secure workspace for reporting, investigating, and resolving phishing activity across your organization.</p></div><div className="auth-footer">Protected workspace · Session-based access</div></div><div className="auth-panel"><div className="mobile-brand"><span className="brand-mark"><Icon name="shield" /></span> SIGNAL<span>DESK</span></div><div className="auth-card"><p className="eyebrow">{authMode === "login" ? "WELCOME BACK" : "GET STARTED"}</p><h2>{authMode === "login" ? "Sign in to your workspace" : "Create your reporter account"}</h2><p className="muted">{authMode === "login" ? "Access your active investigations and reports." : "Submit and track phishing reports securely."}</p><form onSubmit={submitAuth}>{authMode === "register" && <label>Full name<input required value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Your name" /></label>}<label>Email address<input required type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@company.com" /></label><label>Password<input required type="password" minLength={authMode === "register" ? 12 : 1} value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder={authMode === "register" ? "At least 12 characters" : "Your password"} /></label>{notice && <p className="form-error">{notice}</p>}  <button className="button primary wide" disabled={busy}>{busy ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}<Icon name="arrow" /></button></form><button className="link-button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setNotice(""); }}>{authMode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}</button></div></div></main>;

  return <main className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark"><Icon name="shield" /></span> SIGNAL<span>DESK</span></div><div className="side-label">WORKSPACE</div><button className={`nav-item ${activeNav === "overview" ? "active" : ""}`} onClick={() => { setActiveNav("overview"); window.scrollTo({ top: 0, behavior: "smooth" }); }}><span className="nav-icon">◈</span>Overview</button><button className={`nav-item ${activeNav === "reports" ? "active" : ""}`} onClick={() => { setActiveNav("reports"); document.getElementById("reports-feed")?.scrollIntoView({ behavior: "smooth" }); }}><span className="nav-icon">⌁</span>Reports <b>{reports.length}</b></button><div className="sidebar-bottom"><div className="user-chip"><span className="avatar">{displayName?.charAt(0)}</span><div><strong>{displayName}</strong><small>{user.role}</small></div></div><button className="logout" onClick={() => request("/api/auth/logout", { method: "POST" }).then(() => setUser(null))}><Icon name="logout" /> Sign out</button></div></aside><section className="content"><header className="topbar"><div><p className="eyebrow">SECURITY OPERATIONS CENTER</p><h1>Good to see you, {displayName?.split(" ")[0]} <span className="wave">✦</span></h1></div><div className="top-actions"><div className="search"><Icon name="search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reports..." /></div><button className="button primary" onClick={() => document.getElementById("new-report")?.scrollIntoView({ behavior: "smooth" })}><Icon name="plus" />New report</button></div></header>{notice && <div className="notice">{notice}</div>}<div className="stats-grid"><div className="stat-card"><span className="stat-icon blue">◈</span><div><small>Total reports</small><strong>{stats.total}</strong></div><span className="trend">All time</span></div><div className="stat-card"><span className="stat-icon amber">◷</span><div><small>Under review</small><strong>{stats.active}</strong></div><span className="trend amber-text">Live</span></div><div className="stat-card"><span className="stat-icon red">!</span><div><small>Critical severity</small><strong>{stats.critical}</strong></div><span className="trend red-text">Priority</span></div><div className="stat-card"><span className="stat-icon green">✓</span><div><small>Resolved</small><strong>{stats.resolved}</strong></div><span className="trend green-text">Closed</span></div></div><div className="main-grid"><section className="panel reports-panel" id="reports-feed"><div className="panel-header"><div><p className="eyebrow">ACTIVITY FEED</p><h2>Recent reports</h2></div><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="UNDER_REVIEW">Under review</option><option value="RESOLVED">Resolved</option><option value="REJECTED">Rejected</option></select></div><div className="report-list">{filteredReports.map((report) => <button className={`report-row ${selected?.reportId === report.reportId ? "selected" : ""}`} key={report.reportId} onClick={() => openReport(report)}><span className={`severity-dot ${report.severity.toLowerCase()}`} /><div className="report-info"><strong>{report.title}</strong><span>{report.platformName} · @{report.accountUsername} · {report.categoryName}</span></div><span className={`status ${report.status.toLowerCase()}`}>{report.status.replace("_", " ")}</span><span className="report-date">{new Date(report.reportedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span><Icon name="arrow" /></button>)}{!filteredReports.length && <div className="empty">No reports match this view.</div>}</div></section><aside className="panel detail-panel">{selected ? <><div className="detail-top"><div><p className="eyebrow">REPORT #{selected.reportId}</p><h2>{selected.title}</h2></div><button className="icon-button" onClick={() => setSelected(null)}><Icon name="close" /></button></div><p className="detail-description">{selected.description}</p><div className="detail-meta"><span><small>Severity</small><strong className={`severity-text ${selected.severity.toLowerCase()}`}>{selected.severity}</strong></span><span><small>Reported by</small><strong>{selected.reporterName}</strong></span><span><small>Platform</small><strong>{selected.platformName}</strong></span></div>{(user.role === "ANALYST" || user.role === "ADMIN") && <label className="compact-label">Update status<select value={selected.status} onChange={(e) => updateStatus(e.target.value)}><option>PENDING</option><option>UNDER_REVIEW</option><option>RESOLVED</option><option>REJECTED</option></select></label>}{user.role === "ADMIN" && catalogs && <label className="compact-label">Assign analyst<select defaultValue="" onChange={(e) => assign(e.target.value)}><option value="">Choose analyst...</option>{catalogs.analysts.map((a) => <option key={a.analystId} value={a.analystId}>{a.name}{a.department ? ` · ${a.department}` : ""}</option>)}</select></label>}<div className="detail-section"><div className="section-heading"><h3>Investigation</h3>{detail.investigation && <span className="mini-badge">Recorded</span>}</div>{detail.investigation ? <div className="finding"><strong>{detail.investigation.finding}</strong><p>{detail.investigation.remarks}</p><small>By {detail.investigation.analystName}</small></div> : user.role !== "REPORTER" ? <form onSubmit={addInvestigation}><textarea required placeholder="Enter finding..." value={investigationForm.finding} onChange={(e) => setInvestigationForm({ ...investigationForm, finding: e.target.value })} /><input placeholder="Remarks (optional)" value={investigationForm.remarks} onChange={(e) => setInvestigationForm({ ...investigationForm, remarks: e.target.value })} /><button className="button dark">Record finding</button></form> : <p className="muted">No investigation has been recorded yet.</p>}</div><div className="detail-section"><div className="section-heading"><h3>Evidence <span>{detail.evidence.length}</span></h3></div>{detail.evidence.map((item) => <div className="evidence-item" key={item.evidenceId}><span className="evidence-type">{item.evidenceType}</span><div><strong>{item.description || "Attached evidence"}</strong>{item.filePathOrUrl && <a href={item.filePathOrUrl} target="_blank" rel="noreferrer">{item.filePathOrUrl}</a>}</div></div>)}<form onSubmit={addEvidence} className="evidence-form"><select value={evidenceForm.evidenceType} onChange={(e) => setEvidenceForm({ ...evidenceForm, evidenceType: e.target.value })}><option>URL</option><option>SCREENSHOT</option><option>FILE</option><option>MESSAGE</option><option>OTHER</option></select><input placeholder="Description" value={evidenceForm.description} onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })} /><input placeholder="URL or file path (optional)" value={evidenceForm.filePathOrUrl} onChange={(e) => setEvidenceForm({ ...evidenceForm, filePathOrUrl: e.target.value })} /><button className="button outline">Add evidence</button></form></div></> : <div className="detail-empty"><span className="empty-orb">✦</span><h3>Select a report</h3><p>Choose a report from the activity feed to inspect its evidence, status, and investigation history.</p></div>}</aside></div><section className="new-report panel" id="new-report"><div className="new-report-copy"><p className="eyebrow">SUBMIT A SIGNAL</p><h2>Report suspicious activity</h2><p>Give your security team the context they need to investigate quickly. You can attach evidence after submitting.</p></div><form onSubmit={submitReport} className="report-form"><input required placeholder="Report title" value={reportForm.title} onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })} /><div className="form-row"><select required value={reportForm.accountId} onChange={(e) => setReportForm({ ...reportForm, accountId: e.target.value })}><option value="">Suspicious account</option>{catalogs?.accounts.map((a) => <option key={a.accountId} value={a.accountId}>{a.platformName} · @{a.username}</option>)}</select><select required value={reportForm.categoryId} onChange={(e) => setReportForm({ ...reportForm, categoryId: e.target.value })}><option value="">Category</option>{catalogs?.categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}</select><select value={reportForm.severity} onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}><option>MEDIUM</option><option>LOW</option><option>HIGH</option><option>CRITICAL</option></select></div><textarea required placeholder="Describe what happened, where you saw it, and why it looks suspicious..." value={reportForm.description} onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })} /><button className="button light" disabled={busy}><Icon name="plus" />Submit report</button></form></section></section></main>;
}
