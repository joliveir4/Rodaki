const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const projectRoot = path.resolve(__dirname, '..', '..');
const inputPath = path.join(
  projectRoot,
  'base-conhecimento-chatbot',
  'Base de Conhecimento - Chatbot Motorista.xlsx',
);
const outputDir = path.join(projectRoot, 'src', 'data', 'chatbot');
const outputPath = path.join(outputDir, 'kb.driver.json');

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickColumn(keys, candidates) {
  const lowerKeys = keys.map((key) => ({ key, normalized: normalizeText(key) }));
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeText(candidate);
    const match = lowerKeys.find((entry) => entry.normalized.includes(normalizedCandidate));
    if (match) return match.key;
  }
  return null;
}

function parseTags(value) {
  if (!value) return [];
  return String(value)
    .split(/[;,|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function convert() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Arquivo nao encontrado: ${inputPath}`);
  }

  const workbook = XLSX.readFile(inputPath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Planilha sem abas para processar.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rows.length) {
    throw new Error('Planilha sem dados.');
  }

  const keys = Object.keys(rows[0]);
  const questionKey = pickColumn(keys, ['pergunta', 'duvida', 'questao', 'faq']);
  const answerKey = pickColumn(keys, ['resposta', 'orientacao', 'solucao', 'explicacao']);
  const tagsKey = pickColumn(keys, ['tags', 'assunto', 'categoria', 'topico']);

  if (!questionKey || !answerKey) {
    throw new Error(
      `Nao foi possivel mapear colunas. Encontradas: ${keys.join(', ')}.`,
    );
  }

  const entries = rows
    .map((row, index) => {
      const question = String(row[questionKey] || '').trim();
      const answer = String(row[answerKey] || '').trim();
      if (!question || !answer) return null;
      return {
        id: `driver-${index + 1}`,
        role: 'driver',
        question,
        answer,
        tags: tagsKey ? parseTags(row[tagsKey]) : [],
      };
    })
    .filter(Boolean);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2), 'utf8');

  console.log(`OK: ${entries.length} entradas geradas.`);
  console.log(`Arquivo: ${outputPath}`);
}

try {
  convert();
} catch (error) {
  console.error('Erro ao converter KB:', error.message || error);
  process.exit(1);
}
