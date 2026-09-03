import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

interface User {
    userId: string;
    name: string;
    email: string;
    phoneNumber?: string;
    role: 'customer' | 'courier_staff' | 'admin' | 'user';
}

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('authToken'));
    const user = ref<User | null>(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null);

    const normalizeRole = (role?: string | null): User['role'] | null => {
        if (!role) return null;
        const value = role.toLowerCase().replace(/\s+/g, '_');

        if (value === 'admin' || value === 'courier_staff' || value === 'courierstaff' || value === 'courier-staff') {
            return 'courier_staff';
        }

        return 'customer';
    };

    const normalizeUser = (value: User | null): User | null => {
        if (!value) return null;

        return {
            ...value,
            role: normalizeRole(value.role) || 'customer',
        };
    };

    const isAuthenticated = computed(() => !!token.value && !!user.value);
    const userRole = computed(() => user.value?.role || null);

    function setAuthData(data: { token: string; user: User }) {
        token.value = data.token;
        user.value = normalizeUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(user.value));
    }

    function logout() {
        token.value = null;
        user.value = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    function initialize() {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            token.value = storedToken;
            user.value = normalizeUser(JSON.parse(storedUser));
        }
    }

    return { token, user, isAuthenticated, userRole, setAuthData, logout, initialize };
});
