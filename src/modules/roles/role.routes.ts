import { Router } from "express";
import { getAllRoles, getRoleById, createRole, updateRole, deleteRole } from "./role.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createRoleSchema, updateRoleSchema } from "./role.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("read", "roles"), getAllRoles
    // #swagger.tags = ['Roles']
    // #swagger.summary = 'Get all roles'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.get("/:id", authorize("read", "roles"), getRoleById
    // #swagger.tags = ['Roles']
    // #swagger.summary = 'Get a single role by ID'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.post("/", authorize("create", "roles"), validate(createRoleSchema), createRole
    // #swagger.tags = ['Roles']
    // #swagger.summary = 'Create a new role'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.patch("/:id", authorize("update", "roles"), validate(updateRoleSchema), updateRole
    // #swagger.tags = ['Roles']
    // #swagger.summary = 'Update an existing role'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.delete("/:id", authorize("delete", "roles"), deleteRole
    // #swagger.tags = ['Roles']
    // #swagger.summary = 'Delete a role by ID'
    // #swagger.security = [{ "bearerAuth": [] }]
);

export default router;
