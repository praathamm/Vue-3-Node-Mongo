import { createRouter, createWebHistory, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router';
import LoginPage from '../views/LoginPage.vue';
import SignupPage from '../views/SignupPage.vue';
import DashboardPage from '../views/DashboardPage.vue';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    redirect: () => {
      const authStore = useAuthStore();
      return authStore.isAuthenticated ? '/dashboard' : '/login';
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    beforeEnter: (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated) {
        next('/dashboard');
      } else {
        next();
      }
    },
  },
  {
    path: '/signup',
    name: 'Signup',
    component: SignupPage,
    beforeEnter: (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated) {
        next('/dashboard');
      } else {
        next();
      }
    },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
    return;
  }

  next();
});

export default router;
