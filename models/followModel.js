const pool = require('../config/db');

const followModel = {
    async followUser(followerId, followedId) {
        try {
            const query = `
                INSERT INTO followers (follower_id, followed_id)
                VALUES (?, ?)
            `;
            await pool.execute(query, [followerId, followedId]);
            return { success: true };
        } catch (error) {
            // ER_DUP_ENTRY indicates duplicate key against PRIMARY KEY (follower_id, followed_id)
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, duplicate: true };
            }
            throw error;
        }
    },

    async unfollowUser(followerId, followedId) {
        const query = `
            DELETE FROM followers WHERE follower_id = ? AND followed_id = ?
        `;
        const [result] = await pool.execute(query, [followerId, followedId]);
        return result.affectedRows;
    },

    async getFollowers(userId) {
        const query = `
            SELECT u.id, u.username, u.avatar_url, u.bio, f.created_at AS followed_on
            FROM followers f
            JOIN users u ON f.follower_id = u.id
            WHERE f.followed_id = ?
            ORDER BY f.created_at DESC
        `;
        const [rows] = await pool.execute(query, [userId]);
        return rows;
    },

    async getFollowing(userId) {
        const query = `
            SELECT u.id, u.username, u.avatar_url, u.bio, f.created_at AS followed_on
            FROM followers f
            JOIN users u ON f.followed_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
        `;
        const [rows] = await pool.execute(query, [userId]);
        return rows;
    }
};

module.exports = followModel;
