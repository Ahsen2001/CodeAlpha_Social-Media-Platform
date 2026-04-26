const pool = require('../config/db');

const commentModel = {
    async createComment(postId, userId, content) {
        const query = `
            INSERT INTO comments (post_id, user_id, content)
            VALUES (?, ?, ?)
        `;
        const [result] = await pool.execute(query, [postId, userId, content]);
        return result.insertId;
    },

    async getCommentsByPostId(postId) {
        const query = `
            SELECT c.id, c.content, c.created_at, c.updated_at,
                   u.id AS author_id, u.username AS author_username, u.avatar_url AS author_avatar
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `;
        const [rows] = await pool.execute(query, [postId]);
        return rows;
    },

    async getCommentById(commentId) {
        const query = `
            SELECT c.id, c.content, c.created_at, c.updated_at,
                   u.id AS author_id, u.username AS author_username, u.avatar_url AS author_avatar
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ? LIMIT 1
        `;
        const [rows] = await pool.execute(query, [commentId]);
        return rows[0];
    },

    async deleteComment(commentId, userId) {
        const query = `
            DELETE FROM comments WHERE id = ? AND user_id = ?
        `;
        const [result] = await pool.execute(query, [commentId, userId]);
        return result.affectedRows;
    }
};

module.exports = commentModel;
