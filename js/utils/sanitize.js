// LIVA - Utilitaires de Sécurité et Sanitisation

/**
 * Échappe les caractères spéciaux HTML pour prévenir les attaques XSS.
 * @param {string} str - La chaîne à nettoyer
 * @returns {string} - La chaîne sécurisée
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Valide qu'une URL utilise un protocole sécurisé (http/https/data:image).
 * @param {string} url - L'URL à tester
 * @param {string} defaultFallback - URL de secours si invalide
 * @returns {string} - L'URL sécurisée
 */
export function sanitizeURL(url, defaultFallback = '') {
  if (!url || typeof url !== 'string') return defaultFallback;
  const clean = url.trim();
  if (clean.startsWith('https://') || clean.startsWith('http://') || clean.startsWith('data:image/') || clean.startsWith('./') || clean.startsWith('/')) {
    return clean;
  }
  return defaultFallback;
}
