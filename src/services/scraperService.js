"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const database_1 = __importDefault(require("../config/database")); // Configuración de base de datos
const scrapeData = (url, username, password) => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer_1.default.launch({ headless: false, slowMo: 50 });
    const page = yield browser.newPage();
    try {
        yield page.setViewport({ width: 1280, height: 800 });
        yield page.goto(url, { waitUntil: 'domcontentloaded' });
        console.log('Ingresando credenciales...');
        yield page.type('#login_usuario', username);
        yield page.type('#login_clave', password);
        yield page.click('.button_login');
        yield page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        const searchTerm = '';
        yield page.type('#buscar_txt', searchTerm);
        yield page.click('#buscar_menu button[type="submit"]');
        yield page.waitForSelector('.producto_contenedor', { visible: true });
        let pageNumber = 1;
        let products = [];
        while (true) {
            console.log(`Extrayendo datos - Página ${pageNumber}...`);
            const newProducts = yield page.evaluate(() => {
                const baseUrl = 'https://www.cotilloncasaalberto.com.ar/pedido/';
                return Array.from(document.querySelectorAll('.producto_contenedor')).map((product) => {
                    var _a, _b, _c, _d, _e, _f, _g;
                    const name = ((_b = (_a = product.querySelector('.producto_txt a')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
                    const price = ((_d = (_c = product.querySelector('.producto_precio')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) ||
                        '';
                    const relativeImageUrl = ((_e = product.querySelector('.producto_imagen')) === null || _e === void 0 ? void 0 : _e.getAttribute('src')) ||
                        '';
                    const imageUrl = relativeImageUrl ? baseUrl + relativeImageUrl : '';
                    const code = ((_g = (_f = product
                        .querySelector('.producto_id')) === null || _f === void 0 ? void 0 : _f.textContent) === null || _g === void 0 ? void 0 : _g.replace('Código:', '').trim()) || '';
                    const cleanPrice = parseFloat(price.replace(/[^\d.,-]/g, '').replace(',', '.'));
                    return { name, price: cleanPrice, imageUrl, code };
                });
            });
            products = [...products, ...newProducts];
            const nextPageLink = yield page.$(`a.ir-pagina[href="javascript:lista_paginar_ir_pagina('${pageNumber + 1}');"]`);
            if (!nextPageLink) {
                console.log('No hay más páginas.');
                break;
            }
            yield nextPageLink.click();
            yield page.waitForSelector('.producto_contenedor', { visible: true });
            pageNumber++;
        }
        // Inserta los productos en la base de datos
        for (const product of products) {
            if (!product.name || !product.price || !product.code)
                continue;
            yield database_1.default.query(`INSERT INTO products (name, price, image_url, code) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name, code) DO NOTHING`, [product.name, product.price, product.imageUrl, product.code]);
        }
        return { products, browser }; // Devuelve los datos y el navegador
    }
    catch (error) {
        console.error('Error durante el scraping:', error);
        yield browser.close(); // Asegúrate de cerrar el navegador si ocurre un error
        throw error; // Lanza el error para manejarlo en otro nivel
    }
});
exports.default = scrapeData;
