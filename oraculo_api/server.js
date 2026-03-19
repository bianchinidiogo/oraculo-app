import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 3333;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const APP_URL = process.env.APP_URL || 'http://localhost:8081';
const APP_NAME = process.env.APP_NAME || 'Oraculo Diario';
const MODEL = process.env.MODEL || 'openrouter/free';

const AREAS_DA_VIDA = [
  'Amor',
  'Trabalho',
  'Dinheiro',
  'Família',
  'Espiritualidade',
  'Saúde',
  'Propósito',
];

function obterIpsLocais() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const nomeDaInterface of Object.keys(interfaces)) {
    for (const net of interfaces[nomeDaInterface] || []) {
      const isIPv4 = net.family === 'IPv4' || net.family === 4;
      if (isIPv4 && !net.internal) {
        ips.push(net.address);
      }
    }
  }

  return ips;
}

app.get('/health', (req, res) => {
  console.log('BATEU NO /health');

  res.json({
    ok: true,
    status: 'online',
    port: PORT,
    hasKey: Boolean(OPENROUTER_API_KEY),
    model: MODEL,
  });
});

app.post('/interpretar', async (req, res) => {
  console.log('BATEU NO /interpretar');
  console.log('BODY RECEBIDO:', req.body);

  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: 'OPENROUTER_API_KEY não configurada no servidor.',
      });
    }

    const { frase, area, cardId, userId } = req.body;

    if (!frase || typeof frase !== 'string' || !frase.trim()) {
      return res.status(400).json({
        error: 'Frase obrigatória.',
      });
    }

    if (!area || typeof area !== 'string' || !AREAS_DA_VIDA.includes(area)) {
      return res.status(400).json({
        error: 'Área inválida.',
      });
    }

    const systemPrompt = `
Você é um intérprete simbólico de cartas de oráculo.
Escreva em português do Brasil.
Seu tom deve ser acolhedor, sensível, simbólico e elegante.
Não faça promessas absolutas.
Não diga que prevê o futuro.
Não use linguagem clínica, médica ou alarmista.
Não incentive dependência emocional.
Não use listas.
Não use título.
Mantenha entre 80 e 140 palavras.
Responda apenas com o texto final da interpretação.
Não mostre seu raciocínio.
Não inclua instruções, rascunhos ou explicações.
`.trim();

    const userPrompt = `
Frase da carta: "${frase.trim()}"
Área da vida: "${area}"
ID da carta: "${cardId || ''}"
Usuário: "${userId || 'anon'}"

Gere uma interpretação reflexiva e simbólica conectando a frase à área escolhida.
`.trim();

    const openrouterResponse = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': APP_URL,
          'X-OpenRouter-Title': APP_NAME,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 320,
        }),
      }
    );

    const rawText = await openrouterResponse.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    console.log('STATUS OPENROUTER:', openrouterResponse.status);
    console.log('MESSAGE OPENROUTER:', data?.choices?.[0]?.message);

    if (!openrouterResponse.ok) {
      return res.status(openrouterResponse.status).json({
        error:
          data?.error?.message ||
          data?.message ||
          data?.error ||
          'Erro ao gerar interpretação.',
        debug: data,
      });
    }

   const message = data?.choices?.[0]?.message;

    let interpretacao = '';

    if (typeof message?.content === 'string') {
    interpretacao = message.content.trim();
    } else if (Array.isArray(message?.content)) {
    interpretacao = message.content
        .map(part => {
        if (typeof part === 'string') return part;
        if (typeof part?.text === 'string') return part.text;
        return '';
        })
        .join(' ')
        .trim();
    } else if (typeof message?.reasoning === 'string') {
    interpretacao = message.reasoning.trim();
    }

    if (!interpretacao) {
    console.error('MESSAGE RECEBIDA:', message);

    return res.status(502).json({
        error: 'Resposta vazia do modelo.',
        debug: {
        message,
        fullResponse: data,
        },
    });
    }

    return res.json({
      interpretacao,
    });
  } catch (error) {
    console.error('ERRO INTERNO /interpretar:', error);

    return res.status(500).json({
      error: error?.message || 'Erro interno do servidor.',
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  const ips = obterIpsLocais();

  console.log('');
  console.log('Servidor rodando com sucesso');
  console.log(`Local: http://localhost:${PORT}/health`);

  if (ips.length > 0) {
    ips.forEach(ip => {
      console.log(`Rede:  http://${ip}:${PORT}/health`);
    });
  } else {
    console.log('Nenhum IP de rede local encontrado.');
  }

  console.log('');
});