<template>
<div class="dashboard-container">
  <!-- Header -->
  <HeaderSection :userRole="userRole" :empCode="empCode" @logout="handleLogout" />

  <!-- Tabs -->
  <div class="tabs">
    <router-link to="/dashboard/profile" class="tab" :class="{ active: $route.path.includes('profile') }">
      My Profile
    </router-link>
    <router-link to="/dashboard/list" class="tab" :class="{ active: $route.path.includes('list') }">
      Employees
    </router-link>
  </div>

  <!-- Tab Content -->
  <router-view />

  <!-- Chatbot -->
  <ChatbotComponent />
</div>
</template>

<script lang="ts">
import HeaderSection from "./Header.vue";
import ChatbotComponent from "./ChatBot.vue";
import { useRouter } from "vue-router";

export default {
  name: "DashboardPage",
  components: { HeaderSection, ChatbotComponent },
  setup() {
    const router = useRouter();
    const handleLogout = () => {
      sessionStorage.clear();
      router.push("/login");
    };
    const userRole = sessionStorage.getItem("userRole") || "";
    const empCode = sessionStorage.getItem("empCode") || "";
    return { handleLogout, userRole, empCode };
  }
};
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 1.5rem 0;
}

.tab {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  background: #f1f1f1;
  color: #333;
  text-decoration: none;
  font-weight: bold;
}

.tab.active {
  background: #0f3460;
  color: white;
}
</style>
