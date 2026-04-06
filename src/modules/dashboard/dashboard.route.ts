import { Router } from "express";
import { getSummary, getCategoryTotals, getTrends, getRecentActivity } from "./dashboard.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.use(authorize("read", "dashboard"));

router.get("/summary", getSummary
    // #swagger.tags = ['Dashboard']
    // #swagger.summary = 'Get total income, expenses, and net balance'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.get("/category-totals", getCategoryTotals
    // #swagger.tags = ['Dashboard']
    // #swagger.summary = 'Get category-wise breakdown (?type=income or ?type=expense)'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.get("/trends", getTrends
    // #swagger.tags = ['Dashboard']
    // #swagger.summary = 'Get monthly or weekly trends (?period=weekly or ?period=monthly)'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.get("/recent", getRecentActivity
    // #swagger.tags = ['Dashboard']
    // #swagger.summary = 'Get recent transactions (?limit=10)'
    // #swagger.security = [{ "bearerAuth": [] }]
);

export default router;
