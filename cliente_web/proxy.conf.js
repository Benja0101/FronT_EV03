const PROXY_CONFIG = [
  {
    context: ['/api'],
    target: 'http://localhost:8000',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug'
  }
];

module.exports = PROXY_CONFIG;
