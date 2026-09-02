<template>
<div class="redirect-wrapper">
  <div class="redirect-message">
    <h2>Loading Dashboard</h2>
    <p>Please wait, we're redirecting you...</p>
  </div>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

export default defineComponent({
  name: 'DashboardPage',
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();

    onMounted(() => {
      if (!authStore.isAuthenticated) {
        router.replace('/login');
        return;
      }

      if (authStore.userRole === 'HR') {
        router.replace('/analytics');
      } else if (authStore.userRole === 'Employee') {
        router.replace('/employee-dashboard');
      } else {
        // Fallback for any other roles or if role is null
        console.error('Unknown user role:', authStore.userRole);
        authStore.logout();
        router.replace('/login');
      }
    });

    return {};
  },
});
</script>

<style scoped>
.redirect-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  text-align: center;
  background: #f4f7f6;
}

.redirect-message {
  padding: 2rem;
}
</style>