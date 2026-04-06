import { Router } from "express";
import { registerSchema, loginSchema } from "./auth.validator.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { registerUser, loginUser, logoutUser, logoutUserFromAllDevices, refreshAccessToken } from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/register-user", validate(registerSchema), registerUser
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Register a new user'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        fullName: { type: "string", example: "Alpha Patel" },
                        username: { type: "string", example: "surajpatel123" },
                        email: { type: "string", example: "patelsuraiko20@gmail.com" },
                        password: { type: "string", example: "SURA2004@" }
                    }
                }
            }
        }
    } */
    // #swagger.responses[201] = { description: 'User registered successfully' }
    // #swagger.responses[400] = { description: 'All fields are required' }
    // #swagger.responses[409] = { description: 'Email or username already taken' }
);

router.post("/login", validate(loginSchema), loginUser
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Login and get access + refresh tokens'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        email: { type: "string", example: "patelsuraiko20@gmail.com" },
                        password: { type: "string", example: "SURA2004@" }
                    }
                }
            }
        }
    } */
    // #swagger.responses[200] = { description: 'Login successful' }
    // #swagger.responses[401] = { description: 'Invalid credentials' }
    // #swagger.responses[404] = { description: 'User not found' }
);

router.post("/logout", authenticate, logoutUser
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Logout current session (revoke refresh token from cookie)'
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['refreshToken'] = { in: 'cookie', name: 'refreshToken', type: 'string', required: true, description: 'Refresh Token' }
    // #swagger.responses[200] = { description: 'Logged out successfully' }
    // #swagger.responses[400] = { description: 'Refresh token is required' }
    // #swagger.responses[401] = { description: 'Authentication required' }
);

router.post("/logout-all", authenticate, logoutUserFromAllDevices
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Logout from all devices (revoke all refresh tokens)'
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.responses[200] = { description: 'Logged out from all devices' }
    // #swagger.responses[401] = { description: 'Authentication required' }
);

router.post("/refresh", refreshAccessToken
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Refresh access token (token rotation)'
    // #swagger.description = 'Uses refresh token from cookie to issue new access + refresh token pair. Old token is revoked.'
    // #swagger.parameters['refreshToken'] = { in: 'cookie', name: 'refreshToken', type: 'string', required: true, description: 'Refresh Token' }
    // #swagger.responses[200] = { description: 'Access token refreshed successfully' }
    // #swagger.responses[400] = { description: 'Refresh token is required' }
    // #swagger.responses[401] = { description: 'Invalid or expired refresh token' }
    // #swagger.responses[403] = { description: 'User account is disabled' }
);

export default router;