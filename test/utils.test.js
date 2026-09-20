import { describe, it, expect } from "vitest";
import {
  createMessage,
  formatTimestamp,
  validateMessageInput,
  buildGeminiContents,
  parseGeminiResponse,
  truncate,
} from "../src/utils.js";

describe("createMessage", () => {
  it("crea un mensaje con los campos esperados", () => {
    const msg = createMessage("user", "  Hola Harvey  ");
    expect(msg.role).toBe("user");
    expect(msg.text).toBe("Hola Harvey");
    expect(typeof msg.id).toBe("string");
    expect(typeof msg.timestamp).toBe("number");
  });

  it("lanza un error si el rol es inválido", () => {
    expect(() => createMessage("system", "hola")).toThrow();
  });
});

describe("formatTimestamp", () => {
  it("devuelve un string no vacío con formato de hora", () => {
    const formatted = formatTimestamp(Date.now());
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });
});

describe("validateMessageInput", () => {
  it("rechaza un mensaje vacío", () => {
    const result = validateMessageInput("   ");
    expect(result.valid).toBe(false);
  });

  it("acepta un mensaje válido", () => {
    const result = validateMessageInput("¿Cerramos el trato?");
    expect(result.valid).toBe(true);
  });

  it("rechaza un mensaje demasiado largo", () => {
    const result = validateMessageInput("a".repeat(1001));
    expect(result.valid).toBe(false);
  });
});

describe("buildGeminiContents", () => {
  it("transforma el historial al formato de Gemini", () => {
    const history = [
      { role: "user", text: "Hola" },
      { role: "model", text: "¿Qué necesitás, rookie?" },
    ];
    const contents = buildGeminiContents(history);
    expect(contents).toEqual([
      { role: "user", parts: [{ text: "Hola" }] },
      { role: "model", parts: [{ text: "¿Qué necesitás, rookie?" }] },
    ]);
  });
});

describe("parseGeminiResponse", () => {
  it("extrae el texto de una respuesta válida", () => {
    const fakeResponse = {
      candidates: [{ content: { parts: [{ text: "Así se cierra un trato." }] } }],
    };
    expect(parseGeminiResponse(fakeResponse)).toBe("Así se cierra un trato.");
  });

  it("lanza un error si la respuesta no tiene el formato esperado", () => {
    expect(() => parseGeminiResponse({})).toThrow();
  });
});

describe("truncate", () => {
  it("no modifica strings cortos", () => {
    expect(truncate("Hola", 10)).toBe("Hola");
  });

  it("recorta strings largos y agrega puntos suspensivos", () => {
    const result = truncate("a".repeat(20), 10);
    expect(result.length).toBe(10);
    expect(result.endsWith("…")).toBe(true);
  });
});