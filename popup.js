// popup.js

class WhatsAppPrivacyManager {
  constructor() {
    this.initElements();
    this.addEventListeners();
  }

  initElements() {
    this.btnPrivacidad = document.getElementById('ocultarChats');
    this.btnSaludar = document.getElementById('miBoton');
    
    // Checkboxes
    this.checkContactos = document.getElementById('checkContactos');
    this.checkMensajes = document.getElementById('checkMensajes');
    this.checkHover = document.getElementById('checkHover');
    this.checkUltimo = document.getElementById('checkUltimo');
  }

  addEventListeners() {
    this.btnPrivacidad.addEventListener('click', () => {
      const config = {
        contactos: this.checkContactos.checked,
        mensajes: this.checkMensajes.checked,
        hover: this.checkHover.checked,
        ultimo: this.checkUltimo.checked
      };
      this.ejecutarEnTab(mainPrivacyLogic, config);
    });

    this.btnSaludar.addEventListener('click', () => alert("¡Hola!"));
  }

  async ejecutarEnTab(funcion, config) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url?.includes("web.whatsapp.com")) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: funcion, // Inyectamos la función independiente
          args: [config]
        });
      } else {
        alert("Por favor, abre WhatsApp Web.");
      }
    } catch (error) {
      console.error("Error al inyectar script:", error);
    }
  }
}

/**
 * Función independiente para inyectar en la página.
 * Se define fuera de la clase para evitar errores de sintaxis al inyectar 
 * (los métodos de clase a veces pierden la palabra clave 'function' al serializarse).
 */
function mainPrivacyLogic(config) {
  const STYLE_ID = 'wp-privacy-styles';
  let styleTag = document.getElementById(STYLE_ID);

  // Si ya existe, lo quitamos (Desactivar)
  if (styleTag) {
    styleTag.remove();
    // Limpiar posibles filtros inline
    document.querySelectorAll('.message-in').forEach(el => el.style.filter = '');
    return;
  }

  // Si no existe, lo creamos (Activar)
  styleTag = document.createElement('style');
  styleTag.id = STYLE_ID;
  
  const BLUR = '20px';
  let css = '';

  if (config.contactos) {
    css += `#pane-side { filter: blur(${BLUR}) !important; transition: filter 0.3s; }\n`;
  }
  
  if (config.mensajes) {
    css += `.message-in, .message-out { filter: blur(${BLUR}) !important; transition: filter 0.2s; }\n`;
  }

  if (config.hover) {
    css += `
      #pane-side:hover, 
      .message-in:hover, 
      .message-out:hover,
      div[role="row"]:hover { 
        filter: none !important; 
      }\n`;
  }

  styleTag.innerHTML = css;
  document.head.appendChild(styleTag);

  // Si quiere ver el último mensaje, lo enfocamos manualmente
  if (config.mensajes && config.ultimo) {
    const received = document.querySelectorAll('.message-in');
    if (received.length > 0) {
      const last = received[received.length - 1];
      last.style.filter = 'none';
      last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// Inicializamos la aplicación cuando el popup esté listo
document.addEventListener('DOMContentLoaded', () => {
  new WhatsAppPrivacyManager();
});