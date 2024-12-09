module.exports = {
  apps: [
    {
      name: 'comercio-server', // Nombre de la aplicación que aparecerá en PM2
      script: 'node', // Usa node como el script para ejecutar
      args: './dist/server.js', // El archivo JS compilado que ejecutará Node
      interpreter: 'xvfb-run', // Especifica xvfb-run como el intérprete para la ejecución
      cwd: './', // Directorio de trabajo de tu proyecto (asegúrate de que este sea correcto)
      watch: false, // Puedes desactivar el watch en producción si no es necesario
      env: {
        NODE_ENV: 'production', // Establece el entorno de la aplicación como 'production'
      },
    },
  ],
};
