import { Router } from "express";
import { getCurrentUser, getAllUsers, getUserById, updateUser, deleteUser, deactivateUser, reactivateUser } from "./user.controller.js";
import { authenticate, authorize, authorizeSelfOr } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { updateUserSchema } from "./user.validator.js";

const router = Router();

// Require authentication for all user routes
router.use(authenticate);

router.get("/me", getCurrentUser
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get current user profile'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.get("/", authorize("read", "users"), getAllUsers
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get all users'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.get("/:id", authorize("read", "users"), getUserById
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get a specific user by ID'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.patch("/:id", authorize("update", "users"), validate(updateUserSchema), updateUser
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Update user details'
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { fullName: 'New Name', roles: ['roleId1', 'roleId2'] } }
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.delete("/:id", authorize("delete", "users"), deleteUser
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Delete user'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.patch("/:id/deactivate", authorizeSelfOr("update", "users"), deactivateUser
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Deactivate user (Self or Admin)'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.patch("/:id/reactivate", authorize("update", "users"), reactivateUser
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Reactivate user (Admin only)'
    // #swagger.security = [{ "bearerAuth": [] }]
);

export default router;
