import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: null,
        isAuthenticated: false
    }),
    actions: {
        setAuthData(data) {
            this.user = data.user
            this.token = data.token
            this.isAuthenticated = true
            // Store in localStorage for persistence
            localStorage.setItem('auth_token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
        },
        logout() {
            this.user = null
            this.token = null
            this.isAuthenticated = false
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
        },
        initialize() {
            const token = localStorage.getItem('auth_token')
            const user = localStorage.getItem('user')
            if (token && user) {
                this.token = token
                this.user = JSON.parse(user)
                this.isAuthenticated = true
            }
        }
    },
    getters: {
        userRole: (state) => state.user?.role || null
    }
})