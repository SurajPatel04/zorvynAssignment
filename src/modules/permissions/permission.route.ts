import { Router } from "express";
import { getAllPermissions, getPermissionById, createPermission, deletePermission } from "./permission.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createPermissionSchema } from "./permission.validator.js";
import { ROLES } from "../../utils/constant.js";

const router = Router();

router.use(authenticate);

// all permission routes to Admin only
router.use(authorizeRoles(ROLES.ADMIN));

router.get("/", getAllPermissions
    // #swagger.tags = ['Permissions']
    // #swagger.summary = 'Get all permissions, or filter using query parameters (?action=create, ?resource=users, ?page=1, ?limit=10)'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.get("/:id", getPermissionById
    // #swagger.tags = ['Permissions']
    // #swagger.summary = 'Get a single permission by ID'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.post("/", validate(createPermissionSchema), createPermission
    // #swagger.tags = ['Permissions']
    // #swagger.summary = 'Create a new permission'
    // #swagger.security = [{ "bearerAuth": [] }]
);



router.delete("/:id", deletePermission
    // #swagger.tags = ['Permissions']
    // #swagger.summary = 'Delete a permission by ID'
    // #swagger.security = [{ "bearerAuth": [] }]
);

export default router;
