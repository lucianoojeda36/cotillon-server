"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const secretKey = process.env.SECRET_KEY || 'cotillon';
const authenticateToken = (req, res, next) => {
    var _a;
    // Obtener el token del encabezado 'Authorization'
    const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    // Verificar si el token está presente
    if (!token) {
        res.status(401).json({ message: 'Token requerido' });
        return;
    }
    // Verificar el token usando jwt.verify
    jsonwebtoken_1.default.verify(token, secretKey, (err, user) => {
        if (err) {
            res.status(403).json({ message: 'Token inválido' });
            return;
        }
        // Si el token es válido, asignar el usuario a la solicitud (req)
        req.user = user;
        // Llamar al siguiente middleware o controlador
        next();
    });
};
exports.authenticateToken = authenticateToken;
