<template>
<div class="login-wrapper">
  <video autoplay loop muted class="background-video">
    <source src="/video.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
  <div class="login-card">
    <h2 class="title">Welcome Back</h2>
    <p class="subtitle">Login to continue</p>

    <form @submit.prevent="handleLogin" class="form">
      <div class="input-group">
        <label for="email">Email</label>
        <input type="email" id="email" v-model="email" placeholder="Enter email"
          :class="{ 'is-invalid': emailError }" />
        <span v-if="emailError" class="error-text">{{ emailError }}</span>
      </div>

      <div class="input-group">
        <label for="password">Password</label>
        <input type="password" id="password" v-model="password" placeholder="Enter password"
          :class="{ 'is-invalid': passwordError }" />
        <span v-if="passwordError" class="error-text">{{ passwordError }}</span>
      </div>

      <button type="submit" class="submit-btn" :disabled="loading">
        <span v-if="loading">Logging in...</span>
        <span v-else>Login</span>
      </button>

      <p class="footer-text">
        Don't have an account?
        <router-link to="/signup" class="signup-link">Sign up</router-link>
      </p>

      <p v-if="apiError" class="error-banner">{{ apiError }}</p>
    </form>
  </div>
</div>
</template>

<script lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "../stores/auth";

export default {
  name: "LoginPage",
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    const email = ref("");
    const password = ref("");
    const emailError = ref("");
    const passwordError = ref("");
    const apiError = ref("");
    const loading = ref(false);

    const validateForm = () => {
      let valid = true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.value)) {
        emailError.value = "Valid email is required";
        valid = false;
      } else {
        emailError.value = "";
      }

      if (password.value.trim() === "") {
        passwordError.value = "Password is required";
        valid = false;
      } else {
        passwordError.value = "";
      }

      return valid;
    };

    const handleLogin = async () => {
      if (!validateForm()) return;

      loading.value = true;
      apiError.value = "";

      try {
        const res = await axios.post("http://localhost:3000/login", {
          email: email.value,
          password: password.value,
        });

        if (res.data.message === "Login successful") {
          authStore.setAuthData(res.data);

          router.push("/dashboard");
        }
      } catch (err: any) {
        apiError.value =
          err.response?.data?.message || "Failed to login. Try again.";
      } finally {
        loading.value = false;
      }
    };

    return {
      email,
      password,
      emailError,
      passwordError,
      apiError,
      loading,
      handleLogin,
    };
  },
};
</script>

<style scoped>
/* Page layout */
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  overflow: hidden;
}

.background-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  z-index: -1;
}

/* Card */
.login-card {
  background: rgba(15, 52, 96, 0.5);
  backdrop-filter: blur(10px);
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  width: 100%;
  max-width: 360px;
  text-align: center;
  animation: fadeIn 0.6s ease;
}

.title {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #fff;
}

.subtitle {
  font-size: 0.95rem;
  color: #e0e0e0;
  margin-bottom: 1.5rem;
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-group {
  text-align: left;
}

label {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
  color: #e0e0e0;
}

input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

input::placeholder {
  color: #ccc;
}

input:focus {
  border-color: #fff;
  outline: none;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
}

input.is-invalid {
  border-color: #ff7b7b;
}

.error-text {
  color: #e63946;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.error-banner {
  margin-top: 1rem;
  background: rgba(230, 57, 70, 0.5);
  color: #fff;
  padding: 0.6rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

/* Button */
button.submit-btn {
  width: 100%;
  padding: 0.9rem;
  background: #1679AB;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

button.submit-btn:hover {
  background: #219C90;
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

/* Footer */
.footer-text {
  font-size: 0.9rem;
  margin-top: 1rem;
  color: #e0e0e0;
}

.signup-link {
  color: #fff;
  font-weight: 600;
  text-decoration: none;
}

.signup-link:hover {
  text-decoration: underline;
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>