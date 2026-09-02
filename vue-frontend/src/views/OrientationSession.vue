<template>
<div class="task-page">
    <h2>Complete Orientation Session</h2>
    <p>Please watch the orientation video below to enable task completion.</p>

    <div class="video-container">
        <video :src="orientationVideo" controls @ended="handleVideoEnd" class="orientation-video">
            Your browser does not support the video tag.
        </video>
    </div>

    <button @click="completeOrientationSession" :disabled="loading || !videoWatched">
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
    name: 'OrientationSession',
    setup() {
        const router = useRouter();
        const authStore = useAuthStore();
        const loading = ref(false);
        const error = ref('');
        const successMessage = ref('');
        const videoWatched = ref(false);
        const orientationVideo = '/MSCIT ADVERTISING.mp4';

        const handleVideoEnd = () => {
            videoWatched.value = true;
        };

        const completeOrientationSession = async () => {
            if (!authStore.user?.userId) {
                error.value = "User not authenticated. Please log in again.";
                return;
            }

            loading.value = true;
            error.value = '';
            successMessage.value = '';

            try {
                await axios.put(
                    'http://localhost:3000/onboard/task/orientation',
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

        return { completeOrientationSession, loading, error, successMessage, videoWatched, orientationVideo, handleVideoEnd };
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

.video-container {
    margin: 1.5rem 0;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
    background-color: #000;
}

.orientation-video {
    width: 100%;
    display: block;
}
</style>
