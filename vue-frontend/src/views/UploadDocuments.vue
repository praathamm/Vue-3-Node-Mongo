<template>
<div class="task-page">
    <h2>Upload Required Documents</h2>
    <p>Please provide the URL and file name for each of the required documents below.</p>

    <form @submit.prevent="handleUpload" class="document-form">
        <div v-for="(doc, docType) in documents" :key="docType" class="document-group">
            <label :for="docType">{{ docType }}</label>
            <div class="input-row">
                <input :id="docType + '-url'" v-model="doc.fileUrl" :placeholder="docType + ' URL'" required />
                <input :id="docType + '-name'" v-model="doc.fileName" :placeholder="docType + ' File Name'" required />
            </div>
        </div>

        <button type="submit" :disabled="loading || !isFormValid">
            {{ loading ? 'Uploading...' : 'Upload Documents' }}
        </button>
    </form>

    <p v-if="error" class="error-message">{{ error }}</p>
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

export default defineComponent({
    name: 'UploadDocuments',
    setup() {
        const router = useRouter();
        const authStore = useAuthStore();
        const loading = ref(false);
        const error = ref('');
        const successMessage = ref('');

        const documents = ref({
            "ID Proof URL": { fileUrl: '', fileName: '' },
            "PAN/Aadhar URL": { fileUrl: '', fileName: '' },
            "Bank Account Details URL": { fileUrl: '', fileName: '' }
        });

        const isFormValid = computed(() => {
            return Object.values(documents.value).every(doc => doc.fileUrl.trim() !== '' && doc.fileName.trim() !== '');
        });

        const handleUpload = async () => {
            if (!isFormValid.value) {
                error.value = "Please fill out all fields for all documents.";
                return;
            }
            if (!authStore.user?.userId) {
                error.value = "User not authenticated. Please log in again.";
                return;
            }

            loading.value = true;
            error.value = '';
            successMessage.value = '';

            const payloadDocuments = Object.entries(documents.value).map(([docType, docDetails]) => ({
                docType,
                ...docDetails
            }));

            try {
                await axios.put(
                    'http://localhost:3000/onboard/documents/upload',
                    {
                        employeeId: authStore.user.userId,
                        documents: payloadDocuments
                    },
                    { headers: { Authorization: `Bearer ${authStore.token}` } }
                );

                successMessage.value = 'Documents uploaded successfully! Redirecting...';

                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);

            } catch (err: any) {
                error.value = err.response?.data?.message || 'An error occurred while uploading documents.';
            } finally {
                loading.value = false;
            }
        };

        return {
            documents,
            handleUpload,
            loading,
            error,
            successMessage,
            isFormValid
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
    max-width: 700px;
    margin: 2rem auto;
    text-align: center;
}

.document-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: 2rem;
    text-align: left;
}

.document-group label {
    font-weight: bold;
    margin-bottom: 0.5rem;
    display: block;
    color: #333;
}

.input-row {
    display: flex;
    gap: 1rem;
}

.input-row input {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 6px;
}

button {
    background-color: #4caf50;
    color: white;
    padding: 1rem 2rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    margin-top: 1rem;
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
