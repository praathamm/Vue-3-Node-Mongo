<template>
<div class="page">
  <div class="card">
    <h2>Login</h2>

    <form @submit.prevent="handleLogin">
      <label>Email</label>
      <input v-model="email" type="email" placeholder="Enter email" />

      <label>Password</label>
      <input v-model="password" type="password" placeholder="Enter password" />

      <button type="submit" :disabled="loading">
        {{ loading ? 'Loading...' : 'Login' }}
      </button>
    </form>

    <p class="link-text">
      Need an account?
      <router-link to="/signup">Create one</router-link>
    </p>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'LoginPage',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const errorMessage = ref('');

    const handleLogin = async () => {
      errorMessage.value = '';

      if (!email.value || !password.value) {
        errorMessage.value = 'Email and password are required.';
        return;
      }

      loading.value = true;

      try {
        const response = await axios.post('http://localhost:3000/login', {
          email: email.value,
          password: password.value,
        });

        authStore.setAuthData(response.data);
        router.push('/dashboard');
      } catch (error: any) {
        errorMessage.value = error.response?.data?.message || 'Login failed.';
      } finally {
        loading.value = false;
      }
    };

    return { email, password, loading, errorMessage, handleLogin };
  },
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4f4;
}

.card {
  width: 100%;
  max-width: 400px;
  background: white;
  padding: 24px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

h2 {
  margin: 0 0 20px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  margin-top: 10px;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background: #111827;
  color: white;
  cursor: pointer;
}

.link-text {
  margin-top: 14px;
  font-size: 14px;
}

.error {
  margin-top: 10px;
  color: #b91c1c;
  font-size: 14px;
}
</style>