// content.js - WhatsApp Privacy Pro
// Enfoque híbrido: JS etiqueta los mensajes, CSS aplica el blur
const STYLE_ID = 'wp-privacy-styles';

const DEFAULT_CONFIG = {
  enabled: false,
  contactos: true,
  mensajes: true,
  hover: true,
  ultimo: true,
  avatars: true,
  media: true
};

let activeConfig = { ...DEFAULT_CONFIG };
let observer = null;

// ─────────────────────────────────────────────────
// Inicialización
// ─────────────────────────────────────────────────
function init() {
  console.log("[WP Privacy] Iniciando...");

  chrome.storage.local.get(DEFAULT_CONFIG, (config) => {
    activeConfig = config;
    console.log("[WP Privacy] Config:", activeConfig);
    applyPrivacyStyles();
    setupObserver();
  });

  chrome.storage.onChanged.addListener((changes) => {
    console.log("[WP Privacy] Cambio detectado:", changes);
    for (let key in changes) {
      activeConfig[key] = changes[key].newValue;
    }
    applyPrivacyStyles();
    setupObserver();
  });
}

// ─────────────────────────────────────────────────
// Etiquetador de mensajes (JS)
// Recorre el DOM y agrega la clase .wp-msg a cada
// contenedor de mensaje, usando [data-testid="msg-meta"]
// como ancla para encontrar el globo padre.
// ─────────────────────────────────────────────────
function tagMessages() {
  const mainPanel = document.querySelector('#main');
  if (!mainPanel) return;

  // Cada mensaje tiene un timestamp con data-testid="msg-meta"
  const metas = mainPanel.querySelectorAll('[data-testid="msg-meta"]');

  metas.forEach(meta => {
    // Subir desde msg-meta hasta el contenedor del mensaje
    // Estructura real del DOM (junio 2026):
    //   div (wrapper externo)        ← nivel 4 = contenedor del mensaje
    //     div (burbuja principal)     ← nivel 3
    //       div (sección inferior)    ← nivel 2
    //         div (wrapper meta)      ← nivel 1
    //           div[data-testid="msg-meta"]  ← nivel 0 (ancla)
    let el = meta;
    for (let i = 0; i < 4; i++) {
      if (!el.parentElement) return;
      el = el.parentElement;
    }

    // Solo etiquetar si no está ya etiquetado
    if (el && !el.classList.contains('wp-msg')) {
      el.classList.add('wp-msg');
    }
  });
}

// ─────────────────────────────────────────────────
// Genera e inyecta las reglas CSS de privacidad
// ─────────────────────────────────────────────────
function applyPrivacyStyles() {
  let styleTag = document.getElementById(STYLE_ID);

  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = STYLE_ID;
    document.head.appendChild(styleTag);
  }

  if (!activeConfig.enabled) {
    styleTag.innerHTML = '';
    clearLastMessageClass();
    return;
  }

  // Etiquetar mensajes antes de aplicar CSS
  tagMessages();

  let css = '';

  // ─────────────────────────────────────────────────
  // 1. CONTACTOS: Nombres e info en la lista lateral
  // ─────────────────────────────────────────────────
  if (activeConfig.contactos) {
    css += `
      #pane-side span[title], 
      [data-testid="cell-frame-container"] span[title],
      [data-testid="chat-list"] span[title],
      header span[title],
      [data-testid="chat-header"] span[title] {
        filter: blur(8px) !important;
        transition: filter 0.25s ease !important;
      }
      
      #pane-side div[role="row"] span[dir="auto"]:not([title]),
      #pane-side div[role="row"] div[dir="ltr"],
      [data-testid="chat-list"] div[role="row"] span[dir="auto"]:not([title]),
      [data-testid="chat-list"] div[role="row"] div[dir="ltr"] {
        filter: blur(10px) !important;
        transition: filter 0.25s ease !important;
      }
    `;
  }

  // ─────────────────────────────────────────────────
  // 2. AVATARES: Fotos de perfil
  // ─────────────────────────────────────────────────
  if (activeConfig.avatars) {
    css += `
      [data-testid="avatar"],
      #pane-side img, 
      [data-testid="chat-list"] img,
      header img, 
      [data-testid="chat-header"] img, 
      [data-testid="avatar"] img,
      #pane-side div[role="row"] img {
        filter: blur(10px) !important;
        transition: filter 0.25s ease !important;
      }
    `;
  }

  // ─────────────────────────────────────────────────
  // 3. MENSAJES: Blur a contenedores etiquetados con .wp-msg
  // ─────────────────────────────────────────────────
  if (activeConfig.mensajes) {
    css += `
      .wp-msg {
        filter: blur(10px) !important;
        transition: filter 0.3s ease !important;
      }
    `;
  }

  // ─────────────────────────────────────────────────
  // 4. MULTIMEDIA: Imágenes, videos, stickers, canvas
  // ─────────────────────────────────────────────────
  if (activeConfig.media) {
    css += `
      /* Multimedia dentro de mensajes */
      .wp-msg img,
      .wp-msg video,
      .wp-msg canvas,
      [data-testid="sticker-container"],
      [data-testid="sticker-container"] img,
      [data-testid="sticker-container"] canvas,

      /* Multimedia en galería y previews */
      [data-testid="media-url-preview"] img,
      [data-testid="media-url-preview"] video,
      [data-testid="image-element"],
      [data-testid="video-element"],
      [data-testid="audio-element"],
      [data-testid="media-gallery"] img,
      [data-testid="media-gallery"] video {
        filter: blur(10px) !important;
        transition: filter 0.25s ease !important;
      }
    `;
  }

  // ─────────────────────────────────────────────────
  // 5. HOVER: Revelar contenido al pasar el cursor
  // ─────────────────────────────────────────────────
  if (activeConfig.hover) {
    css += `
      /* Hover en barra lateral */
      #pane-side div[role="row"]:hover span[title],
      #pane-side div[role="row"]:hover span[dir="auto"],
      #pane-side div[role="row"]:hover div[dir="ltr"],
      #pane-side div[role="row"]:hover img,
      [data-testid="avatar"]:hover,
      [data-testid="avatar"]:hover img,
      header:hover span[title],
      header:hover img,
      [data-testid="chat-header"]:hover span[title],
      [data-testid="chat-header"]:hover img {
        filter: none !important;
      }

      /* Hover en mensajes: revela el globo completo */
      .wp-msg:hover {
        filter: none !important;
      }

      /* Hover en multimedia dentro de mensajes */
      .wp-msg:hover img,
      .wp-msg:hover video,
      .wp-msg:hover canvas,
      [data-testid="sticker-container"]:hover,
      [data-testid="sticker-container"]:hover img,
      [data-testid="sticker-container"]:hover canvas,
      [data-testid="image-element"]:hover,
      [data-testid="video-element"]:hover,
      [data-testid="audio-element"]:hover {
        filter: none !important;
      }
    `;
  }

  // ─────────────────────────────────────────────────
  // 6. ÚLTIMO MENSAJE: Exento de blur
  // ─────────────────────────────────────────────────
  if (activeConfig.ultimo && activeConfig.mensajes) {
    css += `
      .wp-msg.wp-last-message {
        filter: none !important;
      }
    `;
  }

  styleTag.innerHTML = css;
  updateLastMessageUnblur();
}

// Limpia la clase del último mensaje
function clearLastMessageClass() {
  document.querySelectorAll('.wp-last-message').forEach(el => {
    el.classList.remove('wp-last-message');
  });
}

// Marca el último mensaje como visible
function updateLastMessageUnblur() {
  clearLastMessageClass();

  if (!activeConfig.enabled || !activeConfig.mensajes || !activeConfig.ultimo) {
    return;
  }

  const msgs = document.querySelectorAll('.wp-msg');
  if (msgs.length > 0) {
    const last = msgs[msgs.length - 1];
    last.classList.add('wp-last-message');
    console.log("[WP Privacy] Último mensaje marcado.");
  }
}

// ─────────────────────────────────────────────────
// MutationObserver: Re-etiqueta mensajes y actualiza
// el último mensaje cuando el DOM cambia
// ─────────────────────────────────────────────────
function setupObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (!activeConfig.enabled) {
    return;
  }

  let debounceTimer = null;

  observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      tagMessages();
      updateLastMessageUnblur();
    }, 200);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  tagMessages();
  updateLastMessageUnblur();
}

// Iniciar
init();
