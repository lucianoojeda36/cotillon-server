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
exports.getProfile = exports.logoutUser = exports.refreshAccessToken = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const secretKey = process.env.SECRET_KEY || 'cotillon';
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield database_1.default.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *', [name, email, hashedPassword]);
        res
            .status(201)
            .json({ message: 'Usuario registrado', user: newUser.rows[0] });
        return;
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error to register user');
        return;
    }
});
exports.registerUser = registerUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const userResult = yield database_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Contraseña incorrecta' });
            return;
        }
        const payload = { id: user.id, email: user.email };
        const token = jsonwebtoken_1.default.sign(payload, secretKey, { expiresIn: '1h' });
        const refreshToken = jsonwebtoken_1.default.sign(payload, secretKey, { expiresIn: '7d' });
        yield database_1.default.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [
            refreshToken,
            user.id,
        ]);
        res.json({ token, refreshToken });
        return;
    }
    catch (error) {
        console.log(error);
        res.status(500).send('error to login user');
        return;
    }
});
exports.loginUser = loginUser;
const refreshAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        const userResult = yield database_1.default.query('SELECT * FROM users WHERE refresh_token = $1', [refreshToken]);
        const user = userResult.rows[0];
        if (!user) {
            res.status(403).json({ message: 'Refresh token inválido' });
            return;
        }
        const newAccessToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, secretKey, { expiresIn: '1h' });
        res.json({ token: newAccessToken });
        return;
    }
    catch (error) {
        console.log(error);
        res.status(500).send('error en el refreshtoken');
        return;
    }
});
exports.refreshAccessToken = refreshAccessToken;
const logoutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        yield database_1.default.query('UPDATE users SET refresh_token = NULL WHERE refresh_token = $1', [refreshToken]);
        return res.json({ message: 'Logout exitoso' });
    }
    catch (error) {
        console.log(error);
        return res.status(500).send('error al salir del usuario');
    }
});
exports.logoutUser = logoutUser;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Se recomienda usar un ID único o extraer información desde el JWT
        const { id } = req.user; // Asumiendo que `req.user` contiene los datos del token JWT
        // Consulta basada en ID único
        const userResult = yield database_1.default.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
        // Verificar si el usuario existe
        if (userResult.rows.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        // Obtener los datos del usuario
        const user = userResult.rows[0];
        // Enviar respuesta con los datos del usuario
        res.status(200).json(user); // Aquí sí retornamos la respuesta al cliente
        return;
    }
    catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
        return;
    }
});
exports.getProfile = getProfile;
