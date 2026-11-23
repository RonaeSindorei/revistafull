// Dirección del servidor: en tu computadora es localhost; en Vercel es el mismo sitio
const API_URL =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : '';
