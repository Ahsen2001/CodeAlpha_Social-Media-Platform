const pool = require('../config/db');

const userModel = {
    async createUser(username, email, passwordHash) {
        const query = `
            INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)
        `;
        const [result] = await pool.execute(query, [username, email, passwordHash]);
        return result;
    },

    async findUserByEmail(email) {
        const query = `
            SELECT * FROM users WHERE email = ? LIMIT 1
        `;
        const [rows] = await pool.execute(query, [email]);
        return rows[0];
    },

    async findUserByUsername(username) {
        const query = `
            SELECT * FROM users WHERE username = ? LIMIT 1
        `;
        const [rows] = await pool.execute(query, [username]);
        return rows[0];
    },
    
    async findUserById(id) {
        const query = `
            SELECT id, username, email, bio, avatar_url, created_at, updated_at 
            FROM users 
            WHERE id = ? LIMIT 1
        `;
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    }
};

module.exports = userModel;
