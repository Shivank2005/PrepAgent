"""
PrepAgent Report Template — Hardcoded HTML/CSS builder.

The LLM returns structured JSON analysis. This module injects that data
into a pixel-perfect HTML template that matches the reference design.

PAGINATION NOTE:
    This template is rendered to PDF via html2pdf.js (html2canvas + jsPDF).
    html2pdf.js renders the entire DOM as one continuous canvas, then slices
    it into A4 pages. Page breaks are controlled by:
    1. The `.page-break` CSS class — html2pdf.js `before` selector (primary)
    2. `page-break-inside: avoid` on card-level elements (secondary)

    DO NOT reuse the cover's wrapper class for content sections.
    DO NOT set fixed pixel heights on section wrappers.
    DO NOT use CSS `break-before: page` / `page-break-before: always`
        — html2pdf.js handles these differently than true print renderers
        and they cause phantom whitespace.
"""
import html as html_module
from datetime import datetime


# ─────────────────────────── CSS ───────────────────────────
REPORT_CSS = """

/* ──────────────────────────────────────────────
   PAGE SETUP — @page for print/WeasyPrint only
   ────────────────────────────────────────────── */
@page {
  size: A4 portrait;
  margin: 20mm 15mm;
}

/* ── GLOBAL RESET ── */
body {
  background-color: #ffffff !important;
}

.report-wrapper {
  font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
  color: #334155;
  margin: 0; padding: 0;
  font-size: 11.5px; line-height: 1.55;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
  background-color: #ffffff;
  text-align: left;
  width: 100%;
  min-height: 100vh;
}
.report-wrapper * { box-sizing: border-box; margin: 0; padding: 0; }

.page-break {
  display: block;
  height: 0;
  page-break-before: always;
  break-before: page;
}

.cover-page {
  height: 1122px; 
  box-sizing: border-box;
  background: linear-gradient(160deg, #f8fafc 0%, #f1f5f9 55%, #e2e8f0 100%);
  color: #0f172a; padding: 140px 60px 50px 60px; position: relative;
}
.logo { font-size: 20px; font-weight: 700; }
.logo-prep { color: #0f172a; }
.logo-agent { color: #0ea5e9; }
.cover-icon {
  width: 48px; height: 48px; background: rgba(14,165,233,0.15);
  border-radius: 12px; display: flex; align-items: center; justify-content: center;
  margin-top: 60px; margin-bottom: 10px;
}
.cover-icon-bar { width: 22px; height: 3px; background: #0ea5e9; border-radius: 2px; }
h1.cover-title {
  font-size: 38px; font-weight: 800; line-height: 1.15;
  margin: 20px 0 16px 0; max-width: 460px;
}
.cover-sub {
  font-size: 13.5px; color: #475569; max-width: 420px; margin-bottom: 50px; line-height: 1.6;
}
.cover-card {
  background: #ffffff; border: 1px solid #cbd5e1;
  border-radius: 14px; padding: 26px 30px; max-width: 100%;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
.cover-row { display: flex; gap: 40px; margin-bottom: 14px; }
.cover-label {
  font-size: 8.5px; letter-spacing: 1.5px; color: #64748b;
  font-weight: 700; margin-bottom: 6px; text-transform: uppercase;
}
.cover-value { font-size: 15px; font-weight: 700; color: #0f172a; }
.cover-divider { border-top: 1px solid #e2e8f0; margin: 6px 0 14px 0; }
.cover-footer {
  margin-top: 80px;
  text-align: center; font-size: 7.5px; letter-spacing: 2px; color: #94a3b8;
  text-transform: uppercase;
}

.toc-section {
  padding: 50px 50px 20px 50px;
  background: #ffffff;
  width: 100%;
  box-sizing: border-box;
}
.toc-title { font-size: 26px; font-weight: 800; margin: 0 0 30px 0; color: #0f172a; }
.toc-item {
  display: flex; gap: 14px; align-items: center;
  padding: 16px 12px; border-bottom: 1px dashed #cbd5e1;
  background: #f8fafc; border-radius: 6px; margin-bottom: 4px;
}
.toc-num { color: #6366f1; font-weight: 700; font-size: 13px; min-width: 22px; }
.toc-label { font-size: 14px; font-weight: 600; color: #1e293b; }

.content-section {
  padding: 50px 50px 20px 50px;
  background: #ffffff;
  width: 100%;
  box-sizing: border-box;
}
.chapter-tag {
  font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #6366f1;
  margin-bottom: 8px; text-transform: uppercase;
}
h2.chapter-title { font-size: 24px; font-weight: 800; margin: 0 0 22px 0; color: #0f172a; }
h3.section-title { font-size: 15px; font-weight: 700; margin: 26px 0 10px 0; color: #0f172a; }

.callout {
  background: #f1f5f9; border-left: 4px solid #3b82f6; border-radius: 6px;
  padding: 16px 18px; margin-bottom: 26px;
  page-break-inside: avoid; break-inside: avoid;
}
.callout-label { font-size: 12px; font-weight: 700; color: #2563eb; margin-bottom: 6px; }
.callout-text { font-size: 11px; color: #334155; line-height: 1.65; }

.metric-row {
  display: flex; gap: 16px; margin-bottom: 16px; width: 100%;
  page-break-inside: avoid; break-inside: avoid;
}
.metric-card {
  flex: 1; border: 1px solid #cbd5e1; border-radius: 10px;
  padding: 20px 14px; text-align: center; background: #f8fafc;
  page-break-inside: avoid; break-inside: avoid;
}
.metric-label {
  font-size: 9px; letter-spacing: 1px; color: #64748b;
  font-weight: 700; margin-bottom: 10px; text-transform: uppercase;
}
.metric-value { font-size: 28px; font-weight: 800; color: #0f172a; }
.metric-sub { font-size: 14px; font-weight: 400; color: #64748b; }
.metric-note { font-size: 9.5px; color: #64748b; font-style: italic; margin-top: 6px; }
.dim-note { font-size: 9px; color: #64748b; font-style: italic; margin: 6px 0 16px 0; }

table.dim-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
table.dim-table th {
  background: #f1f5f9; text-align: left; font-size: 9.5px;
  color: #475569; padding: 8px 10px; font-weight: 700;
}
table.dim-table td { padding: 9px 10px; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
.bar-bg {
  background: #e2e8f0; border-radius: 4px; height: 8px; width: 140px;
  overflow: hidden; display: inline-block; vertical-align: middle;
}
.bar-fill { height: 8px; border-radius: 4px; display: block; }
.bar-green { background: #10b981; }
.bar-amber { background: #f59e0b; }
.bar-red   { background: #ef4444; }

.growth-card {
  border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px 18px;
  margin-bottom: 14px; background: #ffffff; width: 100%;
  page-break-inside: avoid; break-inside: avoid;
}
.growth-title { font-size: 13px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
.growth-desc { font-size: 10.5px; color: #475569; line-height: 1.6; }
.growth-tag {
  display: inline-block; font-size: 8.5px; font-weight: 700; letter-spacing: 0.5px;
  padding: 2px 8px; border-radius: 10px; margin-bottom: 8px; text-transform: uppercase;
}
.tag-high { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
.tag-med  { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }

.plan-block {
  page-break-inside: avoid; break-inside: avoid;
  margin-bottom: 8px;
}
table.plan-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
table.plan-table th {
  background: #f1f5f9; color: #1e293b; text-align: left;
  padding: 9px 10px; font-size: 10px; font-weight: 600;
}
table.plan-table td {
  padding: 9px 10px; font-size: 10.5px; border-bottom: 1px solid #e2e8f0;
  vertical-align: top; color: #334155;
}
table.plan-table tr:nth-child(even) td { background: #f8fafc; }

.qa-card {
  margin-top: 30px;
  margin-bottom: 30px;
  border-bottom: 1px solid #cbd5e1;
  padding-bottom: 20px;
  background-color: #ffffff;
  width: 100%;
  page-break-inside: auto !important;
  break-inside: auto !important;
}
.qa-head {
  background: #f8fafc; padding: 10px 16px; display: flex;
  justify-content: space-between; align-items: center; 
  border-bottom: 1px solid #e2e8f0;
  border-left: 4px solid #7c3aed;
}
.qa-title { font-size: 12px; font-weight: 700; color: #0f172a; }
.qa-score {
  font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 20px;
  background: #e2e8f0; display: inline-block; text-align: center; color: #0f172a; line-height: normal;
}
.score-good { color: #059669; }
.score-mid  { color: #d97706; }
.score-low  { color: #dc2626; }
.qa-body { padding: 14px 16px; }
.qa-sublabel {
  font-size: 9px; letter-spacing: 1px; font-weight: 700; color: #64748b;
  margin: 12px 0 6px 0; text-transform: uppercase;
}
.qa-sublabel:first-child { margin-top: 0; }
.qa-question-text { font-size: 11px; font-style: italic; margin: 0; color: #334155; }
.qa-answer-text { font-size: 10.8px; color: #1e293b; margin: 0; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
.qa-code-container {
  margin: 0 0 12px 0;
}
.code-line {
  font-family: 'Courier New', monospace; font-size: 8.3px; line-height: 1.45;
  color: #334155; white-space: pre-wrap; word-wrap: break-word;
  background: #f8fafc;
  padding: 0 12px;
  border-left: 2px solid #cbd5e1;
  page-break-inside: avoid; break-inside: avoid;
  min-height: 12px;
}
.code-line:first-child { padding-top: 10px; }
.code-line:last-child { padding-bottom: 10px; }
.sw-grid { display: flex; gap: 14px; margin-top: 4px; }
.sw-col { flex: 1; }
.sw-col.strengths .qa-sublabel { color: #059669; }
.sw-col.weaknesses .qa-sublabel { color: #dc2626; }
.sw-col ul { margin: 0; padding-left: 15px; }
.sw-col li { font-size: 10.3px; color: #334155; margin-bottom: 4px; line-height: 1.5; }
.rec-box {
  background: #f3e8ff; border-radius: 6px; padding: 10px 14px; margin-top: 12px;
  page-break-inside: avoid; break-inside: avoid;
}
.rec-box .qa-sublabel { color: #7e22ce; margin-top: 0; }
.rec-box ul { margin: 0; padding-left: 15px; }
.rec-box li { font-size: 10.3px; color: #7e22ce; margin-bottom: 4px; line-height: 1.5; }

/* ── TRANSCRIPT ── */
.transcript-turn {
  margin-bottom: 14px;
  page-break-inside: avoid; break-inside: avoid;
}
.turn-label {
  font-size: 10px; font-weight: 700; color: #64748b;
  margin-bottom: 4px; display: flex; align-items: center; gap: 6px;
}
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.dot-candidate { background: #8b5cf6; }
.dot-interviewer { background: #10b981; }
.turn-box {
  background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;
  padding: 10px 14px; font-size: 10.5px; color: #334155; line-height: 1.6;
}
.turn-box.interviewer {
  background: #f0fdf4; border-color: #bbf7d0;
}

.page-footer {
  text-align: center; font-size: 7.5px; letter-spacing: 2px; color: #94a3b8;
  padding-top: 30px; text-transform: uppercase;
}

"""


# ─────────────────────────── LLM ANALYSIS PROMPT ───────────────────────────
LLM_ANALYSIS_PROMPT = """You are an expert interview evaluator for PrepAgent.

You will receive a JSON object with interview questions and candidate answers.
Analyze each answer and return ONLY valid JSON (no markdown, no explanation, no code fences).

Return this exact JSON structure:
{
  "key_takeaway": "2-4 sentence summary of performance...",
  "overall_score": 61,
  "accuracy_pct": 67,
  "dimensions": [
    {"name": "Technical (DSA)", "score": 85},
    {"name": "Behavioral", "score": 63},
    {"name": "System Design", "score": 0}
  ],
  "growth_opportunities": [
    {
      "priority": "HIGH",
      "title": "Short specific title",
      "description": "2-3 sentences referencing what actually happened..."
    }
  ],
  "study_plan": {
    "week1_title": "Close the system design gap",
    "week1_rows": [
      {"days": "1-2", "focus": "API & Identity", "activity": "Study session-based auth..."},
      {"days": "3-4", "focus": "Caching", "activity": "Cover cache-aside or write-through..."}
    ],
    "week2_title": "Integrate and simulate",
    "week2_rows": [
      {"days": "1-2", "focus": "Graph algorithms (review)", "activity": "LeetCode #743/#787..."}
    ]
  },
  "questions_analysis": [
    {
      "id": "0",
      "score": 8,
      "strengths": ["Correct priority-queue-based implementation with proper..."],
      "weaknesses": ["Did not handle negative weight edges..."],
      "recommendations": ["Note the non-negative weight assumption and refer to Bellman-Ford..."]
    }
  ]
}

RULES:
- Score each question 0-10. If no real answer was given, score 0.
- overall_score is 0-100. accuracy_pct is percentage of questions scored >= 7.
- dimension scores are 0-100 based on average of question scores in that category * 10.
- Growth opportunities: 3-5 items, HIGH priority first. Be specific to what happened.
- Study plan: concrete activities (name real topics, LeetCode problems, STAR technique).
- strengths/weaknesses: 1-4 bullet points each.
- recommendations: 1-3 specific actionable items per question.
- Never fabricate answers or quotes not in the input.
- Output ONLY the JSON object. No markdown fences. No explanation."""


def _esc(text: str) -> str:
    """HTML-escape text."""
    return html_module.escape(str(text)) if text else ""


def _bar_color(score: int) -> str:
    if score >= 70:
        return "bar-green"
    elif score >= 40:
        return "bar-amber"
    return "bar-red"


def _score_class(score: int) -> str:
    if score >= 7:
        return "score-good"
    elif score >= 4:
        return "score-mid"
    return "score-low"


def _format_date(date_str: str) -> str:
    """Format ISO date to readable format."""
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%B %d, %Y")
    except Exception:
        return date_str


def build_report_html(session_data: dict, analysis: dict, messages: list) -> str:
    """Build the complete HTML report from session data and LLM analysis.

    IMPORTANT — class naming contract:
      .cover-page    → cover only, has min-height to fill first PDF page
      .toc-section   → table of contents, plain block flow
      .content-section → every chapter body, plain block flow
      .page-break    → zero-height marker div; html2pdf.js slices before it

    Never apply .cover-page to content sections. Never add height/min-height
    or flex vertical centering to .toc-section or .content-section.
    """

    company = session_data.get("target_company") or "Not specified for this session"
    role = session_data.get("target_role") or "Software Engineer — General"
    date_str = _format_date(session_data.get("date", ""))
    questions = session_data.get("questions", [])
    q_analysis = analysis.get("questions_analysis", [])

    # Build analysis lookup
    analysis_by_id = {}
    for qa in q_analysis:
        analysis_by_id[str(qa.get("id", ""))] = qa

    # ─── COVER PAGE ───
    # Uses .cover-page (min-height to fill page). This class is NEVER reused.
    cover_html = f"""
<div class="cover-page">
  <div class="logo"><span class="logo-prep">PREP</span><span class="logo-agent">AGENT</span></div>
  <div class="cover-icon"><div class="cover-icon-bar"></div></div>
  <h1 class="cover-title">Comprehensive Assessment Report</h1>
  <p class="cover-sub">An in-depth analysis of your interview performance, strengths, and customized growth trajectory.</p>
  <div class="cover-card">
    <div class="cover-row">
      <div><div class="cover-label">TARGET COMPANY</div><div class="cover-value">{_esc(company)}</div></div>
      <div><div class="cover-label">TARGET ROLE</div><div class="cover-value">{_esc(role)}</div></div>
    </div>
    <div class="cover-divider"></div>
    <div><div class="cover-label">DATE</div><div class="cover-value">{_esc(date_str)}</div></div>
  </div>
  <div class="cover-footer">CONFIDENTIAL REPORT — PREPAGENT</div>
</div>"""

    # ─── TABLE OF CONTENTS ───
    # .page-break marker forces html2pdf.js to start a new page.
    # .toc-section is a plain block container — NO height, NO flex centering.
    toc_html = """
<div class="toc-section">
  <div class="toc-title">Table of Contents</div>
  <div class="toc-item"><span class="toc-num">01</span><span class="toc-label">Executive Summary</span></div>
  <div class="toc-item"><span class="toc-num">02</span><span class="toc-label">Growth Opportunities</span></div>
  <div class="toc-item"><span class="toc-num">03</span><span class="toc-label">Customized Study Plan</span></div>
  <div class="toc-item"><span class="toc-num">04</span><span class="toc-label">Mock Questions &amp; Analysis</span></div>
</div>"""

    # ─── CHAPTER 01: EXECUTIVE SUMMARY ───
    overall = int(session_data.get("final_score", 0)) if session_data.get("final_score") is not None else analysis.get("overall_score", 0)
    accuracy = int(session_data.get("accuracy", 0)) if session_data.get("accuracy") is not None else analysis.get("accuracy_pct", 0)
    key_takeaway = _esc(analysis.get("key_takeaway", "No analysis available."))
    time_taken = session_data.get("time_taken")

    time_metric_html = ""
    if time_taken:
        mins = int(time_taken) // 60
        secs = int(time_taken) % 60
        time_metric_html = f"""
      <div class="metric-card">
        <div class="metric-label">TIME TAKEN</div>
        <div class="metric-value">{mins}<span class="metric-sub">m</span> {secs}<span class="metric-sub">s</span></div>
      </div>"""
    else:
        time_metric_html = """
      <div class="metric-card">
        <div class="metric-label">TIME TAKEN</div>
        <div class="metric-note">Time tracking data was not available for this session.</div>
      </div>"""

    # Scale dimension scores so they don't exceed the penalized overall score
    llm_overall = analysis.get("overall_score")
    scale_factor = 1.0
    if llm_overall and llm_overall > 0 and overall > 0:
        scale_factor = overall / llm_overall
    elif overall == 0:
        scale_factor = 0.0

    # Dimension rows
    dimensions = analysis.get("dimensions", [])
    dim_rows = ""
    for dim in dimensions:
        name = _esc(dim.get("name", ""))
        raw_score = dim.get("score", 0)
        # Apply scaling factor
        score = int(round(raw_score * scale_factor))
        # Ensure it never strictly exceeds the overall score to prevent visual confusion
        score = min(score, overall)
        bar_cls = _bar_color(score)
        pct = min(score, 100)
        dim_rows += f"""
    <tr>
      <td>{name}</td>
      <td>{score} / 100</td>
      <td><div class="bar-bg"><div class="bar-fill {bar_cls}" style="width:{pct}%"></div></div></td>
    </tr>"""

    exec_summary = f"""
<div class="page-break"></div>
<div class="content-section">
  <div class="chapter-tag">CHAPTER 01</div>
  <h2 class="chapter-title">Executive Summary</h2>
  <div class="callout">
    <div class="callout-label">Key Takeaway</div>
    <div class="callout-text">{key_takeaway}</div>
  </div>
  <div class="metric-row">
    <div class="metric-card">
      <div class="metric-label">OVERALL SCORE</div>
      <div class="metric-value">{overall}<span class="metric-sub">/100</span></div>
    </div>
    <div class="metric-card">
      <div class="metric-label">ACCURACY %</div>
      <div class="metric-value">{accuracy}<span class="metric-sub">%</span></div>
    </div>
    {time_metric_html}
  </div>
  <div class="dim-note">* Color codes are standardized: high scores are highlighted green, mid-scores yellow and low scores red for fast readability.</div>
  <h3 class="section-title">Score by dimension</h3>
  <table class="dim-table">
    <tr><th>Dimension</th><th>Score</th><th></th></tr>
    {dim_rows}
  </table>
</div>"""

    # ─── CHAPTER 02: GROWTH OPPORTUNITIES ───
    growth_cards = ""
    for g in analysis.get("growth_opportunities", []):
        priority = g.get("priority", "MEDIUM")
        tag_cls = "tag-high" if priority == "HIGH" else "tag-med"
        tag_text = "HIGH PRIORITY" if priority == "HIGH" else "MEDIUM PRIORITY"
        growth_cards += f"""
    <div class="growth-card">
      <div class="growth-tag {tag_cls}">{tag_text}</div>
      <div class="growth-title">{_esc(g.get('title', ''))}</div>
      <div class="growth-desc">{_esc(g.get('description', ''))}</div>
    </div>"""

    growth_html = f"""
<div class="page-break"></div>
<div class="content-section">
  <div class="chapter-tag">CHAPTER 02</div>
  <h2 class="chapter-title">Growth Opportunities</h2>
  {growth_cards}
</div>"""

    # ─── CHAPTER 03: CUSTOMIZED STUDY PLAN ───
    sp = analysis.get("study_plan", {})

    def _plan_table(title: str, rows: list) -> str:
        r = ""
        for row in rows:
            r += f"""<tr><td>{_esc(row.get('days',''))}</td><td>{_esc(row.get('focus',''))}</td><td>{_esc(row.get('activity',''))}</td></tr>"""
        return f"""
    <div class="plan-block">
      <h3 class="section-title">{_esc(title)}</h3>
      <table class="plan-table">
        <tr><th>Days</th><th>Focus</th><th>Activity</th></tr>
        {r}
      </table>
    </div>"""

    week1 = _plan_table(
        f"Week 1 — {sp.get('week1_title', 'Foundation')}", sp.get("week1_rows", [])
    )
    week2 = _plan_table(
        f"Week 2 — {sp.get('week2_title', 'Integration')}", sp.get("week2_rows", [])
    )

    study_plan_html = f"""
<div class="page-break"></div>
<div class="content-section">
  <div class="chapter-tag">CHAPTER 03</div>
  <h2 class="chapter-title">Customized Study Plan</h2>
  <p style="font-size:11px;color:#333f5c;margin-bottom:16px;">A focused two-week roadmap to address your largest gaps while reinforcing existing strengths.</p>
  {week1}
  {week2}
</div>"""

    # ─── CHAPTER 04: MOCK QUESTIONS & ANALYSIS ───
    qa_cards = ""
    for idx, q in enumerate(questions):
        qid = str(q.get("id", idx))
        qa = analysis_by_id.get(qid, {})
        score = qa.get("score", 0)
        score_cls = _score_class(score)
        category = _esc(q.get("category", "DSA"))
        subcategory = _esc(q.get("subcategory", "General"))
        q_text = _esc(q.get("question_text", ""))
        answer = q.get("candidate_answer", "No answer provided.")
        answer_type = q.get("answer_type", "text")

        # Short label for header
        short_label = q_text[:60] + "..." if len(q_text) > 60 else q_text

        # Answer block
        if answer_type == "code":
            lines = _esc(answer).split("\n")
            line_html = "".join(f'<div class="code-line">{line if line else " "}</div>' for line in lines)
            answer_html = f'<div class="qa-code-container">{line_html}</div>'
        else:
            answer_html = f'<p class="qa-answer-text">{_esc(answer)}</p>'

        # Strengths
        strengths_lis = "".join(f"<li>{_esc(s)}</li>" for s in qa.get("strengths", []))
        weaknesses_lis = "".join(f"<li>{_esc(w)}</li>" for w in qa.get("weaknesses", []))
        rec_lis = "".join(f"<li>{_esc(r)}</li>" for r in qa.get("recommendations", []))

        qa_cards += f"""
    <div class="qa-card">
      <div class="qa-head">
        <div class="qa-title">Q{idx+1} &middot; {category} &middot; {subcategory}</div>
        <div class="qa-score {score_cls}">{score} / 10</div>
      </div>
      <div class="qa-body">
        <div class="qa-sublabel">QUESTION</div>
        <p class="qa-question-text">{q_text}</p>
        <div class="qa-sublabel">CANDIDATE'S ANSWER</div>
        {answer_html}
        <div class="sw-grid">
          <div class="sw-col strengths">
            <div class="qa-sublabel">STRENGTHS</div>
            <ul>{strengths_lis if strengths_lis else '<li style="color:#8189a0">No notable strengths identified</li>'}</ul>
          </div>
          <div class="sw-col weaknesses">
            <div class="qa-sublabel">WEAKNESSES</div>
            <ul>{weaknesses_lis if weaknesses_lis else '<li style="color:#8189a0">N/A</li>'}</ul>
          </div>
        </div>
        <div class="rec-box">
          <div class="qa-sublabel">RECOMMENDATIONS TO SCORE HIGHER</div>
          <ul>{rec_lis if rec_lis else '<li>Review the core concepts for this topic</li>'}</ul>
        </div>
      </div>
    </div>"""

    qa_html = f"""
<div class="page-break"></div>
<div class="content-section">
  <div class="chapter-tag">CHAPTER 04</div>
  <h2 class="chapter-title">Mock Questions &amp; Analysis</h2>
  {qa_cards}
</div>"""

    # ─── CHAPTER 05: COMPLETE INTERVIEW TRANSCRIPT ───
    transcript_turns = ""
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        if not content or not content.strip():
            continue

        if role == "user":
            label = "Candidate"
            dot_cls = "dot-candidate"
            box_cls = ""
        else:
            label = "Interviewer"
            dot_cls = "dot-interviewer"
            box_cls = " interviewer"

        # Check if content looks like code
        is_code = any(kw in content for kw in ["{", "class ", "def ", "public ", "import ", "function "])

        if is_code and role == "user":
            content_html = f'<pre class="qa-code">{_esc(content)}</pre>'
        else:
            content_html = f'<div class="turn-box{box_cls}">{_esc(content)}</div>'

        transcript_turns += f"""
    <div class="transcript-turn">
      <div class="turn-label"><span class="dot {dot_cls}"></span>{label}</div>
      {content_html}
    </div>"""

    transcript_html = f"""
<div class="page-break"></div>
<div class="content-section">
  <div class="chapter-tag">CHAPTER 05</div>
  <h2 class="chapter-title">Complete Interview Transcript</h2>
  {transcript_turns}
</div>"""

    # ─── ASSEMBLE FULL DOCUMENT ───
    html_doc = f"""<style>
{REPORT_CSS}
</style>
<div class="report-wrapper">{cover_html}{toc_html}{exec_summary}{growth_html}{study_plan_html}{qa_html}</div>
"""
    return html_doc
