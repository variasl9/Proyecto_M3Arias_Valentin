// api/chat.js
// Vercel Serverless Function: actúa como proxy seguro entre el frontend y
// Google Gemini. La API key vive solo acá (variable de entorno del server),
// nunca se envía ni se expone al cliente.

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `
Sos Harvey Specter, el socio litigante estrella de Pearson Specter Litt en la
serie "Suits". Estas chateando por texto con un usuario que quiere hablar con vos.

Personalidad:
- Extremadamente seguro de vos mismo, directo y ambicioso. Ganás. Siempre.
- Ingenioso, sarcástico y con líneas memorables tipo "yo no tengo sueños, tengo objetivos".
- Usás metáforas de boxeo, ajedrez, béisbol y negocios para hacer tu punto.
- Tratás a la gente con humor filoso pero no sos cruel de verdad; en el fondo sos leal.
- Te encanta cerrar tratos, ganar casos imposibles y dejar la última palabra.
- Mencionás ocasionalmente a Mike Ross, Donna, Jessica o Louis si viene al caso,
  pero sin forzarlo en cada respuesta.

Reglas de estilo:
- Respuestas CORTAS (1 a 4 oraciones), como en un chat real, no ensayos.
- Nunca rompas el personaje ni digas que sos una IA o un modelo de lenguaje.
- Si te preguntan algo fuera de tu mundo (ej. tecnología moderna, eventos reales
  actuales), respondé con la actitud de Harvey: con confianza, humor, y llevando
  la conversación a terreno conocido (derecho, negocios, ganar).
- No repitas el mismo chiste o frase dos veces seguidas.
`.trim();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido. Usá POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Falta configurar GEMINI_API_KEY en las variables de entorno del servidor.",
    });
  }

  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Se espera un array 'messages' no vacío." });
  }

  const contents = messages.map((m) => ({
    role: m.role === "model" ? "model" : "user",
    parts: [{ text: String(m.text ?? "") }],
  }));

  const callGemini = () =>
    fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          maxOutputTokens: 400,
          thinkingConfig: { thinkingLevel: "minimal" },
        },
      }),
    });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Gemini a veces devuelve 503 ("modelo sobrecargado"), un error temporal
  // del lado de Google. Reintentamos un par de veces con backoff antes de
  // rendirnos, en vez de fallarle al usuario en el primer hipo del servidor.
  const MAX_RETRIES = 2;
  let geminiRes;
  let errText = "";

  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      geminiRes = await callGemini();

      if (geminiRes.ok) break;

      errText = await geminiRes.text();
      const isOverloaded = geminiRes.status === 503;
      const isLastAttempt = attempt === MAX_RETRIES;

      console.error(
        `Gemini API error (intento ${attempt + 1}/${MAX_RETRIES + 1}):`,
        geminiRes.status,
        errText
      );

      if (!isOverloaded || isLastAttempt) break;

      await sleep(500 * (attempt + 1)); // backoff: 500ms, luego 1000ms
    }

    if (!geminiRes.ok) {
      return res.status(502).json({ error: "Error al contactar a Gemini AI." });
    }

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(502).json({ error: "Gemini no devolvió una respuesta válida." });
    }

    return res.status(200).json({ reply: reply.trim() });
  } catch (err) {
    console.error("Error inesperado en /api/chat:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}