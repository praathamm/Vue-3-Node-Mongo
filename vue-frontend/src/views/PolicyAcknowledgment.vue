<template>
<div class="task-page">
    <h2>Complete Company Policy Acknowledgment</h2>
    <p>Please review the company policies and acknowledge your acceptance below.</p>

    <div class="policy-container">
        <div class="policy-info">
            <svg class="pdf-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>MKCL Policies</span>
        </div>
        <div class="policy-actions">
            <a :href="policyPdf" target="_blank" class="action-btn view-btn" title="View Policy">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            </a>
            <a :href="policyPdf" download="MKCL_Policies.pdf" class="action-btn download-btn" title="Download Policy">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </a>
        </div>
    </div>

    <div class="acceptance-section">
        <input type="checkbox" id="acceptPolicy" v-model="isPolicyAccepted" />
        <label for="acceptPolicy">I have read and I Accept the Policies</label>
    </div>

    <button @click="completePolicyAcknowledgment" :disabled="loading || !isPolicyAccepted">
        {{ loading ? 'Completing...' : 'Complete Task' }}
    </button>
    <p v-if="error" class="error-message">{{ error }}</p>
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
</div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

export default defineComponent({
    name: 'PolicyAcknowledgment',
    setup() {
        const router = useRouter();
        const authStore = useAuthStore();
        const loading = ref(false);
        const error = ref('');
        const successMessage = ref('');
        const isPolicyAccepted = ref(false);
        // Reference the PDF from the public folder
        const policyPdf = '/HR Policy Manual version 1.2 31.03.2025 final (5).pdf';

        const completePolicyAcknowledgment = async () => {
            if (!authStore.user?.userId) {
                error.value = "User not authenticated. Please log in again.";
                return;
            }

            loading.value = true;
            error.value = '';
            successMessage.value = '';

            try {
                await axios.put(
                    'http://localhost:3000/onboard/task/policy-acknowledgment',
                    { employeeId: authStore.user.userId },
                    {
                        headers: {
                            Authorization: `Bearer ${authStore.token}`,
                        },
                    }
                );

                successMessage.value = 'Task completed successfully! Redirecting...';

                // After completing, navigate back to the dashboard
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);

            } catch (err: any) {
                error.value = err.response?.data?.message || 'An error occurred while completing the task.';
            } finally {
                loading.value = false;
            }
        };

        return {
            completePolicyAcknowledgment,
            loading,
            error,
            successMessage,
            isPolicyAccepted,
            policyPdf
        };
    },
});
</script>

<style scoped>
/* Add styles for the page */
.task-page {
    padding: 2rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    margin: 2rem auto;
    text-align: center;
}

button {
    background-color: #4caf50;
    color: white;
    padding: 1rem 2rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
}

button:hover:not(:disabled) {
    background-color: #45a049;
}

button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.error-message {
    color: #e63946;
    margin-top: 1rem;
}

.success-message {
    color: #28a745;
    margin-top: 1rem;
}

.policy-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1rem;
    margin: 1.5rem 0;
}

.policy-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 500;
    color: #343a40;
}

.pdf-icon {
    color: #e63946;
}

.policy-actions {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid #ced4da;
    color: #495057;
    transition: all 0.2s;
}

.action-btn:hover {
    background-color: #e9ecef;
    color: #000;
}

.acceptance-section {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}
</style>
