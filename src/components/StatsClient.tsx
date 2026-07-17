"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bucketByDay, dayKey, streaks, daysInLast30, heatLevel } from "@/lib/stats-calc";
import { buildYearGrid } from "@/lib/calendar-grid";

type Top = { id: string; title: string; subject: string | null; visits: number };
type Data = { events: string[]; top: Top[] };

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function StatsClient() {
  const [data, setData] = useState<Data | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "offline" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const now = new Date();
      const from = new Date(now.getFullYear(), 0, 1).toISOString();
      try {
        const res = await fetch(`/api/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(now.toISOString())}`);
        if (!res.ok) throw new Error("bad");
        const d: Data = await res.json();
        if (!cancelled) { setData(d); setState("ready"); }
      } catch {
        if (!cancelled) setState(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const now = new Date();
  const year = now.getFullYear();
  const todayKey = dayKey(now);
  const byDay = bucketByDay(data?.events ?? []);
  const days = new Set(byDay.keys());
  const s = streaks(days, todayKey);
  const grid = buildYearGrid(year, todayKey);
  const heat = ["", "l1", "l2", "l3"];

  return (
    <div className="app stx">
      <div className="crumb"><Link href="/">← Desk</Link> · Study stats</div>

      {state === "loading" ? (
        <p className="empty">Opening your record…</p>
      ) : state === "offline" ? (
        <p className="empty">Stats live in the cloud. Connect once to see them.</p>
      ) : state === "error" ? (
        <p className="empty">Could not load your stats. Try again in a moment.</p>
      ) : (
        <>
          <div className="stx-card">
            <div className="stx-top">
              <div className="stx-who">
                <h1>Attendance</h1>
                <span className="stx-lib">Repaso · study record · {year}</span>
              </div>
              <div className="stx-streak"><div><b>{s.current}</b><span>day streak</span></div></div>
            </div>

            <div className="stx-r"><span className="k">Longest streak</span><span className="v">{s.longest} day{s.longest === 1 ? "" : "s"}</span></div>
            <div className="stx-r"><span className="k">Days studied, last 30</span><span className="v">{daysInLast30(days, todayKey)} of 30</span></div>
            <div className="stx-r"><span className="k">Visits this year</span><span className="v">{data?.events.length ?? 0}</span></div>

            <div className="stx-cal">
              <div className="stx-cal-inner">
                <div className="stx-months" style={{ gridTemplateColumns: `repeat(${grid.weeks}, 16px)` }}>
                  {Array.from({ length: grid.weeks }, (_, w) => {
                    const hit = grid.monthLabels.find((m) => m.col === w);
                    return <span key={w}>{hit?.label ?? ""}</span>;
                  })}
                </div>
                <div className="stx-body">
                  <div className="stx-days"><span></span><span>MON</span><span></span><span>WED</span><span></span><span>FRI</span><span></span></div>
                  <div className="stx-grid">
                    {grid.cells.map((c) => {
                      if (!c.inYear || c.future) return <i key={c.key} className="off" />;
                      const visits = byDay.get(c.key) ?? 0;
                      const label = `${MONTH_NAMES[Number(c.key.slice(5, 7)) - 1]} ${Number(c.key.slice(8, 10))} · ${visits ? `${visits} visit${visits > 1 ? "s" : ""}` : "no visits"}`;
                      return <i key={c.key} className={heat[heatLevel(visits)]} title={label} />;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="seclabel"><h3>Most visited</h3><div className="line" /><span className="count">THIS YEAR</span></div>
          {data && data.top.length > 0 ? (
            <div className="stx-stack">
              {data.top.map((t, i) => (
                <div key={t.id} className={`stx-mini ${i === 0 ? "hot" : i === 1 ? "warm" : "mild"}`}>
                  {i === 0 && <span className="flame">🔥</span>}
                  <h4>{t.title}</h4>
                  <span className="visits">{t.visits} visit{t.visits === 1 ? "" : "s"}{i === 0 ? " ✎" : ""}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">Open a reviewer and this page starts counting.</p>
          )}
        </>
      )}
    </div>
  );
}
