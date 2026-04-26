const pool = require('../config/db');

const postModel = {
    async createPost(userId, content, mediaUrl) {
        const query = `
            INSERT INTO posts (user_id, content, media_url)
            VALUES (?, ?, ?)
        `;
        const [result] = await pool.execute(query, [userId, content, mediaUrl]);
        return result.insertId;
    },

    async getFeed(userId, limit = 20, offset = 0) {
        // Fetch posts from followed users OR the user themselves
        const query = `
            SELECT p.id, p.content, p.media_url, p.created_at, 
                   u.id AS author_id, u.username AS author_username, u.avatar_url AS author_avatar,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ? OR p.user_id IN (SELECT followed_id FROM followers WHERE follower_id = ?)
            ORDER BY p.created_at DESC
            LIMIT ${Number(limit)} OFFSET ${Number(offset)}
        `;
        const [rows] = await pool.execute(query, [userId, userId]);
        return rows;
    },
    
    async getGlobalFeed(limit = 20, offset = 0) {
        // Fetch all posts globally
        const query = `
            SELECT p.id, p.content, p.media_url, p.created_at, 
                   u.id AS author_id, u.username AS author_username, u.avatar_url AS author_avatar,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT ${Number(limit)} OFFSET ${Number(offset)}
        `;
        const [rows] = await pool.execute(query);
        return rows;
    },

    async getPostById(postId) {
        const query = `
            SELECT p.id, p.content, p.media_url, p.created_at, p.updated_at,
                   u.id AS author_id, u.username AS author_username, u.avatar_url AS author_avatar,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ? 
            LIMIT 1
        `;
        const [rows] = await pool.execute(query, [postId]);
        return rows[0];
    },

    async deletePost(postId, userId) {
        const query = `
            DELETE FROM posts WHERE id = ? AND user_id = ?
        `;
        const [result] = await pool.execute(query, [postId, userId]);
        return result.affectedRows;
    }
};

module.exports = postModel;
