import { Request, Response } from 'express';
import scrapeData from '../services/scraperService';

async function scrape(req: Request, res: Response): Promise<Response> {
  const { url, username, password } = req.query;

  // Validación de la URL obligatoria
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let browser: any; // Variable para el navegador

  try {
    // Llamada al servicio de scraping
    const scrapeResult = await scrapeData(
      url as string,
      username as string,
      password as string,
    );

    browser = scrapeResult.browser; // Guardamos la instancia del navegador
    const { products } = scrapeResult;

    // Enviamos la respuesta con los productos raspados
    return res.json(products);
  } catch (error: unknown) {
    console.error('Error during scraping:', error);

    if (error instanceof Error) {
      return res
        .status(500)
        .json({ error: 'Error scraping the page', details: error.message });
    } else {
      return res.status(500).json({ error: 'Unknown error occurred' });
    }
  } finally {
    // Aseguramos que el navegador se cierra en cualquier caso
    if (browser) {
      await browser.close();
    }
  }
}

export default scrape;
