// chat.js
// Lógica específica del chat: mantiene el historial en memoria durante la
// sesión, renderiza los mensajes, maneja el estado de "escribiendo...",
// llama a la serverless function y muestra errores de forma clara.

import { createMessage, formatTimestamp, validateMessageInput } from "./utils.js";

// El historial vive en memoria mientras dure la sesión (se pierde al
// recargar la página, tal como pide la consigna).
let history = [];
let isSending = false;

export function initChatView(container) {
  container.innerHTML = `
    <div class="chat-view">
      <div class="chat-header">
        <div class="chat-avatar">HS</div>
        <div>
          <div class="chat-header-title">Harvey Specter</div>
          <div class="chat-header-subtitle">Pearson Specter Litt</div>
        </div>
      </div>

      <div class="messages" id="messages"></div>

      <form class="chat-form" id="chat-form" autocomplete="off">
        <input
          type="text"
          id="chat-input"
          class="chat-input"
          placeholder="Escribí tu mensaje..."
          maxlength="1000"
        />
        <button type="submit" class="chat-send" id="chat-send">Enviar</button>
      </form>
    </div>
  `;

  const messagesEl = container.querySelector("#messages");
  const formEl = container.querySelector("#chat-form");
  const inputEl = container.querySelector("#chat-input");
  const sendBtn = container.querySelector("#chat-send");

  renderMessages(messagesEl);

  if (history.length === 0) {
    pushMessage(
      createMessage(
        "model",
        "¿Y bien? Tenés toda mi atención, pero no toda mi paciencia. Contame qué necesitás."
      ),
      messagesEl
    );
  }

  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSending) return;

    const text = inputEl.value;
    const validation = validateMessageInput(text);
    if (!validation.valid) {
      showTransientError(messagesEl, validation.error);
      return;
    }

    const userMessage = createMessage("user", text);
    pushMessage(userMessage, messagesEl);
    inputEl.value = "";

    await sendToAI(messagesEl, sendBtn, inputEl);
  });
}

function pushMessage(message, messagesEl) {
  history.push(message);
  renderMessages(messagesEl);
}

function renderMessages(messagesEl) {
  messagesEl.innerHTML = history
    .map(
      (msg) => `
      <div class="msg msg-${msg.role}">
        ${escapeHtml(msg.text)}
        <span class="msg-time">${formatTimestamp(msg.timestamp)}</span>
      </div>
    `
    )
    .join("");
  scrollToBottom(messagesEl);
}

function showTyping(messagesEl) {
  const typingEl = document.createElement("div");
  typingEl.className = "typing";
  typingEl.id = "typing-indicator";
  typingEl.innerHTML = "<span></span><span></span><span></span>";
  messagesEl.appendChild(typingEl);
  scrollToBottom(messagesEl);
}

function hideTyping(messagesEl) {
  messagesEl.querySelector("#typing-indicator")?.remove();
}

function showTransientError(messagesEl, text) {
  const errorEl = document.createElement("div");
  errorEl.className = "msg msg-error";
  errorEl.textContent = text;
  messagesEl.appendChild(errorEl);
  scrollToBottom(messagesEl);
  setTimeout(() => errorEl.remove(), 3500);
}

function scrollToBottom(messagesEl) {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function sendToAI(messagesEl, sendBtn, inputEl) {
  isSending = true;
  sendBtn.disabled = true;
  inputEl.disabled = true;
  showTyping(messagesEl);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history.map(({ role, text }) => ({ role, text })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Error al contactar a la AI.");
    }

    hideTyping(messagesEl);
    pushMessage(createMessage("model", data.reply), messagesEl);
  } catch (err) {
    hideTyping(messagesEl);
    showTransientError(messagesEl, err.message || "Algo salió mal. Probá de nuevo.");
  } finally {
    isSending = false;
    sendBtn.disabled = false;
    inputEl.disabled = false;
    inputEl.focus();
  }
}