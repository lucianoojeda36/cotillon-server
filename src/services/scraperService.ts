import { Page } from 'puppeteer';
import pool from '../config/database';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const blockResources = async (page: Page) => {
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const blockedResources = ['image', 'stylesheet', 'font', 'media'];
    if (blockedResources.includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });
};

const waitForSelectorWithRetry = async (
  page: Page,
  selector: string,
  options: { visible?: boolean; timeout?: number },
  retries: number = 3,
) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (page.mainFrame().isDetached()) {
        console.error('Frame principal desconectado, reintentando...');
        throw new Error('Frame detached');
      }

      await page.waitForSelector(selector, options);
      return; // Éxito, salir del bucle
    } catch (error: any) {
      console.error(`Error en intento ${attempt}:`, error.message);
      if (attempt === retries) {
        throw error;
      }
      await delay(2000); // Pausa antes de reintentar
    }
  }
};

const scrapeData = async ({
  page,
  data: { url, username, password },
}: {
  page: Page;
  data: { url: string; username: string; password: string };
}) => {
  await blockResources(page); // Bloquear recursos innecesarios
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    console.log('Ingresando credenciales...');
    await page.type('#login_usuario', username);
    await page.type('#login_clave', password);
    await page.click('.button_login');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    console.log('Realizando búsqueda...');
    await page.type('#buscar_txt', ''); // Término de búsqueda vacío
    await page.click('#buscar_menu button[type="submit"]');
    await waitForSelectorWithRetry(page, '.producto_contenedor', {
      visible: true,
      timeout: 60000,
    });

    let products: Array<any> = [];
    let pageNumber = 1;

    while (true) {
      console.log(`Extrayendo datos - Página ${pageNumber}...`);

      const newProducts = await page.evaluate(() => {
        const baseUrl = 'https://www.cotilloncasaalberto.com.ar/pedido/';
        return Array.from(
          document.querySelectorAll('.producto_contenedor'),
        ).map((product) => {
          const name =
            product.querySelector('.producto_txt a')?.textContent?.trim() || '';
          const price =
            product.querySelector('.producto_precio')?.textContent?.trim() ||
            '';
          const relativeImageUrl =
            product.querySelector('.producto_imagen')?.getAttribute('src') ||
            '';
          const imageUrl = relativeImageUrl ? baseUrl + relativeImageUrl : '';
          const code =
            product
              .querySelector('.producto_id')
              ?.textContent?.replace('Código:', '')
              .trim() || '';
          const cleanPrice = parseFloat(
            price.replace(/[^\d.,-]/g, '').replace(',', '.'),
          );
          return { name, price: cleanPrice, imageUrl, code };
        });
      });

      products = [...products, ...newProducts];

      // Validar si hay más páginas
      const nextPageExists = await page.evaluate((pageNumber) => {
        return !!document.querySelector(
          `a.ir-pagina[href="javascript:lista_paginar_ir_pagina('${pageNumber}');"]`,
        );
      }, pageNumber + 1);

      if (!nextPageExists) {
        console.log('No hay más páginas.');
        break;
      }

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        page.click(
          `a.ir-pagina[href="javascript:lista_paginar_ir_pagina('${
            pageNumber + 1
          }');"]`,
        ),
      ]);

      await waitForSelectorWithRetry(page, '.producto_contenedor', {
        visible: true,
        timeout: 60000,
      });

      pageNumber++;
    }

    console.log('Insertando datos en la base de datos...');
    for (const product of products) {
      if (!product.name || !product.price || !product.code) continue;
      await pool.query(
        `INSERT INTO products (name, price, image_url, code) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name, code) DO NOTHING`,
        [product.name, product.price, product.imageUrl, product.code],
      );
    }

    return products;
  } catch (error) {
    console.error('Error durante el scraping:', error);

    // Captura de pantalla para depurar
    await page.screenshot({ path: `error_page_${Date.now()}.png` });

    throw error;
  } finally {
    await page.close(); // Asegura que la página se cierre
  }
};

export default scrapeData;
