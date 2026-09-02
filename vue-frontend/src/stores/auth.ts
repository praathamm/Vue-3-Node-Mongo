import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Define an interface for the user object to ensure type safety
interface User {
    userId: string;
    name: string;
    email: string;
    phone: string;
    emp_code: string;
    role: 'HR' | 'Employee';
}

// Define the authentication store using Pinia's setup store syntax
export const useAuthStore = defineStore('auth', () => {
    // --- STATE ---
    const token = ref<string | null>(null);
    const user = ref<User | null>(null);

    // --- GETTERS ---
    const isAuthenticated = computed(() => !!token.value && !!user.value);
    const userRole = computed(() => user.value?.role || null);

    // --- ACTIONS ---

    // Action to set authentication data upon successful login
    function setAuthData(data: { token: string; user: User }) {
        token.value = data.token;
        user.value = data.user;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    }

    // Action to clear authentication data on logout
    function logout() {
        token.value = null;
        user.value = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    // Action to initialize the store's state from localStorage on app load
    function initialize() {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            token.value = storedToken;
            user.value = JSON.parse(storedUser);
        }
    }

    return { token, user, isAuthenticated, userRole, setAuthData, logout, initialize };
});