<template>
<div class="header">
    <div class="header-content">
        <h1>Employee Dashboard</h1>
        <div class="user-info">
            <span class="role-badge" :class="userRole">{{ userRole?.toUpperCase() }}</span>
            <span class="emp-code">{{ empCode }}</span>
            <button @click="handleLogout" class="logout-btn">Logout</button>
        </div>
    </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "HeaderSection",
    props: {
        userRole: {
            type: String,
            required: true
        },
        empCode: {
            type: String,
            required: true
        }
    },
    emits: ["logout"],
    setup(_, { emit }) {
        const handleLogout = () => {
            emit("logout");
        };

        return { handleLogout };
    }
});
</script>

<style scoped>
.header {
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1rem 0;
}

.header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header h1 {
    color: #0f3460;
    margin: 0;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.role-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
}

.role-badge.admin {
    background: #28a745;
    color: white;
}

.role-badge.user {
    background: #007bff;
    color: white;
}

.emp-code {
    font-weight: bold;
    color: #6c757d;
}

.logout-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
}

.logout-btn:hover {
    background: #c82333;
}
</style>
