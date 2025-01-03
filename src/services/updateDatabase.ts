import cron from 'node-cron';
import scrapeData from './scraperService';

async function updateDatabase() {
  const url = 'https://www.cotilloncasaalberto.com.ar/pedido/login.php';
  const username = 'jose';
  const password = 'rosa301';

  try {
    const products = await scrapeData({
      url,
      username,
      password,
    });
    console.log('Base de datos actualizada con:', products);
  } catch (error) {
    console.error('Error al actualizar la base de datos:', error);
  }
}

cron.schedule('0 0 * * 0', updateDatabase);
