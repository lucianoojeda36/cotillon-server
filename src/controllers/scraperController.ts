import { Request, Response } from 'express';
import { Cluster } from 'puppeteer-cluster';
import scrapeData from '../services/scraperService';
import os from 'os';
import { existsSync } from 'fs';

let cluster: Cluster<any, any> | null = null;

function getExecutablePath(): string {
  const platform = os.platform();

  if (platform === 'darwin') {
    // macOS
    const macPath =
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (existsSync(macPath)) {
      return macPath;
    }
  } else if (platform === 'linux') {
    // Linux
    const linuxPaths = ['/usr/bin/google-chrome', '/usr/bin/chromium'];
    for (const path of linuxPaths) {
      if (existsSync(path)) {
        return path;
      }
    }
  } else if (platform === 'win32') {
    // Windows
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
    const cpuCount = os.cpus().length; // Detectar núcleos de CPU disponibles
    const maxConcurrency = Math.min(cpuCount, 5); // Ajuste dinámico de concurrencia

    cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_PAGE, // Usa páginas en lugar de navegadores completos
      maxConcurrency, // Número máximo de páginas concurrentes
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
      timeout: 60000, // Tiempo máximo por tarea
    });

    cluster.on('taskerror', (err: unknown, data: unknown) => {
      console.error(
        `Error en la tarea con datos ${JSON.stringify(data)}:`,
        err,
      );
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
