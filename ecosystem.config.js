module.exports = {
  apps: [
    {
      name: 'comercio-server', // Nombre de la aplicación que aparecerá en PM2
      script: './dist/server.js', // El archivo JS compilado que ejecutará Node
      interpreter: 'xvfb-run', // Usa xvfb-run como el intérprete
      interpreter_args: 'node', // Argumentos para el intérprete (xvfb-run ejecutará node)
      args: '', // No necesitas argumentos adicionales para el script
      cwd: './', // Directorio de trabajo de tu proyecto
      watch: false, // Puedes desactivar el watch en producción si no es necesario
      env: {
        NODE_ENV: 'production', // Establece el entorno de la aplicación como 'production'
      },
    },
  ],
};
