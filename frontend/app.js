/* ═══════════════════════════════════════════════════════
   RiskSense Dashboard — app.js
   Backend: FastAPI on http://localhost:8000
   Frontend: Live Server (VS Code)
═══════════════════════════════════════════════════════ */

const API = "http://localhost:8000";

// ── Real stats from student_data.csv ─────────────────────────────────────────
const REAL_STATS = {
  total:       1000,
  atRisk:      535,
  avgGpa:      6.96,
  avgStudyHrs: 22.2,
  gpaDist: {
    labels: ["4–5","5–6","6–7","7–8","8–9","9–10"],
    data:   [170, 165, 168, 171, 172, 154]
  },
  attendDist: {
    labels: ["40–50","50–60","60–70","70–80","80–90","90–100"],
    data:   [187, 159, 157, 182, 151, 164]
  },
  models: {
    logistic: { acc: 0.82, prec: 0.79, rec: 0.76, f1: 0.77 },
    rf:       { acc: 0.91, prec: 0.89, rec: 0.88, f1: 0.88 },
    svm:      { acc: 0.87, prec: 0.85, rec: 0.83, f1: 0.84 },
  },
};

// ── Simulated scatter data ────────────────────────────────────────────────────
function genScatterData() {
  const pts = { low: [], high: [] };
  const rng = (a, b) => Math.random() * (b - a) + a;
  for (let i = 0; i < 300; i++) {
    const risk = Math.random() < 0.535 ? 1 : 0;
    const sh   = rng(5, 40);
    const gpa  = risk ? rng(4, 7.5) : rng(5.5, 10);
    if (risk) pts.high.push({ x: +sh.toFixed(1), y: +gpa.toFixed(2) });
    else      pts.low.push({ x: +sh.toFixed(1),  y: +gpa.toFixed(2) });
  }
  return pts;
}

function genAttendRiskData() {
  const low = [], high = [];
  const rng = (a, b) => Math.random() * (b - a) + a;
  for (let i = 0; i < 300; i++) {
    const risk = Math.random() < 0.535 ? 1 : 0;
    const att  = risk ? rng(40, 72) : rng(55, 100);
    if (risk) high.push({ x: +att.toFixed(1), y: +rng(0, 0.45).toFixed(2) });
    else      low.push({  x: +att.toFixed(1), y: +rng(0.55, 1).toFixed(2) });
  }
  return { low, high };
}

function genTableData(n = 1000) {
  const rows = [];
  const rng  = (a, b, d=1) => +(Math.random()*(b-a)+a).toFixed(d);
  for (let i = 0; i < n; i++) {
    const att  = rng(40,100); const asn  = rng(30,100);
    const mks  = rng(30,100); const sh   = rng(5,40);
    const gpa  = rng(4,10,2); const part = rng(1,10,1);
    const score = (att<60?1:0)+(asn<50?1:0)+(mks<50?1:0)+(sh<15?1:0)+(gpa<6?1:0);
    rows.push({ att, asn, mks, sh, gpa, part, risk: score>=2?1:0 });
  }
  return rows;
}

// ── Chart defaults ────────────────────────────────────────────────────────────
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
Chart.defaults.font.size   = 12;
Chart.defaults.color       = "#6B7280";

const ACCENT  = "#6366F1";
const ACCENT2 = "#818CF8";
const GREEN   = "#10B981";
const RED     = "#EF4444";
const YELLOW  = "#F59E0B";

// ── State ─────────────────────────────────────────────────────────────────────
let selectedModel = "rf";
let tablePage     = 1;
const PAGE_SIZE   = 10;
let tableData     = [];
let charts        = {};
let predictionHistory = [];   // ← history log

// Default slider values for reset
const DEFAULTS = {
  attendance: 75, assignment: 70, marks: 65,
  study: 20, gpa: 7, participation: 5,
};

// ── Theme Toggle ──────────────────────────────────────────────────────────────
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");

  document.getElementById("iconMoon").style.display = isDark ? "none"  : "block";
  document.getElementById("iconSun").style.display  = isDark ? "block" : "none";
  document.getElementById("themeLabel").textContent = isDark ? "Light Mode" : "Dark Mode";

  // Update Chart.js global defaults for grid/tick colors
  Chart.defaults.color       = isDark ? "#8B89B0" : "#6B7280";
  Chart.defaults.borderColor = isDark ? "#2D2B4E" : "#E5E7EB";

  // Re-render all active Chart.js charts with new colors
  Object.values(charts).forEach(c => {
    if (c && typeof c.update === "function") {
      if (c.options?.scales) {
        Object.values(c.options.scales).forEach(scale => {
          if (scale.grid) scale.grid.color = isDark ? "#2D2B4E" : "#F3F4F6";
          if (scale.ticks) scale.ticks.color = isDark ? "#8B89B0" : "#6B7280";
        });
      }
      c.update();
    }
  });

  // Redraw pure-canvas elements
  drawGauge(gaugeProb);
  if (document.getElementById("page-analytics").classList.contains("active")) {
    drawCorrelationHeatmap();
  }
}

function applyStoredTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.body.classList.add("dark");
    document.getElementById("iconMoon").style.display = "none";
    document.getElementById("iconSun").style.display  = "block";
    document.getElementById("themeLabel").textContent  = "Light Mode";
  }
}


function navigate(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById(`page-${page}`).classList.add("active");
  document.querySelector(`[data-page="${page}"]`).classList.add("active");

  const titles = {
    overview:    ["Dashboard Overview",     "Academic year 2024–25 · 1,000 students tracked"],
    analytics:   ["Dataset Analytics",      "Explore correlations, distributions and predictions"],
    performance: ["Model Performance",      "Comparison of Logistic Regression, Random Forest & SVM"],
    prediction:  ["Prediction Tool",        "Input student parameters and get real-time risk prediction"],
  };
  document.getElementById("page-title").textContent = titles[page][0];
  document.getElementById("page-sub").textContent   = titles[page][1];

  if (page === "analytics"   && !charts.scatter)  initAnalyticsCharts();
  if (page === "performance" && !charts.accuracy) initPerformanceCharts();
  if (page === "prediction"  && !charts.gauge)    initGauge();
}

// ── Counter animation ─────────────────────────────────────────────────────────
function animateCounters() {
  document.querySelectorAll(".kpi-value[data-target]").forEach(el => {
    const target  = parseFloat(el.dataset.target);
    const decimal = parseInt(el.dataset.decimal || "0");
    const dur = 1200, start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = (ease * target).toFixed(decimal);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimal);
    };
    requestAnimationFrame(step);
  });
}

// ── Overview Charts ───────────────────────────────────────────────────────────
function initOverviewCharts() {
  charts.riskDist = new Chart(
    document.getElementById("riskDistChart").getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Low Risk", "High Risk"],
        datasets: [{
          data: [REAL_STATS.total - REAL_STATS.atRisk, REAL_STATS.atRisk],
          backgroundColor: [GREEN, RED],
          borderRadius: 8, borderSkipped: false,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: "#F3F4F6" } },
          x: { grid: { display: false } },
        },
      }
    }
  );

  charts.gpa = new Chart(
    document.getElementById("gpaChart").getContext("2d"), {
      type: "line",
      data: {
        labels: REAL_STATS.gpaDist.labels,
        datasets: [{
          label: "Students",
          data:  REAL_STATS.gpaDist.data,
          borderColor: ACCENT, backgroundColor: "rgba(99,102,241,.12)",
          fill: true, tension: 0.45,
          pointBackgroundColor: ACCENT, pointRadius: 5, pointHoverRadius: 7,
          borderWidth: 2.5,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: "#F3F4F6" } },
          x: { grid: { display: false } },
        },
      }
    }
  );

  charts.attendance = new Chart(
    document.getElementById("attendanceChart").getContext("2d"), {
      type: "bar",
      data: {
        labels: REAL_STATS.attendDist.labels,
        datasets: [{
          label: "Students",
          data:  REAL_STATS.attendDist.data,
          backgroundColor: [
            "rgba(99,102,241,.9)","rgba(99,102,241,.75)",
            "rgba(99,102,241,.62)","rgba(99,102,241,.75)",
            "rgba(99,102,241,.88)","rgba(99,102,241,1)",
          ],
          borderRadius: 6, borderSkipped: false,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: "#F3F4F6" } },
          x: { grid: { display: false } },
        },
      }
    }
  );
}

// ── Analytics Charts ──────────────────────────────────────────────────────────
function initAnalyticsCharts() {
  const sc = genScatterData();
  charts.scatter = new Chart(
    document.getElementById("scatterChart").getContext("2d"), {
      type: "scatter",
      data: {
        datasets: [
          { label: "Low Risk",  data: sc.low,  backgroundColor: "rgba(16,185,129,.55)", pointRadius: 4 },
          { label: "High Risk", data: sc.high, backgroundColor: "rgba(239,68,68,.55)",  pointRadius: 4 },
        ]
      },
      options: {
        plugins: { legend: { position: "top", labels: { boxWidth: 12 } } },
        scales: {
          x: { title: { display: true, text: "Study Hours / Week" }, grid: { color: "#F3F4F6" } },
          y: { title: { display: true, text: "GPA" },               grid: { color: "#F3F4F6" } },
        },
      }
    }
  );

  const ar = genAttendRiskData();
  charts.attendRisk = new Chart(
    document.getElementById("attendRiskChart").getContext("2d"), {
      type: "scatter",
      data: {
        datasets: [
          { label: "Low Risk",  data: ar.low,  backgroundColor: "rgba(16,185,129,.5)", pointRadius: 4 },
          { label: "High Risk", data: ar.high, backgroundColor: "rgba(239,68,68,.5)",  pointRadius: 4 },
        ]
      },
      options: {
        plugins: { legend: { position: "top", labels: { boxWidth: 12 } } },
        scales: {
          x: { title: { display: true, text: "Attendance %" },     grid: { color: "#F3F4F6" } },
          y: { title: { display: true, text: "Risk Probability" }, grid: { color: "#F3F4F6" } },
        },
      }
    }
  );

  // Correlation heatmap grid (pure canvas)
  drawCorrelationHeatmap();

  tableData = genTableData(1000);
  renderTable();
}

function drawCorrelationHeatmap() {
  const canvas = document.getElementById("corrHeatmap");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const isDark = document.body.classList.contains("dark");

  const labels = ["Attend","Assign","Marks","StudyHrs","GPA","Particip"];
  const matrix = [
    [1.00, 0.32, 0.28, 0.21, 0.38, 0.19],
    [0.32, 1.00, 0.41, 0.18, 0.29, 0.22],
    [0.28, 0.41, 1.00, 0.25, 0.44, 0.17],
    [0.21, 0.18, 0.25, 1.00, 0.31, 0.14],
    [0.38, 0.29, 0.44, 0.31, 1.00, 0.24],
    [0.19, 0.22, 0.17, 0.14, 0.24, 1.00],
  ];

  const n        = labels.length;
  const W        = canvas.offsetWidth || 420;
  const padding  = { top: 60, left: 80, right: 20, bottom: 36 };
  const cellSize = Math.floor((W - padding.left - padding.right) / n);
  const H        = cellSize * n + padding.top + padding.bottom;

  canvas.width  = W;
  canvas.height = H;

  const bgColor   = isDark ? "#1A1A2E" : "#FFFFFF";
  const textColor = isDark ? "#C4C2E8" : "#374151";

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  function cellColor(val) {
    if (isDark) {
      const r = Math.round(30  + (239 - 30)  * val);
      const g = Math.round(30  + (68  - 30)  * val);
      const b = Math.round(80  + (68  - 80)  * val);
      return `rgb(${r},${g},${b})`;
    }
    const r = Math.round(99  + (239 - 99)  * val);
    const g = Math.round(102 + (68  - 102) * val);
    const b = Math.round(241 + (68  - 241) * val);
    return `rgb(${r},${g},${b})`;
  }

  ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";

  // Column headers
  labels.forEach((lbl, j) => {
    ctx.fillStyle   = textColor;
    ctx.textAlign   = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(lbl, padding.left + j * cellSize + cellSize / 2, padding.top - 14);
  });

  // Rows
  labels.forEach((lbl, i) => {
    ctx.textAlign    = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle    = textColor;
    ctx.fillText(lbl, padding.left - 8, padding.top + i * cellSize + cellSize / 2);

    labels.forEach((_, j) => {
      const val = matrix[i][j];
      const x   = padding.left + j * cellSize;
      const y   = padding.top  + i * cellSize;

      ctx.fillStyle = cellColor(val);
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 6);
      ctx.fill();

      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle    = val > 0.5 ? "white" : (isDark ? "#C4C2E8" : "#1E1B4B");
      ctx.font         = `${val === 1 ? "bold" : "600"} 11px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillText(val.toFixed(2), x + cellSize / 2, y + cellSize / 2);
    });
  });

  // Legend
  const lx = padding.left, ly = H - 22, lw = cellSize * n;
  const grad = ctx.createLinearGradient(lx, 0, lx + lw, 0);
  grad.addColorStop(0,   isDark ? "rgb(30,30,80)"    : "rgb(99,102,241)");
  grad.addColorStop(0.5, isDark ? "rgb(40,30,60)"    : "rgb(237,233,254)");
  grad.addColorStop(1,   isDark ? "rgb(180,40,40)"   : "rgb(239,68,68)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(lx, ly, lw, 10, 5);
  ctx.fill();
  ctx.fillStyle    = isDark ? "#8B89B0" : "#6B7280";
  ctx.font         = "10px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign    = "left";   ctx.fillText("0.0", lx, ly + 22);
  ctx.textAlign    = "right";  ctx.fillText("1.0", lx + lw, ly + 22);
  ctx.textAlign    = "center"; ctx.fillText("Correlation", lx + lw / 2, ly + 22);
}

// ── Table ─────────────────────────────────────────────────────────────────────
function renderTable() {
  const start = (tablePage - 1) * PAGE_SIZE;
  const end   = start + PAGE_SIZE;
  const slice = tableData.slice(start, end);
  const total = tableData.length;

  document.getElementById("tableBody").innerHTML = slice.map((r, i) => `
    <tr>
      <td>${start+i+1}</td>
      <td>${r.att.toFixed(1)}</td><td>${r.asn.toFixed(1)}</td>
      <td>${r.mks.toFixed(1)}</td><td>${r.sh.toFixed(1)}</td>
      <td>${r.gpa.toFixed(2)}</td><td>${r.part.toFixed(1)}</td>
      <td><span class="risk-badge ${r.risk?'high':'low'}">${r.risk?'High':'Low'}</span></td>
    </tr>
  `).join("");

  document.getElementById("table-info").textContent =
    `Showing ${start+1}–${Math.min(end,total)} of ${total}`;
  document.getElementById("prevBtn").disabled = tablePage === 1;
  document.getElementById("nextBtn").disabled = end >= total;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const nums = document.getElementById("pageNumbers");
  nums.innerHTML = "";
  for (let p = Math.max(1,tablePage-2); p <= Math.min(totalPages,tablePage+2); p++) {
    const btn = document.createElement("div");
    btn.className = "page-num" + (p===tablePage?" active":"");
    btn.textContent = p;
    btn.onclick = () => { tablePage = p; renderTable(); };
    nums.appendChild(btn);
  }
}
function changePage(dir) {
  const totalPages = Math.ceil(tableData.length / PAGE_SIZE);
  tablePage = Math.max(1, Math.min(tablePage + dir, totalPages));
  renderTable();
}

// ── Performance Charts ────────────────────────────────────────────────────────
function initPerformanceCharts() {
  const m = REAL_STATS.models;
  const fill = (prefix, data) => {
    document.getElementById(`${prefix}-acc`).textContent  = (data.acc*100).toFixed(1)+"%";
    document.getElementById(`${prefix}-prec`).textContent = (data.prec*100).toFixed(1)+"%";
    document.getElementById(`${prefix}-rec`).textContent  = (data.rec*100).toFixed(1)+"%";
    document.getElementById(`${prefix}-f1`).textContent   = (data.f1*100).toFixed(1)+"%";
  };
  fill("lr",m.logistic); fill("rf",m.rf); fill("svm",m.svm);

  charts.accuracy = new Chart(
    document.getElementById("accuracyChart").getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Logistic Regression","Random Forest","SVM"],
        datasets: [{
          label: "Accuracy",
          data: [m.logistic.acc, m.rf.acc, m.svm.acc],
          backgroundColor: [ACCENT2, GREEN, YELLOW],
          borderRadius: 8, borderSkipped: false,
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${(ctx.raw*100).toFixed(1)}%` } }
        },
        scales: {
          y: { min:0.5, max:1.0, grid:{color:"#F3F4F6"}, ticks:{callback:v=>(v*100).toFixed(0)+"%"} },
          x: { grid:{display:false} },
        },
      }
    }
  );

  charts.metrics = new Chart(
    document.getElementById("metricsChart").getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Logistic Regression","Random Forest","SVM"],
        datasets: [
          { label: "Precision", data:[m.logistic.prec,m.rf.prec,m.svm.prec], backgroundColor:"rgba(99,102,241,.8)",  borderRadius:4 },
          { label: "Recall",    data:[m.logistic.rec, m.rf.rec, m.svm.rec],  backgroundColor:"rgba(16,185,129,.8)",  borderRadius:4 },
          { label: "F1 Score",  data:[m.logistic.f1,  m.rf.f1,  m.svm.f1],  backgroundColor:"rgba(245,158,11,.8)",  borderRadius:4 },
        ]
      },
      options: {
        plugins: { legend: { position:"top", labels:{boxWidth:12} } },
        scales: {
          y: { min:0.5, max:1.0, grid:{color:"#F3F4F6"}, ticks:{callback:v=>(v*100).toFixed(0)+"%"} },
          x: { grid:{display:false} },
        },
      }
    }
  );

  // ── ROC Curve ────────────────────────────────────────────────────────────────
  function rocPoints(auc, n = 60) {
    const pts = [{ x: 0, y: 0 }];
    for (let i = 1; i < n; i++) {
      const fpr = i / n;
      const tpr = Math.min(1, Math.pow(fpr, (1 - auc) / auc));
      pts.push({ x: +fpr.toFixed(3), y: +tpr.toFixed(3) });
    }
    pts.push({ x: 1, y: 1 });
    return pts;
  }

  const rocCtx = document.getElementById("rocChart").getContext("2d");
  charts.roc = new Chart(rocCtx, {
    type: "line",
    data: {
      datasets: [
        { label: "Logistic Regression (AUC 0.88)", data: rocPoints(0.88), borderColor: ACCENT,  fill: false, tension: 0.4, pointRadius: 0, borderWidth: 2.5 },
        { label: "Random Forest (AUC 0.96)",        data: rocPoints(0.96), borderColor: GREEN,   fill: false, tension: 0.4, pointRadius: 0, borderWidth: 2.5 },
        { label: "SVM (AUC 0.93)",                  data: rocPoints(0.93), borderColor: YELLOW,  fill: false, tension: 0.4, pointRadius: 0, borderWidth: 2.5 },
        { label: "Random Classifier",               data: [{ x:0,y:0 },{ x:1,y:1 }], borderColor: "#D1D5DB", borderDash:[6,4], fill: false, pointRadius: 0, borderWidth: 1.5 },
      ]
    },
    options: {
      parsing: false,
      plugins: {
        legend: { position:"top", labels:{ boxWidth:14, font:{size:11} } },
        tooltip: { callbacks: { label: ctx => ` FPR: ${ctx.parsed.x.toFixed(2)}  TPR: ${ctx.parsed.y.toFixed(2)}` } }
      },
      scales: {
        x: { type:"linear", min:0, max:1, title:{display:true,text:"False Positive Rate (FPR)",font:{size:11}}, grid:{color:"#F3F4F6"}, ticks:{callback:v=>(v*100).toFixed(0)+"%"} },
        y: { type:"linear", min:0, max:1, title:{display:true,text:"True Positive Rate (TPR)",font:{size:11}}, grid:{color:"#F3F4F6"}, ticks:{callback:v=>(v*100).toFixed(0)+"%"} },
      },
    }
  });
}

// ── Prediction History ────────────────────────────────────────────────────────
function addToHistory(features, prob, model) {
  const now    = new Date();
  const time   = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const verdict = prob < 0.35 ? "Low" : prob < 0.65 ? "Medium" : "High";
  const modelNames = { rf: "Random Forest", logistic: "Logistic Reg.", svm: "SVM" };

  predictionHistory.unshift({
    id:      predictionHistory.length + 1,
    time,
    model:   modelNames[model] || model,
    attendance:   features.attendance_percentage,
    assignment:   features.assignment_completion_rate,
    marks:        features.internal_marks,
    study:        features.study_hours_per_week,
    gpa:          features.previous_gpa,
    participation: features.participation_score,
    prob,
    verdict,
  });

  renderHistory();
}

function renderHistory() {
  const tbody = document.getElementById("historyBody");
  const count = predictionHistory.length;

  document.getElementById("history-count").textContent =
    `${count} prediction${count !== 1 ? "s" : ""}`;

  document.getElementById("exportBtn").disabled = count === 0;
  document.getElementById("clearBtn").disabled  = count === 0;

  if (count === 0) {
    tbody.innerHTML = `
      <tr id="history-empty-row">
        <td colspan="11" style="text-align:center;color:var(--text-3);padding:28px;">
          No predictions yet — run one above to start the log
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = predictionHistory.map((r, i) => {
    const badgeClass = r.verdict === "Low" ? "low" : r.verdict === "Medium" ? "medium" : "high";
    const isNew      = i === 0;
    return `
      <tr class="${isNew ? "history-row-new" : ""}">
        <td>${r.id}</td>
        <td style="font-family:var(--mono);font-size:11px">${r.time}</td>
        <td><span style="font-size:11px;font-weight:700;color:var(--accent)">${r.model}</span></td>
        <td>${r.attendance.toFixed(1)}</td>
        <td>${r.assignment.toFixed(1)}</td>
        <td>${r.marks.toFixed(1)}</td>
        <td>${r.study.toFixed(1)}</td>
        <td>${r.gpa.toFixed(1)}</td>
        <td>${r.participation.toFixed(1)}</td>
        <td style="font-family:var(--mono);font-weight:700">${(r.prob*100).toFixed(1)}%</td>
        <td><span class="risk-badge ${badgeClass}">${r.verdict} Risk</span></td>
      </tr>`;
  }).join("");
}

function clearHistory() {
  predictionHistory = [];
  renderHistory();
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV() {
  if (!predictionHistory.length) return;

  const headers = [
    "#","Time","Model","Attendance %","Assignment %",
    "Internal Marks","Study Hours","GPA","Participation",
    "Probability %","Result"
  ];

  const rows = predictionHistory.map(r => [
    r.id, r.time, r.model,
    r.attendance.toFixed(1), r.assignment.toFixed(1),
    r.marks.toFixed(1), r.study.toFixed(1),
    r.gpa.toFixed(1), r.participation.toFixed(1),
    (r.prob * 100).toFixed(1), `${r.verdict} Risk`
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${v}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  const ts   = new Date().toISOString().slice(0,16).replace("T","_").replace(":","-");
  a.href     = url;
  a.download = `risksense_predictions_${ts}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Gauge — pure Canvas, no Chart.js ─────────────────────────────────────────
let gaugeProb = 0;

function initGauge() {
  drawGauge(0);
}

function drawGauge(prob) {
  gaugeProb = prob;
  const canvas = document.getElementById("gaugeChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const W  = canvas.offsetWidth || 340;
  const R  = W * 0.42;          // outer radius
  // Canvas height = radius + a little room for the pivot dot + label gap
  const H  = R + 30;
  canvas.width  = W;
  canvas.height = H;

  ctx.clearRect(0, 0, W, H);

  // Pivot sits exactly on the flat bottom edge of the semicircle
  const cx    = W / 2;
  const cy    = R + 4;           // just below the diameter line
  const inner = R * 0.60;
  const mid   = (R + inner) / 2;
  const thick = R - inner;

  // ── Arc background track ────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, mid, Math.PI, 0, false);  // false = clockwise = TOP half
  ctx.strokeStyle = "#E5E7EB";
  ctx.lineWidth   = thick + 6;
  ctx.lineCap     = "butt";
  ctx.stroke();

  // ── Three colour segments ───────────────────────────
  // Angles: Math.PI (left/green) → 0 (right/red), going anticlockwise=false
  const segs = [
    { s: Math.PI,         e: Math.PI * 4/3, c: "#10B981" },  // green  0–33%
    { s: Math.PI * 4/3,   e: Math.PI * 5/3, c: "#F59E0B" },  // yellow 33–67%
    { s: Math.PI * 5/3,   e: 0,             c: "#EF4444" },  // red    67–100%
  ];
  segs.forEach(({ s, e, c }) => {
    ctx.beginPath();
    ctx.arc(cx, cy, mid, s, e, false);
    ctx.strokeStyle = c;
    ctx.lineWidth   = thick;
    ctx.lineCap     = "butt";
    ctx.stroke();
  });

  // ── White divider ticks ─────────────────────────────
  [Math.PI * 4/3, Math.PI * 5/3].forEach(a => {
    ctx.beginPath();
    ctx.moveTo(cx + inner * Math.cos(a), cy + inner * Math.sin(a));
    ctx.lineTo(cx + R     * Math.cos(a), cy + R     * Math.sin(a));
    ctx.strokeStyle = "white";
    ctx.lineWidth   = 3;
    ctx.stroke();
  });

  // ── Needle ──────────────────────────────────────────
  // prob=0 → angle=π  → cos(π)=-1  sin(π)=0   → points LEFT  ✅
  // prob=1 → angle=0  → cos(0)=+1  sin(0)=0   → points RIGHT ✅
  // Both have sin=0 so y-component = 0 → needle stays ON the diameter
  // Middle prob=0.5 → angle=π/2 → sin=+1 BUT cy is at bottom of arc
  // so cy + sin * len goes DOWNWARD (below canvas) — we need NEGATIVE sin
  // Solution: angle = π*(1-prob), needle endpoint: cx + len*cos(a), cy - len*|sin(a)|
  // Simpler: just negate the y component → ny = cy - needleLen*sin(angle)

  const angle     = Math.PI * (1 - prob);          // π → 0 as prob goes 0→1
  const needleLen = inner * 0.90;

  const nx = cx + needleLen * Math.cos(angle);
  const ny = cy - needleLen * Math.sin(angle);     // ← NEGATIVE sin → goes UP

  // Shadow
  ctx.shadowColor   = "rgba(0,0,0,0.18)";
  ctx.shadowBlur    = 5;
  ctx.shadowOffsetY = 2;

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(nx, ny);
  ctx.strokeStyle = "#1E1B4B";
  ctx.lineWidth   = 3;
  ctx.lineCap     = "round";
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur  = 0;

  // Pivot
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fillStyle = "#1E1B4B";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
}

function setGauge(prob) {
  drawGauge(prob);
}

// Redraw gauge on window resize so it stays crisp
window.addEventListener("resize", () => {
  if (document.getElementById("page-prediction").classList.contains("active")) {
    drawGauge(gaugeProb);
  }
});

// ── Sliders ───────────────────────────────────────────────────────────────────
function updateSlider(name, val) {
  const el = document.getElementById(`val-${name}`);
  if (el) el.textContent = name === "gpa" ? parseFloat(val).toFixed(1) : val;
}

function selectModel(model, btn) {
  selectedModel = model;
  document.querySelectorAll(".model-tab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetPrediction() {
  // Reset all sliders to default values
  Object.entries(DEFAULTS).forEach(([name, val]) => {
    const slider = document.getElementById(`sl-${name}`);
    if (slider) slider.value = val;
    updateSlider(name, val);
  });

  // Reset model selection to Random Forest
  selectedModel = "rf";
  document.querySelectorAll(".model-tab").forEach(b => b.classList.remove("active"));
  document.querySelector('[data-model="rf"]').classList.add("active");

  // Reset gauge display
  if (charts.gauge) {
    charts.gauge._needleProb = 0;
    charts.gauge.update("none");
  }
  document.getElementById("gauge-prob").textContent    = "—";
  const vEl = document.getElementById("gauge-verdict");
  vEl.textContent  = "Run a prediction";
  vEl.className    = "gauge-verdict";

  // Reset feature importance
  document.getElementById("feature-importance-bars").innerHTML =
    "<p class='fi-placeholder'>Run a prediction to see feature importance</p>";
}

// ── Prediction ────────────────────────────────────────────────────────────────
async function runPrediction() {
  const btn = document.querySelector(".predict-btn");
  btn.classList.add("loading");
  btn.innerHTML = "⏳ Predicting…";

  const features = {
    attendance_percentage:      parseFloat(document.getElementById("sl-attendance").value),
    assignment_completion_rate: parseFloat(document.getElementById("sl-assignment").value),
    internal_marks:             parseFloat(document.getElementById("sl-marks").value),
    study_hours_per_week:       parseFloat(document.getElementById("sl-study").value),
    previous_gpa:               parseFloat(document.getElementById("sl-gpa").value),
    participation_score:        parseFloat(document.getElementById("sl-participation").value),
  };

  try {
    const res  = await fetch(`${API}/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ model: selectedModel, features }),
    });
    const data = await res.json();
    const prob = data.probability;

    const verdict = prob < 0.35 ? "LOW RISK" : prob < 0.65 ? "MEDIUM RISK" : "HIGH RISK";
    const vClass  = prob < 0.35 ? "low"      : prob < 0.65 ? "medium"      : "high";

    document.getElementById("gauge-prob").textContent = (prob * 100).toFixed(1) + "%";
    const vEl = document.getElementById("gauge-verdict");
    vEl.textContent = verdict;
    vEl.className   = `gauge-verdict ${vClass}`;

    setGauge(prob);
    renderFeatureImportance(data.feature_importance);
    addToHistory(features, prob, selectedModel);

  } catch {
    alert("⚠️ Could not reach the backend.\n\nMake sure FastAPI is running:\n  cd backend\n  uvicorn main:app --reload");
  } finally {
    btn.classList.remove("loading");
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run Prediction`;
  }
}

function renderFeatureImportance(items) {
  const container = document.getElementById("feature-importance-bars");
  if (!items || !items.length) {
    container.innerHTML = "<p class='fi-placeholder'>No feature importance data returned.</p>";
    return;
  }
  const LABELS = {
    attendance_percentage:      "Attendance %",
    assignment_completion_rate: "Assignment %",
    internal_marks:             "Internal Marks",
    study_hours_per_week:       "Study Hours",
    previous_gpa:               "Previous GPA",
    participation_score:        "Participation",
  };
  const max = Math.max(...items.map(i => i.importance));
  container.innerHTML = items.map(item => `
    <div class="fi-row">
      <span class="fi-name">${LABELS[item.feature] || item.feature}</span>
      <div class="fi-track">
        <div class="fi-fill" style="width:${(item.importance/max*100).toFixed(1)}%"></div>
      </div>
      <span class="fi-pct">${item.importance.toFixed(1)}%</span>
    </div>
  `).join("");
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  applyStoredTheme();
  initOverviewCharts();
  animateCounters();
});