import { chromium } from 'playwright';
import pool from '../config/database';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const blockResources = async (page: any) => {
  await page.route('**/*', (route: any) => {
    const blockedResources = ['image', 'stylesheet', 'font', 'media'];
    if (
      blockedResources.some((type) =>
        route.request().resourceType().includes(type),
      )
    ) {
      route.abort();
    } else {
      route.continue();
    }
  });
};

const waitForSelectorWithRetry = async (
  page: any,
  selector: string,
  options: { visible?: boolean; timeout?: number },
  retries: number = 3,
) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
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
  url,
  username,
  password,
}: {
  url: string;
  username: string;
  password: string;
}) => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await blockResources(page); // Bloquear recursos innecesarios
    await page.setViewportSize({ width: 1280, height: 800 });

    console.log('Navegando a la página...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('Ingresando credenciales...');
    await page.fill('#login_usuario', username);
    await page.fill('#login_clave', password);
    await page.click('.button_login');
    await page.waitForNavigation({
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    console.log('Realizando búsqueda...');
    await page.fill('#buscar_txt', ''); // Término de búsqueda vacío
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
        ).map((product: any) => {
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

      const nextPageExists = await page.evaluate((pageNumber) => {
        return !!document.querySelector(
          `a.ir-pagina[href="javascript:lista_paginar_ir_pagina('${pageNumber}');"]`,
        );
      }, pageNumber + 1);

      if (!nextPageExists) {
        console.log('No hay más páginas.');
        break;
      }

      try {
        await waitForSelectorWithRetry(
          page,
          `a.ir-pagina[href="javascript:lista_paginar_ir_pagina('${
            pageNumber + 1
          }');"]`,
          {
            visible: true,
            timeout: 60000,
          },
        );

        await Promise.all([
          page.waitForNavigation({
            waitUntil: 'domcontentloaded',
            timeout: 60000,
          }),
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
      } catch (error: any) {
        console.error(`Error al cambiar de página: ${error.message}`);
        break; // Detener el scraping si ocurre un error crítico
      }

      pageNumber++;
    }

    console.log('Insertando datos en la base de datos...');
    const chunkSize = 100; // Insertar en lotes
    for (let i = 0; i < products.length; i += chunkSize) {
      const productChunk = products.slice(i, i + chunkSize);
      const values = productChunk
        .map(
          (product) =>
            `('${product.name}', ${product.price}, '${product.imageUrl}', '${product.code}')`,
        )
        .join(',');

      try {
        await pool.query(
          `INSERT INTO products (name, price, image_url, code) 
           VALUES ${values}
           ON CONFLICT (name, code) DO NOTHING`,
        );
      } catch (error) {
        console.error('Error insertando productos:', error);
        break;
      }
    }

    return products;
  } catch (error) {
    console.error('Error durante el scraping:', error);

    // Captura de pantalla para depurar
    await page.screenshot({ path: `error_page_${Date.now()}.png` });

    throw error;
  } finally {
    await page.close(); // Cerrar la página
    await context.close(); // Cerrar el contexto
    await browser.close(); // Asegura que el navegador se cierre
  }
};

export default scrapeData;
