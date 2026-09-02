import { createRouter, createWebHistory, RouteLocationNormalized, NavigationGuardNext } from "vue-router";
import LoginPage from "../views/LoginPage.vue";
import SignupPage from "../views/SignupPage.vue";
import DashboardPage from "../views/DashboardPage.vue";
import HrDashboard from '../views/Hrdashboard.vue';
import EmployeeDashboard from '../views/EmployeeDashboard.vue';
import PolicyAcknowledgment from '../views/PolicyAcknowledgment.vue';
import OrientationSession from '../views/OrientationSession.vue';
import DocumentLinksUpdate from '../views/DocumentLinksUpdate.vue';
import UploadDocuments from '../views/UploadDocuments.vue';
import OfferLetterUpload from '../views/OfferLetterUpload.vue';
import Analytics from '../views/Analytics.vue';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: "/",
    redirect: () => {
      const authStore = useAuthStore();
      return authStore.isAuthenticated ? '/dashboard' : '/login';
    },
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    beforeEnter: (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated) {
        next('/dashboard');
      } else {
        next();
      }
    }
  },
  {
    path: "/signup",
    name: "Signup",
    component: SignupPage,
    beforeEnter: (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated) {
        next('/dashboard');
      } else {
        next();
      }
    }
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/hr-dashboard',
    name: 'HrDashboard',
    component: HrDashboard,
    meta: { requiresAuth: true, role: 'HR' }
  },
  {
    path: '/employee-dashboard',
    name: 'EmployeeDashboard',
    component: EmployeeDashboard,
    meta: { requiresAuth: true, role: 'Employee' }
  },
  {
    path: '/policy-acknowledgment',
    name: 'PolicyAcknowledgment',
    component: PolicyAcknowledgment,
  },
  {
    path: '/orientation',
    name: 'OrientationSession',
    component: OrientationSession,
  },
  {
    path: '/documents-update',
    name: 'DocumentLinksUpdate',
    component: DocumentLinksUpdate,
  },
  {
    path: '/upload-documents',
    name: 'UploadDocuments',
    component: UploadDocuments,
  },
  {
    path: '/offer-letter-upload',
    name: 'OfferLetterUpload',
    component: OfferLetterUpload,
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: Analytics,
    meta: { requiresAuth: true, role: 'HR' }
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiredRole = to.meta.role as string | undefined;

  if (requiresAuth && !authStore.isAuthenticated) {
    authStore.logout();
    next('/login');
  } else if (requiresAuth && requiredRole && authStore.userRole !== requiredRole) {
    // If user has wrong role, redirect to their own dashboard
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
