import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import CamerasView from "../views/CamerasView.vue";
import CameraDetailView from "../views/CameraDetailView.vue";
import StatisticsView from "../views/StatisticsView.vue";
import { isAuthenticated, isAdmin } from "../utils/auth";
import ChangePasswordView from "../views/ChangePasswordView.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            name: "home",
            component: HomeView,
        },
        {
            path: "/login",
            name: "login",
            component: LoginView,
        },
        {
            path: "/dashboard",
            name: "dashboard",
            component: () => import("../views/DashboardView.vue"),
            meta: { requiresAuth: true, adminForbidden: true },
        },
        {
            path: "/cameras",
            name: "cameras",
            component: CamerasView,
            meta: { requiresAuth: true, adminForbidden: true },
        },
        {
            path: "/cameras/:id",
            name: "camera-detail",
            component: CameraDetailView,
            meta: { requiresAuth: true, adminForbidden: true },
        },
        {
            path: "/map",
            name: "map",
            component: () => import("../views/MapView.vue"),
        },
        {
            path: "/statistics",
            name: "statistics",
            component: StatisticsView,
            meta: { requiresAuth: true, adminForbidden: true },
        },
        {
            path: "/change-password",
            name: "change-password",
            component: ChangePasswordView,
            meta: { requiresAuth: true },
        },
        // Admin Routes
        {
            path: "/users",
            name: "admin",
            component: () => import("../views/AdminView.vue"),
            meta: { requiresAuth: true, requiresAdmin: true },
            children: [
                {
                    path: "",
                    name: "admin-users",
                    component: () => import("../components/admin/UsersList.vue"),
                },
                {
                    path: "users/new",
                    name: "admin-user-create",
                    component: () => import("../components/admin/UserForm.vue"),
                },
                {
                    path: "users/:id",
                    name: "admin-user-detail",
                    component: () => import("../components/admin/UserDetail.vue"),
                },
                {
                    path: "users/:id/edit",
                    name: "admin-user-edit",
                    component: () => import("../components/admin/UserForm.vue"),
                    props: { isEditing: true },
                },
            ],
        },
    ],
});

// Navigation guard to check authentication and role requirements
router.beforeEach((to, from, next) => {
    // Check if the route requires authentication
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!isAuthenticated()) {
            next({
                name: "login",
                // Store the intended destination to redirect after login
                query: { redirect: to.fullPath },
            });
            return;
        }

        // Check if the route is forbidden for admins
        if (to.matched.some(record => record.meta.adminForbidden) && isAdmin()) {
            next({ name: "admin" });
            return;
        }

        // Check if the route requires admin role
        if (to.matched.some(record => record.meta.requiresAdmin) && !isAdmin()) {
            next({ name: "dashboard" });
            return;
        }
    }

    // Special case for login page - redirect logged in users appropriately
    if (to.name === "login" && isAuthenticated()) {
        if (isAdmin()) {
            next({ name: "admin" });
        } else {
            next({ name: "dashboard" });
        }
        return;
    }

    next();
});

export default router;
