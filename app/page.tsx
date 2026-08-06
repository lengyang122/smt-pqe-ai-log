"use client";

import { useEffect, useMemo, useState } from "react";

type Log = { id: string; date: string; input: string; content: string; reflection: string };
const quickActions = ["异常处理", "AOI分析", "SPI分析", "供应商管理", "QMS维护", "控制计划审核", "质量改善"];
const quickText: Record<string, string> = { "异常处理": "现场发现制程异常，确认不良品并跟进处理", "AOI分析": "AOI发现焊接不良，协助分析原因", "SPI分析": "SPI检测锡膏异常", "供应商管理": "供应商来料不良处理", "QMS维护": "QMS系统维护", "控制计划审核": "核对控制计划", "质量改善": "跟进异常改善" };
const today = () => new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });
const count = (v: string) => v.replace(/\s/g, "").length;

export default function Home() {
  const [input, setInput] = useState(""); const [content, setContent] = useState(""); const [reflection, setReflection] = useState("");
  const [logs, setLogs] = useState<Log[]>([]); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(false); const [toast, setToast] = useState(""); const [cloudReady, setCloudReady] = useState(false);
  useEffect(() => {
    const local = () => { try { setLogs(JSON.parse(localStorage.getItem("smt-pqe-logs") || "[]")); } catch {} };
    fetch("/api/logs").then(r => r.json()).then(data => { if (!data.configured) return local(); setCloudReady(true); setLogs((data.logs || []).map((l: { id: string; date: string; input_text: string; work_content: string; work_thought: string }) => ({ id: l.id, date: l.date, input: l.input_text, content: l.work_content, reflection: l.work_thought })))}).catch(local);
  }, []);
  const persist = (next: Log[]) => { setLogs(next); localStorage.setItem("smt-pqe-logs", JSON.stringify(next)); };
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };
  const generate = async () => {
    if (!input.trim()) return notify("请先输入今日工作内容"); setLoading(true);
    try {
      const result = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) }).then(r => r.json());
      const log = { id: crypto.randomUUID(), date: today(), input, content: result.content || "", reflection: result.reflection || "" };
      setContent(log.content); setReflection(log.reflection);
      if (cloudReady) { const saved = await fetch("/api/logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: log.date, inputText: log.input, workContent: log.content, workThought: log.reflection }) }).then(r => r.json()); if (!saved.log) throw new Error(saved.error || "保存失败"); log.id = saved.log.id; }
      persist([log, ...logs]); notify(cloudReady ? "日志已生成并保存到云端" : "日志已生成并保存");
    } catch { notify("生成或保存失败，请检查配置后重试"); } finally { setLoading(false); }
  };
  const copy = async () => { await navigator.clipboard.writeText(`日期：${today()}\n\n工作内容：\n${content}\n\n工作感想：\n${reflection}`); notify("已复制到剪贴板"); };
  const removeLog = async (id: string) => { if (cloudReady) { const response = await fetch(`/api/logs/${id}`, { method: "DELETE" }); if (!response.ok) return notify("删除失败，请稍后重试"); } persist(logs.filter(l => l.id !== id)); notify("日志已删除"); };
  const filtered = useMemo(() => logs.filter(l => `${l.date}${l.input}${l.content}${l.reflection}`.toLowerCase().includes(search.toLowerCase())), [logs, search]);
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">PQ</div><div className="brand-copy"><div className="brand-title">SMT PQE AI工作日志助手</div><div className="brand-sub">现场质量工作台</div></div></div><nav className="nav"><button className="nav-item active"><span>✦</span><span>新建日志</span></button><button className="nav-item" onClick={() => document.getElementById("history")?.scrollIntoView({ behavior: "smooth" })}><span>▤</span><span>历史记录</span></button><button className="nav-item" onClick={() => notify(cloudReady ? "当前使用 Supabase 云端保存" : "请配置 Supabase 以启用云端保存") }><span>⚙</span><span>工具设置</span></button></nav><div className="sidebar-foot">SMT Process Quality Engineer<br/>舜宇智领 · 质量管理</div></aside>
    <main className="main"><header className="topbar"><div><h1>新建工作日志</h1><p>用一句话记录今天的工作，AI帮你整理成规范日报</p></div><div className="profile"><div className="avatar">PQ</div><span>现场PQE</span></div></header>
      <div className="content"><div className="workspace">
        <section className="card"><div className="card-head"><div className="card-title"><div className="section-icon">✎</div>今日工作输入</div><span className="status"><i className="dot"/> {cloudReady ? "云端保存" : "本地保存"}</span></div><div className="card-body"><label className="label">日期</label><div className="date-row"><span>{today()}</span><span>今日</span></div><label className="label">工作描述</label><textarea className="textarea" value={input} onChange={e => setInput(e.target.value)} placeholder="请输入今日工作内容，例如：\nAOI发现焊接不良，协助分析原因"/><label className="label quick-label">工作类型快捷输入</label><div className="quick-list">{quickActions.map(a => <button key={a} className="chip" onClick={() => setInput(quickText[a])}>{a}</button>)}</div><button className="primary-btn" onClick={generate} disabled={loading}>{loading ? "正在生成…" : "✦ 生成工作日志"}</button></div></section>
        <section className="card result-card"><div className="card-head"><div className="card-title"><div className="section-icon">✦</div>AI生成结果</div><span className="status">SMT PQE 模板</span></div><div className="result-body"><div className="result-date">日期：{today()}</div><div className="result-block"><div className="result-label">工作内容 <span className="count">{content ? `${count(content)} 字` : "70–80字"}</span></div><div className="result-text">{content || "生成后将在这里展示工作内容。系统会围绕异常确认、标准依据、数据分析和改善跟踪进行扩写。"}</div></div><div className="result-block"><div className="result-label">工作感想 <span className="count">{reflection ? `${count(reflection)} 字` : "40–50字"}</span></div><div className="result-text">{reflection || "生成后将在这里展示工作感想，体现质量意识、问题分析和沟通协调能力。"}</div></div><div className="result-actions"><button className="ghost-btn" onClick={copy} disabled={!content}>▣ 一键复制</button><button className="ghost-btn" onClick={generate} disabled={loading || !input}>↻ 重新生成</button></div></div></section>
      </div><section className="card history" id="history"><div className="history-head"><div className="card-title"><div className="section-icon">▤</div>历史日志 <span className="status">共 {filtered.length} 条</span></div><input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索关键词…"/></div><div className="history-list">{filtered.length === 0 ? <div className="empty">暂无历史记录，生成第一条日志后会显示在这里</div> : filtered.map(log => <div className="history-item" key={log.id}><div className="history-date">{log.date}</div><div className="history-content">{log.content}<small>输入：{log.input}</small></div><div className="history-actions"><button className="icon-btn" title="查看" onClick={() => { setInput(log.input); setContent(log.content); setReflection(log.reflection); window.scrollTo({ top: 0, behavior: "smooth" }); }}>查看</button><button className="icon-btn" title="删除" onClick={() => removeLog(log.id)}>删除</button></div></div>)}</div></section></div>
    </main>{toast && <div className="toast">{toast}</div>}
  </div>;
}
