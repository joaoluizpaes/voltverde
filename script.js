const STORAGE_KEY = "calculadoraScooterConfigV1";

const DEFAULT_CONFIG = {
  energyPrice: 0.7758,
  gasPrice: 6.70,
  adminPassword: "admin123",
  scooters: [
    {
      id: "scooter-1000",
      name: "Scooter 1000W",
      power: 1000,
      autonomyMin: 50,
      autonomyMax: 60,
      consumptionWhKm: 18,
      maintenancePerKm: 0.03,
      tiresBrakesPerKm: 0.02,
      batteryPerKm: 0.02,
      annualIpva: 0,
      annualLicense: 0,
      annualInsurance: 300,
      annualDepreciation: 900
    }
  ],
  moto: {
    consumptionKmL: 40,
    maintenancePerKm: 0.08,
    tiresPerKm: 0.03,
    oilPerKm: 0.02,
    chainPerKm: 0.01,
    annualIpva: 450,
    annualLicense: 150,
    annualInsurance: 900,
    annualDepreciation: 1500
  },
  car: {
    consumptionKmL: 12,
    maintenancePerKm: 0.15,
    tiresPerKm: 0.07,
    oilPerKm: 0.03,
    annualIpva: 2200,
    annualLicense: 200,
    annualInsurance: 2500,
    annualDepreciation: 7000
  }
};

let config = loadConfig();
let lastResult = null;

const $ = (id) => document.getElementById(id);
const money = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return clone(DEFAULT_CONFIG);
    const parsed = JSON.parse(saved);
    return deepMerge(clone(DEFAULT_CONFIG), parsed);
  } catch {
    return clone(DEFAULT_CONFIG);
  }
}

function deepMerge(base, extra) {
  if (!extra || typeof extra !== "object") return base;
  for (const key of Object.keys(extra)) {
    if (extra[key] && typeof extra[key] === "object" && !Array.isArray(extra[key])) {
      base[key] = deepMerge(base[key] || {}, extra[key]);
    } else {
      base[key] = extra[key];
    }
  }
  return base;
}

function saveConfigToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function populateScooters() {
  const select = $("scooterSelect");
  select.innerHTML = "";
  config.scooters.filter(s => s.active !== false).forEach(s => {
    const option = document.createElement("option");
    option.value = s.id;
    option.textContent = `${s.name} — ${s.power}W`;
    select.appendChild(option);
  });
}

function getSelectedScooter() {
  return config.scooters.find(s => s.id === $("scooterSelect").value) || config.scooters[0];
}

function validateInputs() {
  const km = Number($("kmDay").value);
  const days = Number($("daysMonth").value);
  if (!km || km < 1 || !days || days < 1 || days > 31 || !config.scooters.length) {
    alert("Informe uma quilometragem, dias de uso e tenha pelo menos um modelo de scooter cadastrado.");
    return null;
  }
  return { km, days };
}

function calculate() {
  const input = validateInputs();
  if (!input) return;
  const { km, days } = input;
  const scooter = getSelectedScooter();

  const monthlyKm = km * days;
  const annualKm = monthlyKm * 12;

  // Scooter: Wh/km -> kWh/km.
  const energyMonthly = monthlyKm * (scooter.consumptionWhKm / 1000) * config.energyPrice;
  const scooterMaintenance = monthlyKm * scooter.maintenancePerKm;
  const scooterTires = monthlyKm * scooter.tiresBrakesPerKm;
  const scooterBattery = monthlyKm * scooter.batteryPerKm;
  const scooterFixed = (scooter.annualIpva + scooter.annualLicense + scooter.annualInsurance + scooter.annualDepreciation) / 12;
  const scooterMonthly = energyMonthly + scooterMaintenance + scooterTires + scooterBattery + scooterFixed;

  // Combustion vehicles.
  const motoFuel = (monthlyKm / config.moto.consumptionKmL) * config.gasPrice;
  const motoVariable = monthlyKm * (
    config.moto.maintenancePerKm +
    config.moto.tiresPerKm +
    config.moto.oilPerKm +
    config.moto.chainPerKm
  );
  const motoFixed = (
    config.moto.annualIpva +
    config.moto.annualLicense +
    config.moto.annualInsurance +
    config.moto.annualDepreciation
  ) / 12;
  const motoMonthly = motoFuel + motoVariable + motoFixed;

  const carFuel = (monthlyKm / config.car.consumptionKmL) * config.gasPrice;
  const carVariable = monthlyKm * (
    config.car.maintenancePerKm +
    config.car.tiresPerKm +
    config.car.oilPerKm
  );
  const carFixed = (
    config.car.annualIpva +
    config.car.annualLicense +
    config.car.annualInsurance +
    config.car.annualDepreciation
  ) / 12;
  const carMonthly = carFuel + carVariable + carFixed;

  lastResult = {
    km, days, monthlyKm, annualKm,
    scooter: {
      name: scooter.name,
      monthly: scooterMonthly,
      daily: scooterMonthly / days,
      yearly: scooterMonthly * 12,
      energy: energyMonthly,
      maintenance: scooterMaintenance,
      tires: scooterTires,
      battery: scooterBattery,
      fixed: scooterFixed
    },
    moto: {
      monthly: motoMonthly,
      daily: motoMonthly / days,
      yearly: motoMonthly * 12,
      fuel: motoFuel,
      maintenance: motoVariable,
      fixed: motoFixed
    },
    car: {
      monthly: carMonthly,
      daily: carMonthly / days,
      yearly: carMonthly * 12,
      fuel: carFuel,
      maintenance: carVariable,
      fixed: carFixed
    }
  };

  renderResults();
}

function renderBreakdown(containerId, rows) {
  $(containerId).innerHTML = rows.map(([label, value]) =>
    `<div class="cost-line"><span>${label}</span><b>${money(value)}</b></div>`
  ).join("");
}

function renderResults() {
  const r = lastResult;
  $("results").classList.remove("hidden");
  $("distanceLabel").textContent = `${r.monthlyKm.toLocaleString("pt-BR")} km/mês`;
  $("scooterName").textContent = r.scooter.name;

  $("scooterMonthly").textContent = money(r.scooter.monthly);
  $("scooterDaily").textContent = money(r.scooter.daily);
  $("scooterYearly").textContent = money(r.scooter.yearly);

  $("motoMonthly").textContent = money(r.moto.monthly);
  $("motoDaily").textContent = money(r.moto.daily);
  $("motoYearly").textContent = money(r.moto.yearly);

  $("carMonthly").textContent = money(r.car.monthly);
  $("carDaily").textContent = money(r.car.daily);
  $("carYearly").textContent = money(r.car.yearly);

  renderBreakdown("scooterBreakdown", [
    ["Energia", r.scooter.energy],
    ["Manutenção", r.scooter.maintenance],
    ["Pneus/freios", r.scooter.tires],
    ["Reserva de bateria", r.scooter.battery],
    ["Custos fixos", r.scooter.fixed]
  ]);

  renderBreakdown("motoBreakdown", [
    ["Gasolina", r.moto.fuel],
    ["Manutenção/peças", r.moto.maintenance],
    ["IPVA/licenciamento/seguro/depreciação", r.moto.fixed]
  ]);

  renderBreakdown("carBreakdown", [
    ["Gasolina", r.car.fuel],
    ["Manutenção/peças", r.car.maintenance],
    ["IPVA/licenciamento/seguro/depreciação", r.car.fixed]
  ]);

  const saveMoto = r.moto.monthly - r.scooter.monthly;
  const saveCar = r.car.monthly - r.scooter.monthly;

  $("saveMotoMonth").textContent = `${money(Math.max(0, saveMoto))}/mês`;
  $("saveMotoYear").textContent = `${money(Math.max(0, saveMoto * 12))} por ano`;
  $("saveCarMonth").textContent = `${money(Math.max(0, saveCar))}/mês`;
  $("saveCarYear").textContent = `${money(Math.max(0, saveCar * 12))} por ano`;

  renderChart([
    ["Scooter", r.scooter.monthly, "scooter"],
    ["Moto", r.moto.monthly, "moto"],
    ["Carro", r.car.monthly, "car"]
  ]);

  $("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderChart(items) {
  const max = Math.max(...items.map(x => x[1]), 1);
  $("chart").innerHTML = items.map(([label, value, cls]) => {
    const pct = Math.max(2, (value / max) * 100);
    return `<div class="bar-row">
      <strong>${label}</strong>
      <div class="bar-track"><div class="bar ${cls}" style="width:${pct}%"></div></div>
      <span class="bar-value">${money(value)}</span>
    </div>`;
  }).join("");
}

function openAdmin() {
  $("adminModal").classList.remove("hidden");
  $("loginPanel").classList.remove("hidden");
  $("settingsPanel").classList.add("hidden");
  $("adminPassword").value = "";
}

function closeAdmin() {
  $("adminModal").classList.add("hidden");
}

function loginAdmin() {
  if ($("adminPassword").value !== config.adminPassword) {
    alert("Senha incorreta.");
    return;
  }
  $("loginPanel").classList.add("hidden");
  $("settingsPanel").classList.remove("hidden");
  fillSettings();
}

function fillSettings() {
  $("cfgEnergy").value = config.energyPrice;
  $("cfgGas").value = config.gasPrice;
  $("cfgPassword").value = config.adminPassword;

  const map = {
    motoConsumption: config.moto.consumptionKmL,
    motoMaintenance: config.moto.maintenancePerKm,
    motoTires: config.moto.tiresPerKm,
    motoOil: config.moto.oilPerKm,
    motoChain: config.moto.chainPerKm,
    motoIpva: config.moto.annualIpva,
    motoLicense: config.moto.annualLicense,
    motoInsurance: config.moto.annualInsurance,
    motoDepreciation: config.moto.annualDepreciation,
    carConsumption: config.car.consumptionKmL,
    carMaintenance: config.car.maintenancePerKm,
    carTires: config.car.tiresPerKm,
    carOil: config.car.oilPerKm,
    carIpva: config.car.annualIpva,
    carLicense: config.car.annualLicense,
    carInsurance: config.car.annualInsurance,
    carDepreciation: config.car.annualDepreciation
  };
  Object.entries(map).forEach(([id, value]) => $(id).value = value);
  renderScooterAdmin();
}

function numberValue(id) {
  return Number($(id).value) || 0;
}

function collectSettings() {
  config.energyPrice = numberValue("cfgEnergy");
  config.gasPrice = numberValue("cfgGas");
  config.adminPassword = $("cfgPassword").value.trim() || "admin123";

  config.moto = {
    consumptionKmL: numberValue("motoConsumption"),
    maintenancePerKm: numberValue("motoMaintenance"),
    tiresPerKm: numberValue("motoTires"),
    oilPerKm: numberValue("motoOil"),
    chainPerKm: numberValue("motoChain"),
    annualIpva: numberValue("motoIpva"),
    annualLicense: numberValue("motoLicense"),
    annualInsurance: numberValue("motoInsurance"),
    annualDepreciation: numberValue("motoDepreciation")
  };

  config.car = {
    consumptionKmL: numberValue("carConsumption"),
    maintenancePerKm: numberValue("carMaintenance"),
    tiresPerKm: numberValue("carTires"),
    oilPerKm: numberValue("carOil"),
    annualIpva: numberValue("carIpva"),
    annualLicense: numberValue("carLicense"),
    annualInsurance: numberValue("carInsurance"),
    annualDepreciation: numberValue("carDepreciation")
  };

  const cards = [...document.querySelectorAll(".scooter-admin")];
  config.scooters = cards.map(card => ({
    id: card.dataset.id,
    name: card.querySelector('[data-field="name"]').value.trim() || "Scooter",
    power: Number(card.querySelector('[data-field="power"]').value) || 1000,
    autonomyMin: Number(card.querySelector('[data-field="autonomyMin"]').value) || 50,
    autonomyMax: Number(card.querySelector('[data-field="autonomyMax"]').value) || 60,
    consumptionWhKm: Number(card.querySelector('[data-field="consumptionWhKm"]').value) || 18,
    maintenancePerKm: Number(card.querySelector('[data-field="maintenancePerKm"]').value) || 0,
    tiresBrakesPerKm: Number(card.querySelector('[data-field="tiresBrakesPerKm"]').value) || 0,
    batteryPerKm: Number(card.querySelector('[data-field="batteryPerKm"]').value) || 0,
    annualIpva: Number(card.querySelector('[data-field="annualIpva"]').value) || 0,
    annualLicense: Number(card.querySelector('[data-field="annualLicense"]').value) || 0,
    annualInsurance: Number(card.querySelector('[data-field="annualInsurance"]').value) || 0,
    annualDepreciation: Number(card.querySelector('[data-field="annualDepreciation"]').value) || 0
  }));
}

function renderScooterAdmin() {
  $("scooterAdminList").innerHTML = config.scooters.map((s, i) => `
    <div class="scooter-admin" data-id="${s.id}">
      <div class="scooter-admin-head">
        <h4>🛵 Modelo ${i + 1}</h4>
        <button class="remove-btn" data-remove="${s.id}" type="button">Excluir</button>
      </div>
      <div class="form-grid compact">
        <label><span>Nome</span><input data-field="name" value="${escapeAttr(s.name)}"></label>
        <label><span>Potência (W)</span><input data-field="power" type="number" value="${s.power}"></label>
        <label><span>Autonomia mínima (km)</span><input data-field="autonomyMin" type="number" value="${s.autonomyMin}"></label>
        <label><span>Autonomia máxima (km)</span><input data-field="autonomyMax" type="number" value="${s.autonomyMax}"></label>
        <label><span>Consumo estimado (Wh/km)</span><input data-field="consumptionWhKm" type="number" step="0.1" value="${s.consumptionWhKm}"></label>
        <label><span>Manutenção (R$/km)</span><input data-field="maintenancePerKm" type="number" step="0.001" value="${s.maintenancePerKm}"></label>
        <label><span>Pneus/freios (R$/km)</span><input data-field="tiresBrakesPerKm" type="number" step="0.001" value="${s.tiresBrakesPerKm}"></label>
        <label><span>Reserva bateria (R$/km)</span><input data-field="batteryPerKm" type="number" step="0.001" value="${s.batteryPerKm}"></label>
        <label><span>IPVA anual (R$)</span><input data-field="annualIpva" type="number" value="${s.annualIpva}"></label>
        <label><span>Licenciamento anual (R$)</span><input data-field="annualLicense" type="number" value="${s.annualLicense}"></label>
        <label><span>Seguro anual (R$)</span><input data-field="annualInsurance" type="number" value="${s.annualInsurance}"></label>
        <label><span>Depreciação anual (R$)</span><input data-field="annualDepreciation" type="number" value="${s.annualDepreciation}"></label>
      </div>
    </div>
  `).join("");

  document.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (config.scooters.length <= 1) {
        alert("Mantenha pelo menos um modelo.");
        return;
      }
      config.scooters = config.scooters.filter(s => s.id !== btn.dataset.remove);
      renderScooterAdmin();
    });
  });
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function addScooter() {
  const temp = {
    id: "scooter-" + Date.now(),
    name: "Nova Scooter",
    power: 1000,
    autonomyMin: 50,
    autonomyMax: 60,
    consumptionWhKm: 18,
    maintenancePerKm: 0.03,
    tiresBrakesPerKm: 0.02,
    batteryPerKm: 0.02,
    annualIpva: 0,
    annualLicense: 0,
    annualInsurance: 300,
    annualDepreciation: 900
  };
  config.scooters.push(temp);
  renderScooterAdmin();
}

function resetConfig() {
  if (!confirm("Restaurar todos os valores padrão?")) return;
  config = clone(DEFAULT_CONFIG);
  saveConfigToStorage();
  populateScooters();
  fillSettings();
  alert("Configurações restauradas.");
}

async function shareResult() {
  if (!lastResult) return;
  const text = [
    "🛵 Simulação de economia",
    `Rodagem: ${lastResult.km} km/dia (${lastResult.monthlyKm} km/mês)`,
    "",
    `${lastResult.scooter.name}: ${money(lastResult.scooter.monthly)}/mês`,
    `Moto popular: ${money(lastResult.moto.monthly)}/mês`,
    `Carro popular: ${money(lastResult.car.monthly)}/mês`,
    "",
    `Economia vs. moto: ${money(Math.max(0, lastResult.moto.monthly - lastResult.scooter.monthly))}/mês`,
    `Economia vs. carro: ${money(Math.max(0, lastResult.car.monthly - lastResult.scooter.monthly))}/mês`,
    "",
    "Valores estimados para comparação."
  ].join("\n");

  if (navigator.share) {
    try {
      await navigator.share({ title: "Simulação de economia", text });
      return;
    } catch {}
  }
  try {
    await navigator.clipboard.writeText(text);
    alert("Resultado copiado. Agora é só colar no WhatsApp.");
  } catch {
    prompt("Copie o resultado:", text);
  }
}

$("calculateBtn").addEventListener("click", calculate);
$("recalculateBtn").addEventListener("click", () => {
  $("results").classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
});
$("shareBtn").addEventListener("click", shareResult);
$("adminBtn").addEventListener("click", openAdmin);
$("closeAdmin").addEventListener("click", closeAdmin);
$("loginBtn").addEventListener("click", loginAdmin);
$("adminPassword").addEventListener("keydown", e => { if (e.key === "Enter") loginAdmin(); });
$("saveSettings").addEventListener("click", () => {
  collectSettings();
  saveConfigToStorage();
  populateScooters();
  alert("Configurações salvas neste navegador.");
});
$("resetSettings").addEventListener("click", resetConfig);
$("addScooter").addEventListener("click", addScooter);

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t => t.classList.add("hidden"));
    tab.classList.add("active");
    $(`${tab.dataset.tab}Tab`).classList.remove("hidden");
  });
});

$("adminModal").addEventListener("click", e => {
  if (e.target === $("adminModal")) closeAdmin();
});

populateScooters();
