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
    },

    async getUserProfileById(id) {
        const query = `
            SELECT u.id, u.username, u.email, u.bio, u.avatar_url, u.created_at,
                   (SELECT COUNT(*) FROM followers WHERE followed_id = u.id) AS followers_count,
                   (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) AS following_count
            FROM users u
            WHERE u.id = ? LIMIT 1
        `;
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    },

    async getUserProfileByUsername(username) {
        const query = `
            SELECT u.id, u.username, u.email, u.bio, u.avatar_url, u.created_at,
                   (SELECT COUNT(*) FROM followers WHERE followed_id = u.id) AS followers_count,
                   (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) AS following_count
            FROM users u
            WHERE u.username = ? LIMIT 1
        `;
        const [rows] = await pool.execute(query, [username]);
        return rows[0];
    },

    async updateUserProfile(id, bio, avatar_url) {
        const query = `
            UPDATE users
            SET bio = COALESCE(?, bio),
                avatar_url = COALESCE(?, avatar_url)
            WHERE id = ?
        `;
        const [result] = await pool.execute(query, [bio, avatar_url, id]);
        return result.affectedRows;
    }
};

module.exports = userModel;
