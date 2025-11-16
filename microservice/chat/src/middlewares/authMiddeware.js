const { findOneUser } = require('../utils/axiosClient');

const authMiddleware = async (req, res, next) => {
    const accessToken = req.cookies?.accessToken || req.headers["authorization"]?.split(" ")[1];
    const refreshToken = req.cookies?.refreshToken || req.headers["x-refresh-token"]?.split(" ")[1];

    try {
        const user = await findOneUser(accessToken, refreshToken);

        if (!user || !user.id) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = user;

        next();
    } catch (error) {
        console.error('Error in authMiddleware:', error);

        if (error.status === 401) {
            return res.status(401).json({ message: 'Unauthorized: Invalid user' });
        } else if (error.status === 404) {
            return res.status(404).json({ message: 'User not found' });
        } else {
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

module.exports = authMiddleware;