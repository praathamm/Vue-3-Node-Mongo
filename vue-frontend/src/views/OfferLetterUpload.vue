<template>
<div class="task-page">
    <h2>Upload Offer Letter Acceptance</h2>
    <p>Upload the accepted offer letter and accept the terms to complete the final step.</p>

    <form @submit.prevent="handleUpload" class="upload-form">
        <div class="form-group">
            <label for="offerLetterFile">Kindly upload your offer letter</label>
            <input id="offerLetterFile" type="file" @change="handleFileChange" accept=".pdf" required />
        </div>

        <div class="acceptance-group">
            <input type="checkbox" id="acceptTerms" v-model="isAccepted" />
            <label for="acceptTerms">I accept all the terms and conditions and will be ready to join on the mentioned
                joining date</label>
        </div>

        <button type="submit" :disabled="loading || !isFormValid">
            {{ loading ? 'Uploading...' : 'Upload & Complete' }}
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
    name: 'OfferLetterUpload',
    setup() {
        const router = useRouter();
        const authStore = useAuthStore();
        const loading = ref(false);
        const error = ref('');
        const successMessage = ref('');
        const selectedFile = ref<File | null>(null);
        const isAccepted = ref(false);

        const isFormValid = computed(() => {
            return selectedFile.value !== null && isAccepted.value;
        });

        const handleFileChange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                const file = target.files[0];
                if (file.type !== 'application/pdf') {
                    error.value = "Only PDF files are allowed. Please select a valid file.";
                    target.value = ''; // Reset the file input
                    selectedFile.value = null;
                } else {
                    error.value = ''; // Clear any previous error
                    selectedFile.value = file;
                }
            } else {
                selectedFile.value = null;
                error.value = '';
            }
        };

        const handleUpload = async () => {
            if (!isFormValid.value) {
                error.value = "Please upload a file and accept the terms.";
                return;
            }
            // Add guard for typescript to know selectedFile is not null
            if (!authStore.user?.userId || !selectedFile.value) {
                error.value = "User not authenticated or file not selected. Please log in again.";
                return;
            }

            loading.value = true;
            error.value = '';
            successMessage.value = '';

            try {
                const response = await axios.put(
                    'http://localhost:3000/onboard/offer-letter/upload',
                    {
                        employeeId: authStore.user.userId,
                        fileUrl: `uploads/${selectedFile.value.name}`, // Using a dummy URL path
                        fileName: selectedFile.value.name
                    },
                    { headers: { Authorization: `Bearer ${authStore.token}` } }
                );

                successMessage.value = response.data.message;

                setTimeout(() => {
                    router.push('/dashboard');
                }, 2500);

            } catch (err: any) {
                error.value = err.response?.data?.message || 'An error occurred while uploading the offer letter.';
            } finally {
                loading.value = false;
            }
        };

        return {
            handleUpload,
            loading,
            error,
            successMessage,
            isFormValid,
            isAccepted,
            handleFileChange
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
    margin-top: 1rem;
}

button:hover:not(:disabled) {
    background-color: #45a049;
}

button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.upload-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 2rem;
    text-align: left;
}

.form-group label {
    font-weight: bold;
    margin-bottom: 0.5rem;
    display: block;
}

.form-group input {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-sizing: border-box;
}

.form-group input[type="file"] {
    padding: 0.7rem;
}

.acceptance-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.9rem;
}

.error-message {
    color: #e63946;
    margin-top: 1rem;
    background-color: #ffe5e5;
    padding: 0.75rem;
    border-radius: 6px;
}

.success-message {
    color: #28a745;
    margin-top: 1rem;
}
</style>