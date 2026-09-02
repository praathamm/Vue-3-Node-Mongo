<template>
<div class="page">
    <div class="card">
        <h2>Create account</h2>

        <form @submit.prevent="handleSignup">
            <label>Name</label>
            <input v-model="name" type="text" placeholder="Your full name" />

            <label>Email</label>
            <input v-model="email" type="email" placeholder="Your email" />

            <label>Password</label>
            <input v-model="password" type="password" placeholder="Choose a password" />

            <label>Role</label>
            <select v-model="role">
                <option value="user">User</option>
                <option value="admin">Admin</option>
            </select>

            <button type="submit" :disabled="loading">
                {{ loading ? 'Creating...' : 'Sign up' }}
            </button>
        </form>

        <p class="link-text">
            Already registered?
            <router-link to="/login">Login</router-link>
        </p>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success">{{ successMessage }}</p>
    </div>
</div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

export default {
    name: 'SignupPage',
    setup() {
        const router = useRouter();
        const authStore = useAuthStore();
        const name = ref('');
        const email = ref('');
        const password = ref('');
        const role = ref('user');
        const loading = ref(false);
        const errorMessage = ref('');
        const successMessage = ref('');

        const handleSignup = async () => {
            errorMessage.value = '';
            successMessage.value = '';

            if (!name.value || !email.value || !password.value) {
                errorMessage.value = 'Name, email and password are required.';
                return;
            }

            loading.value = true;

            try {
                const response = await axios.post('http://localhost:3000/register', {
                    name: name.value,
                    email: email.value,
                    password: password.value,
                    role: role.value,
                });

                authStore.setAuthData(response.data);
                successMessage.value = 'Account created successfully.';
                router.push('/dashboard');
            } catch (error: any) {
                errorMessage.value = error.response?.data?.message || 'Registration failed.';
            } finally {
                loading.value = false;
            }
        };

        return { name, email, password, role, loading, errorMessage, successMessage, handleSignup };
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
    max-width: 420px;
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

input,
select {
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
}

.success {
    margin-top: 10px;
    color: #166534;
}
</style>