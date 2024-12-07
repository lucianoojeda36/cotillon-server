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
const scraperService_1 = __importDefault(require("../services/scraperService"));
function scrape(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { url, username, password } = req.query;
        // Validación de la URL obligatoria
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        let browser; // Variable para el navegador
        try {
            // Llamada al servicio de scraping
            const scrapeResult = yield (0, scraperService_1.default)(url, username, password);
            browser = scrapeResult.browser; // Guardamos la instancia del navegador
            const { products } = scrapeResult;
            // Enviamos la respuesta con los productos raspados
            return res.json(products);
        }
        catch (error) {
            console.error('Error during scraping:', error);
            if (error instanceof Error) {
                return res
                    .status(500)
                    .json({ error: 'Error scraping the page', details: error.message });
            }
            else {
                return res.status(500).json({ error: 'Unknown error occurred' });
            }
        }
        finally {
            // Aseguramos que el navegador se cierra en cualquier caso
            if (browser) {
                yield browser.close();
            }
        }
    });
}
exports.default = scrape;
