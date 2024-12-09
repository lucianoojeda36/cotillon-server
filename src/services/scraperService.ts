import pool from '../config/database';
import { Browser, Page } from 'puppeteer';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForSelectorWithRetry = async (
  page: Page,
  selector: string,
  options: { visible?: boolean; timeout?: number },
  retries: number = 3,
) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await page.waitForSelector(selector, options);
      return; // Éxito, salir del bucle
    } catch (err) {
      if (attempt === retries) throw err; // Lanza el error si falla tras los reintentos
      console.log(
        `Reintento ${attempt}/${retries} para el selector ${selector}`,
      );
      await delay(2000); // Pausa antes de reintentar
    }
  }
};

const scrapeData = async (
  url: string,
  username: string,
  password: string,
  browser: Browser,
) => {
  const page: Page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    console.log('Ingresando credenciales...');
    await page.type('#login_usuario', username);
    await page.type('#login_clave', password);
    await page.click('.button_login');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    const searchTerm = '';
    await page.type('#buscar_txt', searchTerm);
    await page.click('#buscar_menu button[type="submit"]');
    await waitForSelectorWithRetry(page, '.producto_contenedor', {
      visible: true,
      timeout: 60000,
    });

    let pageNumber = 1;
    let products: Array<any> = [];

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
      const nextPageLink = await page.$(
        `a.ir-pagina[href="javascript:lista_paginar_ir_pagina('${
          pageNumber + 1
        }');"]`,
      );

      if (!nextPageLink) {
        console.log('No hay más páginas.');
        break;
      }

      await nextPageLink.click();
      await waitForSelectorWithRetry(page, '.producto_contenedor', {
        visible: true,
        timeout: 60000,
      });
      pageNumber++;
    }

    // Inserta los productos en la base de datos
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
    throw error;
  } finally {
    await page.close(); // Asegura que la página se cierre
  }
};

export default scrapeData;
