import express, { Request, Response } from 'express';
import scrape from '../controllers/scraperController';

const router = express.Router();

router.get('/scrape', async (req: Request, res: Response) => {
  try {
    await scrape(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Scraping failed' });
  }
});

router.get('/pepe', (req: Request, res: Response) => {
  try {
    res.status(200).send('entro a ppee');
  } catch (error) {
    res.status(500).json({ error: 'Scraping failed' });
  }
});

export default router;
