module.exports = {
  apps: [
    {
      name: 'comercio-server', // Nombre de la aplicación que aparecerá en PM2
      script: 'xvfb-run', // Usamos xvfb-run como el script que PM2 ejecutará
      args: '-a node ./dist/server.js', // El comando que se ejecutará (reemplaza con la ruta a tu archivo .js compilado)
      cwd: './', // Directorio de trabajo de tu proyecto (asegúrate de que este sea correcto)
      watch: false, // Puedes desactivar el watch en producción si no es necesario
      env: {
        NODE_ENV: 'production', // Establece el entorno de la aplicación como 'production'
      },
    },
  ],
};
