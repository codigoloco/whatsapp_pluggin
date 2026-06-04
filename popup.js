// popup.js - WhatsApp Privacy Pro

const DEFAULT_CONFIG = {
  enabled: false,
  contactos: true,
  mensajes: true,
  hover: true,
  ultimo: true,
  avatars: true, // Coincide con el estado 'checked' en el HTML
  media: true    // Coincide con el estado 'checked' en el HTML
};

const switchesConfig = [
  { id: 'checkMaster', key: 'enabled' },
  { id: 'checkContactos', key: 'contactos' },
  { id: 'checkAvatars', key: 'avatars' },
  { id: 'checkMensajes', key: 'mensajes' },
  { id: 'checkMedia', key: 'media' },
  { id: 'checkHover', key: 'hover' },
  { id: 'checkUltimo', key: 'ultimo' }
];

document.addEventListener('DOMContentLoaded', () => {
  initElementsAndLoadSettings();
});

function initElementsAndLoadSettings() {
  const statusBadge = document.getElementById('statusBadge');
  const masterCard = document.getElementById('masterCard');

  // Cargar configuración guardada y aplicarla a los switches
  chrome.storage.local.get(DEFAULT_CONFIG, (config) => {
    switchesConfig.forEach(({ id, key }) => {
      const el = document.getElementById(id);
      if (el) {
        el.checked = config[key];
      }
    });

    updateUIState(config.enabled, statusBadge, masterCard);
  });

  // Asignar listeners de cambio a todos los switches
  switchesConfig.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        
        // Guardar el cambio inmediatamente en storage local
        chrome.storage.local.set({ [key]: isChecked }, () => {
          if (key === 'enabled') {
            updateUIState(isChecked, statusBadge, masterCard);
          }
        });
      });
    }
  });
}

// Actualiza el indicador visual de estado y tarjeta principal
function updateUIState(isEnabled, statusBadge, masterCard) {
  if (!statusBadge || !masterCard) return;

  if (isEnabled) {
    statusBadge.textContent = 'Activo';
    statusBadge.classList.add('active');
    masterCard.classList.add('active');
  } else {
    statusBadge.textContent = 'Inactivo';
    statusBadge.classList.remove('active');
    masterCard.classList.remove('active');
  }
}