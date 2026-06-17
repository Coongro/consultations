// Extiende el preset core para generar las utilidades cg-* que usan las vistas
// del plugin (paleta gold/teal/red/neutral + serif/sans + radios/shadows). Sin el
// preset, clases como cg-gold-soft o font-serif del catálogo de servicios no se
// emiten. preflight:false evita duplicar el reset del host (mismo patrón que
// billing/patients). El content incluye patients/contacts por los view-overrides
// compartidos.
const baseConfig = require('../../packages/tailwind-config/index.cjs');

module.exports = {
  presets: [baseConfig],
  content: [
    './src/**/*.{ts,tsx}',
    '../patients/src/**/*.{ts,tsx}',
    '../contacts/src/**/*.{ts,tsx}',
  ],
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
