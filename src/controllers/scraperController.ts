import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import scrapeData from '../services/scraperService';

async function scrape(req: Request, res: Response): Promise<Response> {
  const { url, username, password } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Launch browser here instead of in the service
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--headless',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--remote-debugging-port=9222',
        '--disable-dev-shm-usage',
      ],
      executablePath: '/usr/bin/google-chrome',
      defaultViewport: { width: 1920, height: 1080 },
    });

    try {
      const products = await scrapeData(
        url as string,
        username as string,
        password as string,
        browser, // Pass browser instance
      );

      return res.json(products);
    } finally {
      // Always close the browser
      await browser.close();
    }
  } catch (error: unknown) {
    console.error('Error during scraping:', error);

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
