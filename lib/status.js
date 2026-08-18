// lib/status.js
//
// FONTE ÚNICA DE VERDADE para o conceito de "status" de um filme.
// Nada mais no projeto deve declarar strings de status soltas — sempre
// importar STATUS / STATUS_LABELS / STATUS_ORDER / normalizeStatus daqui.
//
// Por que isso existia como bug: o CSV exportado do Notion guarda
// "Concluído" e "Não iniciada" (com acento), mas o frontend tinha strings
// hardcoded em 3 arquivos diferentes ("Concluido" e "Nao iniciada", sem
// acento). Como o filtro fazia comparação exata (m.status === status),
// "Concluído" (banco) nunca era igual a "Concluido" (filtro) e o filtro
// falhava silenciosamente. "Em andamento" e "Dropei" só funcionavam por
// coincidência: essas duas strings não têm acento, então CSV e frontend
// batiam por acidente.

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

// Todo valor "cru" que já apareceu no CSV do Notion, no banco antigo, ou
// nas telas antigas do app, mapeado para o código canônico. Ao adicionar
// um novo valor "estranho" encontrado no banco, é só acrescentar aqui —
// normalizeStatus() cuida do resto (incluindo variação de maiúsculas e
// acentos via strip de diacríticos).
const RAW_TO_CANONICAL = {
  // já canônico
  not_started: STATUS.NOT_STARTED,
  in_progress: STATUS.IN_PROGRESS,
  completed: STATUS.COMPLETED,
  dropped: STATUS.DROPPED,
  // variações vindas do CSV do Notion / telas antigas do app
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

// Converte QUALQUER valor de status (do CSV, do banco antigo, de uma UI
// antiga) para um dos 4 códigos canônicos. Nunca lança erro — na dúvida,
// cai em NOT_STARTED e avisa no console, pra facilmente localizar valores
// desconhecidos que precisem ser adicionados a RAW_TO_CANONICAL.
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
