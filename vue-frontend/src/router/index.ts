import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "../views/LoginPage.vue";
import DashboardPage from "../views/DashboardPage.vue";
import SignupPage from "../views/SignupPage.vue";
import ProfileTab from "../views/Profile.vue"; // Corrected path casing for consistency
import EmployeesListTab from "../views/List.vue";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
  },
  {
    path: "/signup",
    name: "Signup",
    component: SignupPage,
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardPage,
    meta: { requiresAuth: true },
    redirect: "/dashboard/profile", // default tab
    children: [
      {
        path: "profile",
        name: "ProfileTab",
        component: ProfileTab,
      },
      {
        path: "list",
        name: "EmployeesListTab",
        component: EmployeesListTab,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('authToken')

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next('/login')
    } else {
      next()
    }
  } else if (to.path === '/login' || to.path === '/signup') {
    if (token) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router;
