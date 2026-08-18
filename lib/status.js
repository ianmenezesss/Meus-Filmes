const STATUS = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  DROPPED: "DROPPED",
});

const STATUS_ORDER = [STATUS.IN_PROGRESS, STATUS.COMPLETED, STATUS.NOT_STARTED, STATUS.DROPPED];

const STATUS_LABELS = {
  [STATUS.NOT_STARTED]: "Não iniciada",
  [STATUS.IN_PROGRESS]: "Em andamento",
  [STATUS.COMPLETED]: "Concluído",
  [STATUS.DROPPED]: "Dropei",
};


const RAW_TO_CANONICAL = {
  // já canônico
  not_started: STATUS.NOT_STARTED,
  in_progress: STATUS.IN_PROGRESS,
  completed: STATUS.COMPLETED,
  dropped: STATUS.DROPPED,

  "nao iniciada": STATUS.NOT_STARTED,
  "nao iniciado": STATUS.NOT_STARTED,
  "em andamento": STATUS.IN_PROGRESS,
  assistindo: STATUS.IN_PROGRESS,
  concluido: STATUS.COMPLETED,
  concluida: STATUS.COMPLETED,
  assistido: STATUS.COMPLETED,
  dropei: STATUS.DROPPED,
  dropado: STATUS.DROPPED,
  abandonado: STATUS.DROPPED,
};

function stripDiacritics(str) {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


function normalizeStatus(raw) {
  if (!raw) return STATUS.NOT_STARTED;
  if (Object.values(STATUS).includes(raw)) return raw; // já é canônico
  const key = stripDiacritics(String(raw).trim().toLowerCase());
  const mapped = RAW_TO_CANONICAL[key];
  if (mapped) return mapped;
  console.warn(`[status] valor de status desconhecido: "${raw}" — usando NOT_STARTED. Adicione um mapeamento em lib/status.js`);
  return STATUS.NOT_STARTED;
}

function statusLabel(canonicalStatus) {
  return STATUS_LABELS[canonicalStatus] || STATUS_LABELS[STATUS.NOT_STARTED];
}

module.exports = { STATUS, STATUS_ORDER, STATUS_LABELS, normalizeStatus, statusLabel };
