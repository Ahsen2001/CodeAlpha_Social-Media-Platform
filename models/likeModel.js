const pool = require('../config/db');

const likeModel = {
    async likePost(userId, postId) {
        try {
            const query = `
                INSERT INTO likes (user_id, post_id)
                VALUES (?, ?)
            `;
            const [result] = await pool.execute(query, [userId, postId]);
            return { success: true, insertId: result.insertId };
        } catch (error) {
            // ER_DUP_ENTRY indicates a duplicate key violation against the unique (user_id, post_id) constraint
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, duplicate: true };
            }
            throw error;
        }
    },

    async unlikePost(userId, postId) {
        const query = `
            DELETE FROM likes WHERE user_id = ? AND post_id = ?
        `;
        const [result] = await pool.execute(query, [userId, postId]);
        return result.affectedRows;
    },

    async getLikesCount(postId) {
        const query = `
            SELECT COUNT(*) AS total_likes FROM likes WHERE post_id = ?
        `;
        const [rows] = await pool.execute(query, [postId]);
        return rows[0].total_likes;
    }
};

module.exports = likeModel;
