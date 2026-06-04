// content.js - WhatsApp Privacy Pro
const STYLE_ID = 'wp-privacy-styles';

// Configuración por defecto
const DEFAULT_CONFIG = {
  enabled: false,
  contactos: true,
  mensajes: true,
  hover: true,
  ultimo: true,
  avatars: false,
  media: false
};

let activeConfig = { ...DEFAULT_CONFIG };
let observer = null;

// Inicialización
function init() {
  console.log("[WhatsApp Privacy Pro] Inicializando script de contenido...");
  
  chrome.storage.local.get(DEFAULT_CONFIG, (config) => {
    activeConfig = config;
    console.log("[WhatsApp Privacy Pro] Configuración cargada al inicio:", activeConfig);
    applyPrivacyStyles();
    setupObserver();
  });

  // Escuchar cambios en la configuración desde el popup
  chrome.storage.onChanged.addListener((changes) => {
    console.log("[WhatsApp Privacy Pro] Cambios de configuración detectados:", changes);
    for (let key in changes) {
      activeConfig[key] = changes[key].newValue;
    }
    applyPrivacyStyles();
    setupObserver();
  });
}

// Genera e inyecta las reglas CSS de privacidad
function applyPrivacyStyles() {
  let styleTag = document.getElementById(STYLE_ID);

  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = STYLE_ID;
    document.head.appendChild(styleTag);
    console.log("[WhatsApp Privacy Pro] Elemento <style> creado.");
  }

  if (!activeConfig.enabled) {
    styleTag.innerHTML = '';
    console.log("[WhatsApp Privacy Pro] Filtros desactivados (Modo Privado = OFF).");
    clearLastMessageClass();
    return;
  }

  console.log("[WhatsApp Privacy Pro] Aplicando reglas CSS de privacidad...");
  const BLUR_VAL = '18px';
  const MEDIA_BLUR_VAL = '25px';
  let css = '';

  // 1. Desenfocar Contactos (Nombre e info en la lista de chats)
  if (activeConfig.contactos) {
    css += `
      /* Nombres de contactos en la lista y cabecera de chat */
      #pane-side span[title], 
      [data-testid="cell-frame-container"] span[title],
      [data-testid="chat-list"] span[title],
      header span[title],
      [data-testid="chat-header"] span[title] {
        filter: blur(10px) !important;
        transition: filter 0.25s ease !important;
      }
      
      /* Vista previa del último mensaje en la lista de chats */
      #pane-side div[role="row"] span[dir="auto"]:not([title]),
      #pane-side div[role="row"] div[dir="ltr"],
      [data-testid="chat-list"] div[role="row"] span[dir="auto"]:not([title]),
      [data-testid="chat-list"] div[role="row"] div[dir="ltr"] {
        filter: blur(12px) !important;
        transition: filter 0.25s ease !important;
      }
    `;
  }

  // 2. Desenfocar Avatares (Fotos de perfil)
  if (activeConfig.avatars) {
    css += `
      #pane-side img, 
      [data-testid="chat-list"] img,
      header img, 
      [data-testid="chat-header"] img, 
      [data-testid="avatar"] img {
        filter: blur(${MEDIA_BLUR_VAL}) !important;
        transition: filter 0.25s ease !important;
      }
    `;
  }

  // 3. Desenfocar Mensajes (Texto del chat activo)
  if (activeConfig.mensajes) {
    css += `
      .message-in, .message-out, [data-testid="msg-container"] {
        filter: blur(${BLUR_VAL}) !important;
        transition: filter 0.25s ease !important;
      }
    `;
  }

  // 4. Desenfocar Multimedia (Imágenes, videos, audios, stickers)
  if (activeConfig.media) {
    css += `
      .message-in img, .message-out img,
      .message-in video, .message-out video,
      [data-testid="image-element"],
      [data-testid="video-element"],
      [data-testid="audio-element"],
      .copyable-text img,
      div[role="img"] img,
      .message-in [role="img"], .message-out [role="img"] {
        filter: blur(${MEDIA_BLUR_VAL}) !important;
        transition: filter 0.25s ease !important;
      }
    `;
  }

  // 5. Revelar al pasar el mouse (Efecto Hover)
  if (activeConfig.hover) {
    css += `
      #pane-side span[title]:hover,
      [data-testid="cell-frame-container"] span[title]:hover,
      [data-testid="chat-list"] span[title]:hover,
      header span[title]:hover,
      [data-testid="chat-header"] span[title]:hover,
      #pane-side div[role="row"] span[dir="auto"]:not([title]):hover,
      #pane-side div[role="row"] div[dir="ltr"]:hover,
      [data-testid="chat-list"] div[role="row"] span[dir="auto"]:not([title]):hover,
      [data-testid="chat-list"] div[role="row"] div[dir="ltr"]:hover,
      #pane-side img:hover, 
      [data-testid="chat-list"] img:hover,
      header img:hover, 
      [data-testid="chat-header"] img:hover, 
      [data-testid="avatar"] img:hover,
      .message-in:hover, .message-out:hover, [data-testid="msg-container"]:hover,
      .message-in img:hover, .message-out img:hover,
      [data-testid="image-element"]:hover, [data-testid="video-element"]:hover,
      [data-testid="audio-element"]:hover, div[role="img"] img:hover {
        filter: none !important;
      }
    `;
  }

  // 6. Regla para exceptuar el último mensaje recibido
  css += `
    .wp-last-message {
      filter: none !important;
    }
  `;

  styleTag.innerHTML = css;
  updateLastMessageUnblur();
}

// Limpia la clase del último mensaje en todos los elementos
function clearLastMessageClass() {
  document.querySelectorAll('.wp-last-message').forEach(el => {
    el.classList.remove('wp-last-message');
  });
}

// Identifica el último mensaje recibido y le aplica la clase de excepción
function updateLastMessageUnblur() {
  clearLastMessageClass();

  if (!activeConfig.enabled || !activeConfig.mensajes || !activeConfig.ultimo) {
    return;
  }

  // Obtenemos todos los mensajes entrantes (recibidos)
  const received = document.querySelectorAll('.message-in');
  if (received.length > 0) {
    const last = received[received.length - 1];
    last.classList.add('wp-last-message');
  }
}

// Configura el MutationObserver para rastrear cambios en el DOM
function setupObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (!activeConfig.enabled || !activeConfig.ultimo) {
    return;
  }

  observer = new MutationObserver(() => {
    updateLastMessageUnblur();
  });

  // Observamos cambios estructurales en el body para detectar nuevos mensajes o cambio de chat
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Ejecución inicial
  updateLastMessageUnblur();
}

// Iniciar script
init();
