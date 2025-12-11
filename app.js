// Estado con persistencia (localStorage)
const state = {
  counts: { 500: 0, 1000: 0, 2000: 0, "1000-recomendado": 0, "1000-recomendador": 0 },
  sum: 0,
  log: []
};

const els = {
  count500: document.getElementById("count-500"),
  count1000: document.getElementById("count-1000"),
  count2000: document.getElementById("count-2000"),
  countRec: document.getElementById("count-1000-recomendado"),
  countRecr: document.getElementById("count-1000-recomendador"),
  sumTotal: document.getElementById("sum-total"),
  logBody: document.getElementById("log-body"),
  reset: document.getElementById("reset"),
  exportBtn: document.getElementById("export"),
  clearLogBtn: document.getElementById("clear-log")
};

// Carga inicial desde localStorage
(function init() {
  try {
    const raw = localStorage.getItem("gestor-bonos");
    if (raw) {
      const data = JSON.parse(raw);
      if (data?.counts) state.counts = data.counts;
      if (typeof data?.sum === "number") state.sum = data.sum;
      if (Array.isArray(data?.log)) state.log = data.log;
    }
    const savedTheme = localStorage.getItem("gestor-bonos-theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateActiveThemeButton(savedTheme);
  } catch (e) {
    console.warn("No se pudo cargar el estado:", e);
  }
  render();
})();

function save() {
  localStorage.setItem("gestor-bonos", JSON.stringify(state));
}

function fmtDateTime(d) {
  const fecha = d.toLocaleDateString();
  const hora = d.toLocaleTimeString();
  return { fecha, hora };
}

function render() {
  els.count500.textContent = state.counts["500"];
  els.count1000.textContent = state.counts["1000"];
  els.count2000.textContent = state.counts["2000"];
  els.countRec.textContent = state.counts["1000-recomendado"];
  els.countRecr.textContent = state.counts["1000-recomendador"];
  els.sumTotal.textContent = state.sum;

  // Render del registro (usa fragment para rendimiento)
  els.logBody.innerHTML = "";
  const frag = document.createDocumentFragment();
  state.log.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.fecha}</td>
      <td>${item.hora}</td>
      <td>${item.tipo}</td>
      <td>${item.monto}</td>
    `;
    frag.appendChild(tr);
  });
  els.logBody.appendChild(frag);
}

function addBono(monto, etiqueta) {
  let key = String(monto);
  const lower = etiqueta.toLowerCase();
  if (lower.includes("recomendado")) key = "1000-recomendado";
  else if (lower.includes("recomendador")) key = "1000-recomendador";

  state.counts[key] = (state.counts[key] || 0) + 1;
  state.sum += Number(monto);

  const now = new Date();
  const { fecha, hora } = fmtDateTime(now);
  state.log.unshift({ fecha, hora, tipo: etiqueta, monto: Number(monto) });

  save();
  render();
}

function resetCounters() {
  state.counts["500"] = 0;
  state.counts["1000"] = 0;
  state.counts["2000"] = 0;
  state.counts["1000-recomendado"] = 0;
  state.counts["1000-recomendador"] = 0;
  state.sum = 0;
  save();
  render();
}

function exportCSV() {
  const header = ["Fecha", "Hora", "Tipo", "Monto"];
  const rows = state.log.map(it => [it.fecha, it.hora, it.tipo, it.monto]);
  const csv = [header, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `registro_bonos_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearLog() {
  if (!confirm("¿Seguro que deseas limpiar el registro? Esta acción no se puede deshacer.")) return;
  state.log = [];
  save();
  render();
}

// Feedback visual de clic
function animateClick(btn) {
  btn.classList.remove("clicked");
  // reiniciar animación mediante reflow
  void btn.offsetWidth;
  btn.classList.add("clicked");
}

// Glow que sigue el puntero (para la animación visible permanente)
function attachPointerGlow(btn) {
  btn.addEventListener("pointermove", (e) => {
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty("--x", `${x}%`);
    btn.style.setProperty("--y", `${y}%`);
  });
}

// Tema activo visualmente
function updateActiveThemeButton(theme) {
  document.querySelectorAll(".theme-btn").forEach(btn => {
    if (btn.getAttribute("data-theme") === theme) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Eventos de UI
document.querySelectorAll(".bono").forEach(btn => {
  attachPointerGlow(btn);
  btn.addEventListener("click", () => {
    const monto = Number(btn.getAttribute("data-value"));
    const etiqueta = btn.getAttribute("data-label");
    animateClick(btn);
    addBono(monto, etiqueta);
  });
});

document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const theme = btn.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("gestor-bonos-theme", theme);
    updateActiveThemeButton(theme);
  });
});

els.reset.addEventListener("click", resetCounters);
els.exportBtn.addEventListener("click", exportCSV);
els.clearLogBtn.addEventListener("click", clearLog);
