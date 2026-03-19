const AREAS_DA_VIDA = [
  'Amor',
  'Trabalho',
  'Dinheiro',
  'Família',
  'Espiritualidade',
  'Saúde',
  'Propósito',
];

function limparTexto(texto) {
  return typeof texto === 'string' ? texto.trim() : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

    if (!GOOGLE_API_KEY) {
      return res.status(500).json({
        error: 'GOOGLE_API_KEY não configurada.',
      });
    }

    const { frase, area, cardId, userId } = req.body || {};

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

    const prompt = `
Você é um intérprete simbólico de cartas de oráculo.

Regras:
- Escreva em português do Brasil
- Tom acolhedor, sensível, simbólico e elegante
- Não faça promessas absolutas
- Não diga que prevê o futuro
- Não use linguagem clínica, médica ou alarmista
- Não use listas
- Não use título
- Escreva entre 80 e 140 palavras
- Responda apenas com a interpretação final
- Não mostre raciocínio
- Não inclua observações, notas, explicações ou contagem de palavras

Frase da carta: "${frase.trim()}"
Área da vida: "${area}"
ID da carta: "${cardId || ''}"
Usuário: "${userId || 'anon'}"

Gere agora a interpretação.
`.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('ERRO GEMINI:', data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          'Erro ao gerar interpretação.',
      });
    }

    const interpretacao = limparTexto(
      data?.candidates?.[0]?.content?.parts?.[0]?.text
    );

    if (!interpretacao) {
      console.error('RESPOSTA VAZIA GEMINI:', data);

      return res.status(502).json({
        error: 'Resposta vazia da IA.',
      });
    }

    return res.status(200).json({
      interpretacao,
    });
  } catch (error) {
    console.error('ERRO INTERNO /api/interpretar:', error);

    return res.status(500).json({
      error: error?.message || 'Erro interno do servidor.',
    });
  }
}