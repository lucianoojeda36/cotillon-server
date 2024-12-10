import { Request, Response } from 'express';
import { Cluster } from 'puppeteer-cluster';
import scrapeData from '../services/scraperService';
import os from 'os';
import { existsSync } from 'fs';

let cluster: Cluster<any, any> | null = null;

function getExecutablePath(): string {
  const platform = os.platform();

  if (platform === 'darwin') {
    const macPath =
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (existsSync(macPath)) {
      return macPath;
    }
  } else if (platform === 'linux') {
    const linuxPaths = ['/usr/bin/google-chrome', '/usr/bin/chromium'];
    for (const path of linuxPaths) {
      if (existsSync(path)) {
        return path;
      }
    }
  } else if (platform === 'win32') {
    const winPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];
    for (const path of winPaths) {
      if (existsSync(path)) {
        return path;
      }
    }
  }

  throw new Error('No suitable Chrome/Chromium executable found!');
}

async function initializeCluster() {
  if (!cluster) {
    const executablePath = getExecutablePath();
    const cpuCount = os.cpus().length;
    const maxConcurrency = Math.min(cpuCount, 5);

    cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_PAGE,
      maxConcurrency,
      puppeteerOptions: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-accelerated-2d-canvas',
          '--disable-blink-features=AutomationControlled',
        ],
        executablePath,
      },
      timeout: 60000, // Aumentar el tiempo de espera a 1 minuto
    });

    cluster.on('taskerror', (err: unknown, data: unknown) => {
      console.error(
        `Error en la tarea con datos ${JSON.stringify(data)}:`,
        err,
      );
    });
  }
}

// Función para intentar ejecutar una tarea varias veces en caso de error
async function retryTask(
  task: Function,
  retries: number,
  delay: number,
): Promise<any> {
  let lastError: any = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      console.error(`Intento ${attempt + 1} fallido:`, error);

      // Espera antes de reintentar
      if (attempt < retries - 1) {
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  // Si fallan todos los intentos, lanzamos el último error
  throw lastError;
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

    // Ejecuta el scraper con manejo de reintentos
    const products = await retryTask(
      async () => {
        return await cluster?.execute(
          { url, username, password },
          async ({ page, data }) => {
            try {
              await page.goto(data.url, {
                waitUntil: 'domcontentloaded',
                timeout: 60000,
              });
              await page.waitForSelector('selector', { timeout: 60000 }); // Espera un selector específico

              // Aquí, agrega tu lógica de scraping
              return scrapeData(data); // Si tu lógica de scraping es un servicio
            } catch (err) {
              console.error('Error durante la navegación o scraping:', err);
              throw err; // Lanzar error para el reintento
            }
          },
        );
      },
      3,
      5000,
    ); // Reintentos 3 veces, con 5 segundos de espera entre reintentos

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
