import { Request, Response } from 'express';
import scrapeData from '../services/scraperService'; // El servicio de scraping que usa Playwright

// Eliminamos el uso de Cluster, ya que Playwright maneja la ejecución de múltiples pestañas y páginas de manera más sencilla
async function scrape(req: Request, res: Response): Promise<Response> {
  const { url, username, password } = req.query;

  // Verificar que los parámetros necesarios estén presentes
  if (!url || !username || !password) {
    return res
      .status(400)
      .json({ error: 'URL, username y password son requeridos.' });
  }

  try {
    // Llamada al servicio de scraping utilizando Playwright
    const products = await scrapeData({
      url: String(url),
      username: String(username),
      password: String(password),
    });

    return res.json(products);
  } catch (error: unknown) {
    console.error('Error durante el scraping:', error);

    if (error instanceof Error) {
      return res
        .status(500)
        .json({ error: 'Error scraping the page', details: error.message });
    } else {
      return res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
}

export default scrape;
