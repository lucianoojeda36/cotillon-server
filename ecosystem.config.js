module.exports = {
  apps: [
    {
      name: 'comercio-server',
      script: './dist/server.js',
      interpreter: 'node',
      args: '',
      cwd: './',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'update-database-job',
      script: './dist/services/updateDatabase.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
