import { Request, Response } from 'express';
import { Cluster } from 'puppeteer-cluster';
import scrapeData from '../services/scraperService';

let cluster: Cluster<any, any> | null = null;

async function initializeCluster() {
  if (!cluster) {
    cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_BROWSER,
      maxConcurrency: 5, // Número máximo de navegadores concurrentes
      puppeteerOptions: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
        executablePath: '/usr/bin/google-chrome',
      },
    });

    cluster.on('taskerror', (err: unknown, data: unknown) => {
      console.error(`Error en la tarea ${data}:`, err);
    });
  }
}

async function scrape(req: Request, res: Response): Promise<Response> {
  const { url, username, password } = req.query;

  if (!url || !username || !password) {
    return res
      .status(400)
      .json({ error: 'URL, username y password son requeridos.' });
  }

  try {
    await initializeCluster();

    const products = await cluster?.execute(
      { url, username, password },
      scrapeData,
    );

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
