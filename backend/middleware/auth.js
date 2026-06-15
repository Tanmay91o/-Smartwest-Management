import User from '../models/userModel.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = '7b5274bd1e98cc9b96e3dcc94579fce95974f0a1a844ec1f4bdad01d0952d352';

export default async function authMiddleware(req, res, next) {
    // grab the token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        return res.status(401).json({
            success: false,
            meaasge: "Not authorized or token missing"
        })
    }
    const token = authHeader.split(" ")[1]

    // to verify the token 
    try {
        const payload = jwt.verify(token, JWT_SECRET)
        const user = await User.findById(payload.id).select("-password")
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            })
        }
        req.user = user
        next()
    } catch (err) {
        console.error("JWT verification failed:", err);
        return res.status(401).json({
            success: false,
            message: "Token invalid or expired"
        })
    }
}

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMGE5NzJhYTc5NmYzYzQ4NDA4MDNjMyIsImlhdCI6MTc3OTA3ODk1NSwiZXhwIjoxNzc5NjgzNzU1fQ.uB0fasaQ1SNtdYw154x2q2a060YPT0ZewHqIfpWcifQ register

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMGE5NzJhYTc5NmYzYzQ4NDA4MDNjMyIsImlhdCI6MTc3OTA3OTA0MywiZXhwIjoxNzc5NjgzODQzfQ.wDDbaa_D7BqaFORf1bWw6mXKN2hQwLU89_favS5Sha8  login