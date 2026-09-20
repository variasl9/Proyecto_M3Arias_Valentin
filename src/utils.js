// utils.js
// Funciones puras de transformación de datos: crear mensajes, formatear
// timestamps, armar el payload para Gemini y parsear su respuesta.
// Están separadas del resto de la lógica para que sean fáciles de testear.

/**
 * Crea un objeto de mensaje normalizado para guardar en el historial del chat.
 * @param {"user"|"model"} role
 * @param {string} text
 * @returns {{id: string, role: "user"|"model", text: string, timestamp: number}}
 */
export function createMessage(role, text) {
  if (role !== "user" && role !== "model") {
    throw new Error(`Rol inválido: ${role}`);
  }
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    text: String(text ?? "").trim(),
    timestamp: Date.now(),
  };
}

/**
 * Formatea un timestamp (ms) como hora local corta, ej "3:45 PM".
 * @param {number} timestamp
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Valida el texto que el usuario quiere enviar.
 * @param {string} text
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMessageInput(text) {
  const trimmed = String(text ?? "").trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "El mensaje no puede estar vacío." };
  }
  if (trimmed.length > 1000) {
    return { valid: false, error: "El mensaje es demasiado largo (máx. 1000 caracteres)." };
  }
  return { valid: true };
}

/**
 * Convierte el historial interno de mensajes al formato que espera la API
 * de Gemini (`contents`, con roles "user" | "model").
 * @param {Array<{role: string, text: string}>} history
 * @returns {Array<{role: string, parts: Array<{text: string}>}>}
 */
export function buildGeminiContents(history) {
  return history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));
}

/**
 * Extrae el texto de respuesta del payload crudo que devuelve la API de
 * Gemini. Lanza un error legible si la forma no es la esperada.
 * @param {any} apiResponse
 * @returns {string}
 */
export function parseGeminiResponse(apiResponse) {
  const text = apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("La respuesta de la AI no tiene el formato esperado.");
  }
  return text.trim();
}

/**
 * Trunca un string a una longitud máxima, agregando "…" si lo recorta.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 80) {
  const str = String(text ?? "");
  return str.length > maxLength ? `${str.slice(0, maxLength - 1)}…` : str;
}