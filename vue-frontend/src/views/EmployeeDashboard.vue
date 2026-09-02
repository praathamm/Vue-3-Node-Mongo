<template>
<div class="dashboard-container">
    <header class="dashboard-header">
        <h1>Employee Dashboard</h1>
        <div v-if="authStore.user" class="user-info">
            <span class="role-badge">{{ authStore.user.role }}</span>
            Welcome, <strong>{{ authStore.user.name }}</strong>
            <button @click="handleLogout" class="logout-btn">Logout</button>
        </div>
    </header>

    <div v-if="loading" class="loading-state">Loading your onboarding status...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="!onboardingStatus" class="no-data">
        Your onboarding process has not been initiated by HR yet.
    </div>
    <div v-else class="content-area">
        <div class="status-overview-card">
            <h3>Onboarding Progress</h3>
            <p>
                <strong>Status:</strong>
                <span :class="`status-chip status-${onboardingStatus.status}`">
                    {{ onboardingStatus.status }}
                </span>
            </p>
            <p><strong>Overall Progress:</strong> {{ onboardingStatus.progress.overallCompletion }}%</p>
            <div class="progress-bar-container">
                <div class="progress-bar" :style="{ width: onboardingStatus.progress.overallCompletion + '%' }"></div>
            </div>
            <div class="employee-details-section">
                <div class="detail-item">
                    <span class="detail-label">Employee Code</span>
                    <span class="detail-value">{{ onboardingStatus.employeeCode }}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Department</span>
                    <span class="detail-value">{{ onboardingStatus.department }}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Designation</span>
                    <span class="detail-value">{{ onboardingStatus.designation }}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Joining Date</span>
                    <span class="detail-value">{{ onboardingStatus.joiningDate ? new
                        Date(onboardingStatus.joiningDate).toLocaleDateString() : 'N/A' }}</span>
                </div>
            </div>
            <div v-if="onboardingStatus.status === 'completed'" class="verification-status-badge"
                :class="onboardingStatus.documentsVerified ? 'verified' : 'pending'">
                <span v-if="onboardingStatus.documentsVerified">
                    ✓ Documents Successfully Verified! Welcome to the team!
                </span>
                <span v-else>
                    ⌛ Document Verification Pending at HR
                </span>
            </div>
        </div>

        <div class="tasks-section">
            <h3>Your Tasks</h3>
            <div class="task-list">
                <div v-for="task in onboardingStatus.tasks" :key="task.taskName" class="task-item">
                    <span class="task-name">{{ task.taskName }}</span>
                    <div v-if="task.isCompleted" class="task-status completed">
                        ✓ Completed
                    </div>
                    <router-link v-else :to="getTaskRoute(task.taskName)" class="task-action">
                        Complete Task →
                    </router-link>
                </div>
            </div>
        </div>

        <div class="tasks-section">
            <h3>Document Uploads</h3>
            <div class="task-list">
                <div class="task-item">
                    <span class="task-name">Upload Required Documents</span>
                    <router-link to="/upload-documents" class="task-action">
                        Upload Documents →
                    </router-link>
                </div>
                <div class="task-item">
                    <span class="task-name">Upload Offer Letter Acceptance</span>
                    <router-link to="/offer-letter-upload" class="task-action">
                        Upload Offer Letter →
                    </router-link>
                </div>
            </div>
        </div>
    </div>
    <ChatBot :auto-analyze-employee-status="true" />
</div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import ChatBot from './ChatBot.vue';
import axios from 'axios';

export default defineComponent({
    name: 'EmployeeDashboard',
    components: {
        ChatBot,
    },
    setup() {
        const authStore = useAuthStore();
        const router = useRouter();
        const loading = ref(true);
        const error = ref('');
        const onboardingStatus = ref<any>(null);

        const handleLogout = () => {
            authStore.logout();
            router.push('/login');
        };

        const fetchOnboardingStatus = async () => {
            if (!authStore.user?.userId) {
                error.value = "Could not find user ID. Please log in again.";
                loading.value = false;
                return;
            }

            loading.value = true;
            error.value = '';
            try {
                const response = await axios.get(`http://localhost:3000/onboard/status/${authStore.user.userId}`, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });
                onboardingStatus.value = response.data;
            } catch (err: any) {
                if (err.response?.status === 404) {
                    // This is not a critical error, just means onboarding hasn't started.
                    onboardingStatus.value = null;
                } else {
                    error.value = err.response?.data?.message || "Failed to fetch your onboarding status.";
                }
            } finally {
                loading.value = false;
            }
        };

        const getTaskRoute = (taskName: string): string => {
            if (taskName.includes('policy')) return '/policy-acknowledgment';
            if (taskName.includes('orientation')) return '/orientation';
            if (taskName.includes('document links')) return '/documents-update';
            return '/dashboard'; // Fallback
        };

        onMounted(fetchOnboardingStatus);

        return { authStore, handleLogout, loading, error, onboardingStatus, getTaskRoute };
    },
});
</script>

<style scoped>
/* Using similar styles to HR dashboard for consistency */
.dashboard-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 1rem;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.logout-btn {
    padding: 0.5rem 1rem;
    border: none;
    background-color: #e63946;
    color: white;
    border-radius: 5px;
    cursor: pointer;
}

.role-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
    background: #007bff;
    /* Blue for Employee */
    color: white;
    text-transform: uppercase;
}

.verification-status-badge {
    margin-top: 1.25rem;
    padding: 0.75rem;
    border-radius: 6px;
    font-weight: 500;
    text-align: center;
    font-size: 0.9rem;
}

.verification-status-badge.pending {
    background-color: #fffbeb;
    color: #b45309;
}

.verification-status-badge.verified {
    background-color: #f0fdf4;
    color: #15803d;
}

.employee-details-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e9ecef;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.detail-item {
    display: flex;
    flex-direction: column;
}

.detail-label {
    font-size: 0.8rem;
    color: #6c757d;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
}

.detail-value {
    font-weight: 500;
}

.status-overview-card {
    background: #fff;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    margin-bottom: 2rem;
}

.status-overview-card h3 {
    margin-top: 0;
    color: #0f3460;
}

.tasks-section {
    background: #fff;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    margin-top: 2rem;
}

.tasks-section h3 {
    margin-top: 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
    color: #0f3460;
}

.task-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.task-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 6px;
    border-left: 4px solid #0f3460;
}

.task-name {
    font-weight: 500;
}

.task-status.completed {
    color: #28a745;
    font-weight: bold;
}

.task-action {
    text-decoration: none;
    color: #007bff;
    font-weight: bold;
    transition: color 0.2s;
}

.task-action:hover {
    text-decoration: underline;
    color: #0056b3;
}

.loading-state,
.no-data,
.error-message {
    text-align: center;
    padding: 3rem;
    margin-top: 2rem;
    background: #f8f9fa;
    border-radius: 8px;
    color: #6c757d;
}

.error-message {
    color: #e63946;
    background: #ffe5e5;
}

.progress-bar-container {
    width: 100%;
    background-color: #e9ecef;
    border-radius: 0.25rem;
    height: 0.75rem;
    overflow: hidden;
    margin: 0.5rem 0;
}

.progress-bar {
    height: 100%;
    background-color: #28a745;
    transition: width 0.5s ease-in-out;
}

.status-chip {
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: capitalize;
}

.status-chip.status-pending {
    background-color: #fff3cd;
    color: #856404;
}

.status-chip.status-completed {
    background-color: #d4edda;
    color: #155724;
}
</style>
