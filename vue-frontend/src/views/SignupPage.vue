<template>
<div class="signup-wrapper">
    <video autoplay loop muted class="background-video">
        <source src="/video.mp4" type="video/mp4">
        Your browser does not support the video tag.
    </video>
    <div class="signup-card">
        <h2 class="title">Create Account</h2>
        <p class="subtitle">Join us today</p>

        <form @submit.prevent="handleSignup" class="form">
            <div class="input-group">
                <label for="name">Name</label>
                <input type="text" id="name" v-model="name" placeholder="Enter your full name"
                    :class="{ 'is-invalid': nameError }" />
                <span v-if="nameError" class="error-text">{{ nameError }}</span>
            </div>

            <div class="input-group">
                <label for="email">Email</label>
                <input type="email" id="email" v-model="email" placeholder="Enter email"
                    :class="{ 'is-invalid': emailError }" />
                <span v-if="emailError" class="error-text">{{ emailError }}</span>
            </div>

            <div class="input-group">
                <label for="phone">Phone</label>
                <input type="tel" id="phone" v-model="phone" placeholder="Enter 10-digit phone number" maxlength="10"
                    :class="{ 'is-invalid': phoneError }" />
                <span v-if="phoneError" class="error-text">{{ phoneError }}</span>
            </div>

            <div class="input-group">
                <label for="role">Role</label>
                <select id="role" v-model="role">
                    <option value="Employee">Employee</option>
                    <option value="HR">HR</option>
                </select>
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
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

export default {
    name: "SignupPage",
    setup() {
        const router = useRouter();
        const name = ref("");
        const email = ref("");
        const phone = ref("");
        const password = ref("");
        const role = ref("Employee"); // Default role
        const nameError = ref("");
        const emailError = ref("");
        const phoneError = ref("");
        const passwordError = ref("");
        const apiError = ref("");
        const successMessage = ref("");
        const loading = ref(false);

        watch(phone, (newValue) => {
            // Ensure only digits are entered and limit to 10
            const digitsOnly = newValue.replace(/\D/g, '');
            phone.value = digitsOnly.slice(0, 10);
        });

        const validateForm = () => {
            // Reset errors on each validation attempt
            nameError.value = "";
            emailError.value = "";
            phoneError.value = "";
            passwordError.value = "";

            let valid = true;

            if (name.value.trim() === "") {
                nameError.value = "Name is required";
                valid = false;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.value)) {
                emailError.value = "Valid email is required";
                valid = false;
            }

            const phoneRegex = /^[0-9]{10}$/;
            if (phone.value.trim() === "") {
                phoneError.value = "Phone number is required";
                valid = false;
            } else if (!phoneRegex.test(phone.value)) {
                phoneError.value = "Phone number must be 10 digits";
                valid = false;
            }

            if (password.value.length < 6) {
                passwordError.value = "Password must be at least 6 characters";
                valid = false;
            }

            return valid;
        };

        const handleSignup = async () => {
            apiError.value = "";
            successMessage.value = "";
            if (!validateForm()) return;

            loading.value = true;

            try {
                const res = await axios.post("http://localhost:3000/register", {
                    name: name.value,
                    email: email.value,
                    phone: phone.value,
                    password: password.value,
                    role: role.value,
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
            name,
            email,
            phone,
            password,
            role,
            nameError,
            emailError,
            phoneError,
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
.signup-card {
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

input,
select {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    box-sizing: border-box;
}

input::placeholder {
    color: #ccc;
}

select option {
    background: #0f3460;
    color: #fff;
}

select:focus,
input:focus {
    border-color: #fff;
    outline: none;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
}

input.is-invalid {
    border-color: #ff7b7b;
}

select.is-invalid {
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

.success-banner {
    margin-top: 1rem;
    background: rgba(40, 167, 69, 0.5);
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

.login-link {
    color: #fff;
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