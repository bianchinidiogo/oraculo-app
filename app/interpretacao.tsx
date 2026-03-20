import { createClient } from '@supabase/supabase-js';

const AREAS_DA_VIDA = [
  'Amor',
  'Trabalho',
  'Dinheiro',
  'Família',
  'Espiritualidade',
  'Saúde',
  'Propósito',
];

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function limparTexto(texto) {
  if (typeof texto !== 'string') return '';

  return texto
    .replace(/\r/g, '')
    .replace(/\u0000/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function obterDataLocalISO() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const ano = partes.find(p => p.type === 'year')?.value;
  const mes = partes.find(p => p.type === 'month')?.value;
  const dia = partes.find(p => p.type === 'day')?.value;

  return `${ano}-${mes}-${dia}`;
}

function extrairInterpretacaoGemini(data) {
  const candidate = data?.candidates?.[0];
  if (!candidate) return '';

  console.log('CANDIDATE COMPLETO:', JSON.stringify(candidate, null, 2));

  const parts = candidate?.content?.parts || [];
  console.log('PARTS GEMINI:', JSON.stringify(parts, null, 2));

  let interpretacao = parts
    .map(part => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();

  if (!interpretacao && typeof candidate?.output === 'string') {
    interpretacao = candidate.output.trim();
  }

  if (!interpretacao && typeof data?.text === 'string') {
    interpretacao = data.text.trim();
  }

  return limparTexto(interpretacao);
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

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: 'Credenciais do Supabase não configuradas.',
      });
    }

    const { frase, area, cardId, userId } = req.body || {};

    console.log('BODY RECEBIDO:', req.body);

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

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({
        error: 'userId obrigatório.',
      });
    }

    const dataRef = obterDataLocalISO();

    const { data: existente, error: erroBusca } = await supabase
      .from('interpretacoes_diarias')
      .select('id')
      .eq('user_id', userId)
      .eq('data_ref', dataRef)
      .limit(1)
      .maybeSingle();

    if (erroBusca) {
      console.error('ERRO BUSCA SUPABASE:', erroBusca);
      return res.status(500).json({
        error: 'Erro ao verificar limite diário.',
      });
    }

    if (existente) {
      return res.status(429).json({
        error: 'Você já realizou sua interpretação hoje.',
      });
    }

    const prompt = `
You are an oracle interpreter.

Write in Brazilian Portuguese.

Tone:
Warm, introspective, poetic, emotionally supportive.

Constraints:
- Do not use lists
- Do not use titles
- Do not explain anything
- Do not add meta commentary
- Do not make deterministic predictions
- Do not mention interpretation or instructions
- Output only the final text

Length:
Write between 90 and 120 words.

Guidelines:
Be clear and fluid.
Avoid overly long or complex sentences.
Focus on emotional clarity and meaning.
Connect the oracle phrase naturally to the life area.
Sound human, gentle, and specific rather than generic.

Oracle phrase: "${frase.trim()}"
Life area: "${area}"

Write the final text now.
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
            maxOutputTokens: 220,
            candidateCount: 1,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      }
    );

    const data = await response.json();

    console.log('STATUS GEMINI:', response.status);
    console.log('RESPOSTA GEMINI:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('ERRO GEMINI:', data);
      return res.status(response.status).json({
        error: data?.error?.message || 'Erro ao gerar interpretação.',
      });
    }

    if (data?.promptFeedback?.blockReason) {
      return res.status(422).json({
        error: `Conteúdo bloqueado pela IA: ${data.promptFeedback.blockReason}`,
      });
    }

    const finishReason = data?.candidates?.[0]?.finishReason;
    const interpretacao = extrairInterpretacaoGemini(data);

    console.log('FINISH REASON:', finishReason);
    console.log('INTERPRETACAO EXTRAIDA:', interpretacao);
    console.log('TAMANHO INTERPRETACAO:', interpretacao?.length);

    if (!interpretacao) {
      return res.status(502).json({
        error: 'Resposta vazia da IA.',
        finishReason: finishReason || null,
        debug: data,
      });
    }

    const { error: erroInsert } = await supabase
      .from('interpretacoes_diarias')
      .insert({
        user_id: userId,
        data_ref: dataRef,
        card_id: cardId || null,
        frase: frase.trim(),
        area,
        interpretacao,
      });

    if (erroInsert) {
      console.error('ERRO INSERT SUPABASE:', erroInsert);

      if (erroInsert.code === '23505') {
        return res.status(429).json({
          error: 'Você já realizou sua interpretação hoje.',
        });
      }

      return res.status(500).json({
        error: 'Erro ao salvar interpretação.',
      });
    }

    return res.status(200).json({
      interpretacao,
      finishReason: finishReason || null,
      debugLength: interpretacao.length,
    });
  } catch (error) {
    console.error('ERRO INTERNO /api/interpretar:', error);

    return res.status(500).json({
      error: error?.message || 'Erro interno do servidor.',
    });
  }
}