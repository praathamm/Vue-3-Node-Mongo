<template>
<div class="auth-page">
  <div class="brand-panel">
    <div class="brand-panel-inner">
      <img class="logo" src="/logo.png" alt="CourierLive" />

      <div class="auth-head">
        <h1>Welcome back</h1>
        <p class="subtitle">Log in to manage and track your shipments.</p>
      </div>

      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="field">
          <label for="login-email">Email</label>
          <input id="login-email" v-model="email" type="email" placeholder="Enter email" />
        </div>

        <div class="field">
          <label for="login-password">Password</label>
          <input id="login-password" v-model="password" type="password" placeholder="Enter password" />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Loading...' : 'Login' }}
        </button>

        <p v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</p>
      </form>

      <div class="tracking-box">
        <p class="tracking-label">Track your package</p>
        <div class="tracking-row">
          <input v-model="trackingNumber" type="text" placeholder="Enter tracking number" />
          <button type="button" class="btn btn-secondary" @click="trackPackage" :disabled="trackingLoading">
            {{ trackingLoading ? 'Opening...' : 'Track' }}
          </button>
        </div>
        <p v-if="trackingError" class="alert alert-danger">{{ trackingError }}</p>
      </div>

      <p class="link-text">
        Need an account?
        <router-link to="/signup">Create one</router-link>
      </p>
    </div>
  </div>

  <div class="visual-panel" :style="{ backgroundImage: `url('/bg1.png')` }">
    <div class="visual-overlay">
      <p class="visual-tag">Real-time tracking, every mile of the way.</p>
    </div>
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
    const trackingNumber = ref('');
    const trackingLoading = ref(false);
    const trackingError = ref('');

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

    const trackPackage = () => {
      trackingError.value = '';
      if (!trackingNumber.value.trim()) {
        trackingError.value = 'Enter a tracking number first.';
        return;
      }

      trackingLoading.value = true;
      router.push({ path: '/track', query: { trackingNumber: trackingNumber.value.trim() } });
    };

    return {
      email, password, loading, errorMessage, handleLogin,
      trackingNumber, trackingLoading, trackingError, trackPackage,
    };
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.auth-page {
  --color-bg: #f6f7f9;
  --color-surface: #ffffff;
  --color-border: #e3e7ec;
  --color-text: #171a21;
  --color-text-muted: #667085;
  --color-primary: #1e40af;
  --color-primary-hover: #17337f;
  --color-primary-soft: #e8edfb;
  --color-danger: #b42318;
  --color-danger-soft: #fdedec;

  min-height: 100vh;
  height: 100vh;
  display: grid;
    grid-template-columns: 420px minmax(0, 1fr);
    overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--color-text);
  background: var(--color-surface);
}

.brand-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  height: 100vh;
  padding: 24px 28px;
  background: var(--color-surface);
}

.brand-panel-inner {
  width: 100%;
  max-width: 360px;
}

.logo {
    display: block;
    height: 108px;
    width: auto;
    margin: 0 auto 30px;
    object-fit: contain;
}

.auth-head {
  margin-bottom: 24px;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.subtitle {
  margin: 8px 0 0;
  color: var(--color-text-muted);
  font-size: 0.92rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 0.86rem;
  font-weight: 500;
  color: var(--color-text);
}

input {
  box-sizing: border-box;
  width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font: inherit;
  font-size: 0.94rem;
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.14);
}

.btn {
  padding: 11px 16px;
  border: 1px solid transparent;
  border-radius: 10px;
  font: inherit;
  font-size: 0.94rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:not(:disabled):hover {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text);
  white-space: nowrap;
}

.btn-secondary:not(:disabled):hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.alert {
  margin: 0;
  padding: 10px 13px;
  border-radius: 10px;
  font-size: 0.88rem;
}

.alert-danger {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.tracking-box {
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid var(--color-border);
}

.tracking-label {
  margin: 0 0 10px;
  font-weight: 600;
  font-size: 0.92rem;
}

.tracking-row {
  display: flex;
  gap: 8px;
}

.tracking-row input {
  min-width: 0;
  flex: 1;
}

.tracking-row .alert {
  margin-top: 10px;
}

.link-text {
  margin: 22px 0 0;
  text-align: center;
  font-size: 0.88rem;
  color: var(--color-text-muted);
}

.link-text a {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}

.link-text a:hover {
  text-decoration: underline;
}

.visual-panel {
  position: relative;
  background-size: cover;
  background-position: right center;
  background-repeat: no-repeat;
}

.visual-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 40px;
  background: linear-gradient(0deg, rgba(20, 15, 5, 0.42) 0%, rgba(20, 15, 5, 0) 55%);
}

.visual-tag {
  margin: 0;
  max-width: 380px;
  color: #fff;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

@media (max-height: 820px) {
  .brand-panel {
    overflow-y: hidden;
    padding-top: 14px;
    padding-bottom: 14px;
  }

  .brand-panel-inner {
    zoom: 0.9;
  }

  .logo {
    height: 58px;
    margin-bottom: 16px;
  }

  .auth-head {
    margin-bottom: 14px;
  }

  .auth-form {
    gap: 10px;
  }

  input {
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .tracking-box {
    margin-top: 16px;
    padding-top: 14px;
  }

  .link-text {
    margin-top: 14px;
  }
}

</style>
