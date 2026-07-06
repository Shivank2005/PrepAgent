"""
PrepAgent Report Template — Hardcoded HTML/CSS builder.

The LLM returns structured JSON analysis. This module injects that data
into a pixel-perfect HTML template that matches the reference design.
"""
import html as html_module
from datetime import datetime


# ─────────────────────────── CSS ───────────────────────────
REPORT_CSS = """
/* ── PAGE SETUP ── */
.report-wrapper {
  font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
  color: #1c2536; margin: 0; font-size: 11.5px; line-height: 1.55;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
  background-color: #ffffff;
  text-align: left;
}
.report-wrapper * { box-sizing: border-box; margin: 0; padding: 0; }

/* ── COVER PAGE ── */
/* ── COVER PAGE ── */
.cover {
  height: 1040px; overflow: hidden;
  background: linear-gradient(160deg, #0b1230 0%, #16215a 55%, #1c2b74 100%);
  color: #fff; padding: 50px 45px; position: relative;
  border-radius: 20px;
}
.logo { font-size: 20px; font-weight: 700; }
.logo-prep { color: #fff; }
.logo-agent { color: #6f8cff; }
.cover-icon {
  width: 48px; height: 48px; background: rgba(47,75,214,0.35);
  border-radius: 12px; display: flex; align-items: center; justify-content: center;
  margin-top: 60px; margin-bottom: 10px;
}
.cover-icon-bar { width: 22px; height: 3px; background: #8fa8ff; border-radius: 2px; }
h1.cover-title {
  font-size: 38px; font-weight: 800; line-height: 1.15;
  margin: 20px 0 16px 0; max-width: 460px;
}
.cover-sub {
  font-size: 13.5px; color: #b7c1e0; max-width: 420px; margin-bottom: 50px; line-height: 1.6;
}
.cover-card {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px; padding: 26px 30px; max-width: 480px;
}
.cover-row { display: flex; gap: 40px; margin-bottom: 14px; }
.cover-label {
  font-size: 8.5px; letter-spacing: 1.5px; color: #8fa0d0;
  font-weight: 700; margin-bottom: 6px; text-transform: uppercase;
}
.cover-value { font-size: 15px; font-weight: 700; color: #fff; }
.cover-divider { border-top: 1px solid rgba(255,255,255,0.15); margin: 6px 0 14px 0; }
.cover-footer {
  position: absolute; bottom: 40px; left: 45px; right: 45px;
  text-align: center; font-size: 7.5px; letter-spacing: 2px; color: #6070a0;
  text-transform: uppercase;
}

/* ── TABLE OF CONTENTS ── */
.toc-page {
  height: 1040px; overflow: hidden; page-break-before: always; padding: 30px 20px;
  background: #ffffff;
}
.toc-title { font-size: 26px; font-weight: 800; margin: 0 0 30px 0; color: #1c2536; }
.toc-item {
  display: flex; gap: 14px; align-items: center;
  padding: 16px 12px; border-bottom: 1px dashed #d6dae4;
  background: rgba(234,240,254,0.35); border-radius: 6px; margin-bottom: 4px;
}
.toc-num { color: #2f4bd6; font-weight: 700; font-size: 13px; min-width: 22px; }
.toc-label { font-size: 14px; font-weight: 600; color: #222c42; }

/* ── CHAPTERS ── */
.chapter {
  padding: 30px 20px;
  background: #fff; page-break-before: always;
}
.chapter-tag {
  font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #2f4bd6;
  margin-bottom: 8px; text-transform: uppercase;
}
h2.chapter-title { font-size: 24px; font-weight: 800; margin: 0 0 22px 0; color: #1c2536; }
h3.section-title { font-size: 15px; font-weight: 700; margin: 26px 0 10px 0; color: #1c2536; }

/* ── KEY TAKEAWAY CALLOUT ── */
.callout {
  background: #eaf0fe; border-left: 4px solid #2f4bd6; border-radius: 6px;
  padding: 16px 18px; margin-bottom: 26px;
}
.callout-label { font-size: 12px; font-weight: 700; color: #24327a; margin-bottom: 6px; }
.callout-text { font-size: 11px; color: #2a3658; line-height: 1.65; }

/* ── METRIC CARDS ── */
.metric-row { display: flex; gap: 16px; margin-bottom: 16px; }
.metric-card {
  flex: 1; border: 1px solid #e1e4ec; border-radius: 10px;
  padding: 20px 14px; text-align: center; background: #fff;
}
.metric-label {
  font-size: 9px; letter-spacing: 1px; color: #8189a0;
  font-weight: 700; margin-bottom: 10px; text-transform: uppercase;
}
.metric-value { font-size: 28px; font-weight: 800; color: #1c2536; }
.metric-sub { font-size: 14px; font-weight: 400; color: #8189a0; }
.metric-note { font-size: 9.5px; color: #8189a0; font-style: italic; margin-top: 6px; }
.dim-note { font-size: 9px; color: #8189a0; font-style: italic; margin: 6px 0 16px 0; }

/* ── DIMENSION TABLE ── */
table.dim-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
table.dim-table th {
  background: #f0f2f8; text-align: left; font-size: 9.5px;
  color: #5a6178; padding: 8px 10px; font-weight: 700;
}
table.dim-table td { padding: 9px 10px; font-size: 11px; border-bottom: 1px solid #edeff5; }
.bar-bg {
  background: #eceef4; border-radius: 4px; height: 8px; width: 140px;
  overflow: hidden; display: inline-block; vertical-align: middle;
}
.bar-fill { height: 8px; border-radius: 4px; display: block; }
.bar-green { background: #227a4a; }
.bar-amber { background: #b3760f; }
.bar-red   { background: #b23a3a; }

/* ── GROWTH OPPORTUNITY CARDS ── */
.growth-card {
  border: 1px solid #e1e4ec; border-radius: 10px; padding: 16px 18px;
  margin-bottom: 14px; background: #fff;
}
.growth-title { font-size: 13px; font-weight: 700; margin-bottom: 4px; color: #1c2536; }
.growth-desc { font-size: 10.5px; color: #333f5c; line-height: 1.6; }
.growth-tag {
  display: inline-block; font-size: 8.5px; font-weight: 700; letter-spacing: 0.5px;
  padding: 2px 8px; border-radius: 10px; margin-bottom: 8px; text-transform: uppercase;
}
.tag-high { background: #fdeaea; color: #b23a3a; }
.tag-med  { background: #fef3e0; color: #b3760f; }

/* ── STUDY PLAN TABLES ── */
table.plan-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
table.plan-table th {
  background: #131a2c; color: #fff; text-align: left;
  padding: 9px 10px; font-size: 10px; font-weight: 600;
}
table.plan-table td {
  padding: 9px 10px; font-size: 10.5px; border-bottom: 1px solid #edeff5;
  vertical-align: top; color: #333f5c;
}
table.plan-table tr:nth-child(even) td { background: #f9fafc; }

/* ── Q&A ANALYSIS CARDS ── */
.qa-card {
  border: 1px solid #e1e4ec; border-radius: 10px; margin-bottom: 22px;
  overflow: hidden; page-break-inside: avoid;
}
.qa-head {
  background: #131a2c; padding: 10px 16px; display: flex;
  justify-content: space-between; align-items: center;
}
.qa-title { font-size: 12px; font-weight: 700; color: #fff; }
.qa-score {
  font-size: 12px; font-weight: 800; padding: 2px 10px; border-radius: 10px;
  background: rgba(255,255,255,0.12);
}
.score-good { color: #8fe3ae; }
.score-mid  { color: #f5c876; }
.score-low  { color: #f29a9a; }
.qa-body { padding: 14px 16px; }
.qa-sublabel {
  font-size: 9px; letter-spacing: 1px; font-weight: 700; color: #8189a0;
  margin: 12px 0 6px 0; text-transform: uppercase;
}
.qa-sublabel:first-child { margin-top: 0; }
.qa-question-text { font-size: 11px; font-style: italic; margin: 0; color: #333f5c; }
.qa-answer-text { font-size: 10.8px; color: #333f5c; margin: 0; line-height: 1.6; }
pre.qa-code {
  background: #131a2c; color: #d8dcea; border-radius: 6px; padding: 10px 12px;
  font-family: 'Courier New', monospace; font-size: 8.3px; line-height: 1.45;
  white-space: pre-wrap; word-wrap: break-word; margin: 0;
}
.sw-grid { display: flex; gap: 14px; margin-top: 4px; }
.sw-col { flex: 1; }
.sw-col.strengths .qa-sublabel { color: #227a4a; }
.sw-col.weaknesses .qa-sublabel { color: #b23a3a; }
.sw-col ul { margin: 0; padding-left: 15px; }
.sw-col li { font-size: 10.3px; color: #333f5c; margin-bottom: 4px; line-height: 1.5; }
.rec-box {
  background: #eaf0fe; border-radius: 6px; padding: 10px 14px; margin-top: 12px;
}
.rec-box .qa-sublabel { color: #24327a; margin-top: 0; }
.rec-box ul { margin: 0; padding-left: 15px; }
.rec-box li { font-size: 10.3px; color: #24327a; margin-bottom: 4px; line-height: 1.5; }

/* ── PAGE FOOTER ── */
.page-footer {
  text-align: center; font-size: 7.5px; letter-spacing: 2px; color: #9aa5b8;
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
    """Build the complete HTML report from session data and LLM analysis."""

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
    cover_html = f"""
<div class="cover">
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
    toc_html = """
<div class="toc-page">
  <div class="toc-title">Table of Contents</div>
  <div class="toc-item"><span class="toc-num">01</span><span class="toc-label">Executive Summary</span></div>
  <div class="toc-item"><span class="toc-num">02</span><span class="toc-label">Growth Opportunities</span></div>
  <div class="toc-item"><span class="toc-num">03</span><span class="toc-label">Customized Study Plan</span></div>
  <div class="toc-item"><span class="toc-num">04</span><span class="toc-label">Mock Questions &amp; Analysis</span></div>
</div>"""

    # ─── CHAPTER 01: EXECUTIVE SUMMARY ───
    overall = analysis.get("overall_score", 0)
    accuracy = analysis.get("accuracy_pct", 0)
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

    # Dimension rows
    dimensions = analysis.get("dimensions", [])
    dim_rows = ""
    for dim in dimensions:
        name = _esc(dim.get("name", ""))
        score = dim.get("score", 0)
        bar_cls = _bar_color(score)
        pct = min(score, 100)
        dim_rows += f"""
    <tr>
      <td>{name}</td>
      <td>{score} / 100</td>
      <td><div class="bar-bg"><div class="bar-fill {bar_cls}" style="width:{pct}%"></div></div></td>
    </tr>"""

    exec_summary = f"""
<div class="chapter">
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
<div class="chapter">
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
    <h3 class="section-title">{_esc(title)}</h3>
    <table class="plan-table">
      <tr><th>Days</th><th>Focus</th><th>Activity</th></tr>
      {r}
    </table>"""

    week1 = _plan_table(
        f"Week 1 — {sp.get('week1_title', 'Foundation')}", sp.get("week1_rows", [])
    )
    week2 = _plan_table(
        f"Week 2 — {sp.get('week2_title', 'Integration')}", sp.get("week2_rows", [])
    )

    study_plan_html = f"""
<div class="chapter">
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
            answer_html = f'<pre class="qa-code">{_esc(answer)}</pre>'
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
<div class="chapter">
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
<div class="chapter">
  <div class="chapter-tag">CHAPTER 05</div>
  <h2 class="chapter-title">Complete Interview Transcript</h2>
  {transcript_turns}
</div>"""

    # ─── ASSEMBLE FULL DOCUMENT ───
    html_parts = {
        "cover": cover_html,
        "toc": toc_html,
        "exec_summary": exec_summary,
        "growth": growth_html,
        "study_plan": study_plan_html,
        "questions": qa_html
    }
    html_doc = f"""
<style>
{REPORT_CSS}
</style>
<div class="report-wrapper">
  {html_parts["cover"]}
  {html_parts["toc"]}
  {html_parts["exec_summary"]}
  {html_parts["growth"]}
  {html_parts["study_plan"]}
  {html_parts["questions"]}
</div>
"""
    return html_doc
