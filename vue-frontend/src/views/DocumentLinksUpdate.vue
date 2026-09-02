<template>
<div class="task-page">
    <h2>Document Verification and links update</h2>
    <p>Please verify the documents below and then complete the task.</p>

    <div class="documents-container">
        <div class="document-card">
            <img src="/file1.png" alt="Aadhar Card Document" class="document-image" />
            <p class="document-label">Aadhar Card</p>
            <div class="checkbox-group">
                <input type="checkbox" id="verifyAadhar" v-model="isAadharVerified" />
                <label for="verifyAadhar">Verify</label>
            </div>
        </div>
        <div class="document-card">
            <img src="/file2.png" alt="PAN Card Document" class="document-image" />
            <p class="document-label">PAN Card</p>
            <div class="checkbox-group">
                <input type="checkbox" id="verifyPan" v-model="isPanVerified" />
                <label for="verifyPan">Verify</label>
            </div>
        </div>
    </div>

    <button @click="completeDocumentLinksUpdate" :disabled="loading || !isAadharVerified || !isPanVerified">
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
    name: 'DocumentLinksUpdate',
    setup() {
        const router = useRouter();
        const authStore = useAuthStore();
        const loading = ref(false);
        const error = ref('');
        const successMessage = ref('');
        const isAadharVerified = ref(false);
        const isPanVerified = ref(false);

        const completeDocumentLinksUpdate = async () => {
            if (!authStore.user?.userId) {
                error.value = "User not authenticated. Please log in again.";
                return;
            }

            loading.value = true;
            error.value = '';
            successMessage.value = '';

            try {
                await axios.put(
                    'http://localhost:3000/onboard/task/documents',
                    { employeeId: authStore.user.userId },
                    { headers: { Authorization: `Bearer ${authStore.token}` } }
                );

                successMessage.value = 'Task completed successfully! Redirecting...';

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
            completeDocumentLinksUpdate,
            loading,
            error,
            successMessage,
            isAadharVerified,
            isPanVerified
        };
    },
});
</script>

<style scoped>
.task-page {
    padding: 2rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-width: 800px;
    /* Increased width for images */
    margin: 2rem auto;
    text-align: center;
}

.documents-container {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin: 2rem 0;
}

.document-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.document-image {
    width: 100%;
    max-width: 300px;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.document-label {
    font-weight: 500;
    color: #333;
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

.checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
</style>
