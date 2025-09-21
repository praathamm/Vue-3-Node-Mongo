<template>
<div class="signup-wrapper">
    <div class="signup-card">
        <h2 class="title">Create Account</h2>
        <p class="subtitle">Join us today</p>

        <form @submit.prevent="handleSignup" class="form">
            <div class="input-group">
                <label for="username">Username</label>
                <input type="text" id="username" v-model="username" placeholder="Enter username"
                    :class="{ 'is-invalid': usernameError }" />
                <span v-if="usernameError" class="error-text">{{ usernameError }}</span>
            </div>

            <div class="input-group">
                <label for="email">Email</label>
                <input type="email" id="email" v-model="email" placeholder="Enter email"
                    :class="{ 'is-invalid': emailError }" />
                <span v-if="emailError" class="error-text">{{ emailError }}</span>
            </div>

            <div class="input-group">
                <label for="emp_code">Employee Code</label>
                <input type="text" id="emp_code" v-model="emp_code" placeholder="Enter employee code"
                    :class="{ 'is-invalid': empCodeError }" />
                <span v-if="empCodeError" class="error-text">{{ empCodeError }}</span>
            </div>

            <div class="input-group">
                <label for="password">Password</label>
                <input type="password" id="password" v-model="password" placeholder="Enter password"
                    :class="{ 'is-invalid': passwordError }" />
                <span v-if="passwordError" class="error-text">{{ passwordError }}</span>
            </div>

            <button type="submit" class="submit-btn" :disabled="loading">
                <span v-if="loading">Creating Account...</span>
                <span v-else>Sign Up</span>
            </button>

            <p class="footer-text">
                Already have an account?
                <router-link to="/login" class="login-link">Login</router-link>
            </p>

            <p v-if="apiError" class="error-banner">{{ apiError }}</p>
            <p v-if="successMessage" class="success-banner">{{ successMessage }}</p>
        </form>
    </div>
</div>
</template>

<script lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

export default {
    name: "SignupPage",
    setup() {
        const router = useRouter();
        const username = ref("");
        const email = ref("");
        const emp_code = ref("");
        const password = ref("");
        const usernameError = ref("");
        const emailError = ref("");
        const empCodeError = ref("");
        const passwordError = ref("");
        const apiError = ref("");
        const successMessage = ref("");
        const loading = ref(false);

        const validateForm = () => {
            let valid = true;

            if (username.value.trim() === "") {
                usernameError.value = "Username is required";
                valid = false;
            } else {
                usernameError.value = "";
            }

            if (email.value.trim() === "" || !email.value.includes('@')) {
                emailError.value = "Valid email is required";
                valid = false;
            } else {
                emailError.value = "";
            }

            if (emp_code.value.trim() === "") {
                empCodeError.value = "Employee code is required";
                valid = false;
            } else {
                empCodeError.value = "";
            }

            if (password.value.trim() === "" || password.value.length < 6) {
                passwordError.value = "Password must be at least 6 characters";
                valid = false;
            } else {
                passwordError.value = "";
            }

            return valid;
        };

        const handleSignup = async () => {
            if (!validateForm()) return;

            loading.value = true;
            apiError.value = "";
            successMessage.value = "";

            try {
                const res = await axios.post("http://localhost:3000/register", {
                    username: username.value,
                    email: email.value,
                    password: password.value,
                    emp_code: emp_code.value,
                    role: "user" // Always create as user
                });

                successMessage.value = "Account created successfully! Redirecting to login...";

                setTimeout(() => {
                    router.push("/login");
                }, 2000);

            } catch (err: any) {
                apiError.value =
                    err.response?.data?.message || "Failed to create account. Try again.";
            } finally {
                loading.value = false;
            }
        };

        return {
            username,
            email,
            emp_code,
            password,
            usernameError,
            emailError,
            empCodeError,
            passwordError,
            apiError,
            successMessage,
            loading,
            handleSignup,
        };
    },
};
</script>

<style scoped>
/* Page layout */
.signup-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
    padding: 1rem;
}

/* Card */
.signup-card {
    background: #fff;
    padding: 2.5rem;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
    width: 100%;
    max-width: 400px;
    text-align: center;
    animation: fadeIn 0.6s ease;
}

.title {
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: #0f3460;
}

.subtitle {
    font-size: 0.95rem;
    color: #6c757d;
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
    color: #333;
}

input {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    transition: all 0.3s ease;
}

input:focus {
    border-color: #0f3460;
    outline: none;
    box-shadow: 0 0 6px rgba(15, 52, 96, 0.2);
}

input.is-invalid {
    border-color: #e63946;
}

.error-text {
    color: #e63946;
    font-size: 0.8rem;
    margin-top: 0.25rem;
}

.error-banner {
    margin-top: 1rem;
    background: #ffe5e5;
    color: #e63946;
    padding: 0.6rem;
    border-radius: 6px;
    font-size: 0.9rem;
}

.success-banner {
    margin-top: 1rem;
    background: #e5f5e5;
    color: #28a745;
    padding: 0.6rem;
    border-radius: 6px;
    font-size: 0.9rem;
}

/* Button */
button.submit-btn {
    width: 100%;
    padding: 0.9rem;
    background: #0f3460;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s ease;
}

button.submit-btn:hover {
    background: #16213e;
}

button:disabled {
    background: #6c757d;
    cursor: not-allowed;
}

/* Footer */
.footer-text {
    font-size: 0.9rem;
    margin-top: 1rem;
    color: #555;
}

.login-link {
    color: #0f3460;
    font-weight: 600;
    text-decoration: none;
}

.login-link:hover {
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