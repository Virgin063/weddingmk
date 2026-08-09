module.exports = {
  apps: [{
    name: 'weddingmk',
    script: 'server.js',
    cwd: '/var/www/weddingmk',
    instances: 1,
    autorestart: true,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
