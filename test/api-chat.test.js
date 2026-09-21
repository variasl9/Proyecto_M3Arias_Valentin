import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handler from "../api/chat.js";

function createMockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader() {},
  };
}

describe("api/chat handler", () => {
  const originalEnv = process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "fake-test-key";
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("devuelve 405 si el método no es POST", async () => {
    const req = { method: "GET" };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("devuelve 400 si falta el array de mensajes", async () => {
    const req = { method: "POST", body: {} };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("devuelve la respuesta de Gemini parseada cuando el fetch (mockeado) funciona", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "Cerrá el trato, rookie." }] } }],
      }),
    });

    const req = {
      method: "POST",
      body: { messages: [{ role: "user", text: "Hola Harvey" }] },
    };
    const res = createMockRes();
    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
    expect(res.body.reply).toBe("Cerrá el trato, rookie.");
  });

  it("devuelve 502 si la llamada a Gemini (mockeada) falla", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "upstream error",
    });

    const req = {
      method: "POST",
      body: { messages: [{ role: "user", text: "Hola" }] },
    };
    const res = createMockRes();
    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(502);
  });

  it("reintenta ante un 503 (modelo sobrecargado) y responde ok si el reintento funciona", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "model overloaded",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "Segundo intento, ganado." }] } }],
        }),
      });

    const req = {
      method: "POST",
      body: { messages: [{ role: "user", text: "Hola" }] },
    };
    const res = createMockRes();
    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res.statusCode).toBe(200);
    expect(res.body.reply).toBe("Segundo intento, ganado.");
  });

  it("devuelve 502 si un 503 persiste en todos los reintentos", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "model overloaded",
    });

    const req = {
      method: "POST",
      body: { messages: [{ role: "user", text: "Hola" }] },
    };
    const res = createMockRes();
    await handler(req, res);

    // MAX_RETRIES = 2 → 3 intentos en total (1 inicial + 2 reintentos)
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(res.statusCode).toBe(502);
  });
});