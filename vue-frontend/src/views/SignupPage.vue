<template>
<div class="auth-page">
    <div class="brand-panel">
        <div class="brand-panel-inner">
            <img class="logo" src="/logo.png" alt="CourierLive" />

            <div class="auth-head">
                <h1>Create your account</h1>
                <p class="subtitle">Sign up to book and track shipments.</p>
            </div>

            <form class="auth-form" @submit.prevent="handleSignup">
                <div class="field">
                    <label for="su-name">Name</label>
                    <input id="su-name" v-model="name" type="text" placeholder="Your full name" />
                </div>

                <div class="field">
                    <label for="su-phone">Phone Number</label>
                    <input id="su-phone" v-model="phoneNumber" @input="sanitizePhoneNumber" type="tel"
                        inputmode="numeric" maxlength="10" placeholder="10-digit phone number" />
                </div>

                <div class="field">
                    <label for="su-email">Email</label>
                    <input id="su-email" v-model="email" type="email" placeholder="Your email" />
                </div>

                <button v-if="!otpSent" type="button" class="btn btn-secondary" @click="sendOtp" :disabled="otpLoading">
                    {{ otpLoading ? 'Sending...' : 'Send OTP' }}
                </button>

                <template v-if="otpSent && !otpVerified">
                    <div class="otp-block">
                        <div class="field">
                            <label for="su-otp">Enter OTP</label>
                            <input id="su-otp" v-model="otp" type="text" inputmode="numeric" maxlength="6"
                                placeholder="6-digit code" />
                        </div>
                        <div class="otp-actions">
                            <button type="button" class="btn btn-primary" @click="verifyOtp"
                                :disabled="otpLoading || !otp">
                                {{ otpLoading ? 'Verifying...' : 'Verify OTP' }}
                            </button>
                            <button type="button" class="btn btn-ghost" @click="sendOtp"
                                :disabled="otpLoading || resendSeconds > 0">
                                {{ resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend OTP' }}
                            </button>
                        </div>
                        <p v-if="otpErrorMessage" class="alert alert-danger">{{ otpErrorMessage }}</p>
                    </div>
                </template>

                <p v-if="otpVerified" class="alert alert-success">Email verified</p>

                <div class="field">
                    <label for="su-password">Password</label>
                    <input id="su-password" v-model="password" type="password" placeholder="Choose a password" />
                </div>

                <div class="field">
                    <label for="su-role">Role</label>
                    <select id="su-role" v-model="role">
                        <option value="customer">Customer</option>
                        <option value="courier_staff">Courier Staff</option>
                    </select>
                </div>

                <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
                    {{ loading ? 'Creating...' : 'Sign up' }}
                </button>

                <p v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</p>
                <p v-if="successMessage" class="alert alert-success">{{ successMessage }}</p>
            </form>

            <p class="link-text">
                Already registered?
                <router-link to="/login">Log in</router-link>
            </p>
        </div>
    </div>

    <div class="visual-panel" :style="{ backgroundImage: `url('/bg1.png')` }">
        <div class="visual-overlay">
            <p class="visual-tag">Real-time tracking, every mile of the way.</p>
        </div>
    </div>
</div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

export default {
    name: 'SignupPage',
    setup() {
        const router = useRouter();
        const authStore = useAuthStore();
        const name = ref('');
        const email = ref('');
        const phoneNumber = ref('');
        const password = ref('');
        const role = ref('customer');
        const loading = ref(false);
        const errorMessage = ref('');
        const successMessage = ref('');
        const otp = ref('');
        const otpSent = ref(false);
        const otpVerified = ref(false);
        const otpLoading = ref(false);
        const resendSeconds = ref(0);
        const otpErrorMessage = ref('');
        let resendTimer: ReturnType<typeof setInterval> | null = null;

        const startResendCooldown = (seconds = 60) => {
            if (resendTimer) clearInterval(resendTimer);
            resendSeconds.value = seconds;
            resendTimer = setInterval(() => {
                resendSeconds.value -= 1;
                if (resendSeconds.value <= 0 && resendTimer) {
                    clearInterval(resendTimer);
                    resendTimer = null;
                }
            }, 1000);
        };

        const sanitizePhoneNumber = () => {
            phoneNumber.value = phoneNumber.value.replace(/\D/g, '').slice(0, 10);
        };

        const sendOtp = async () => {
            errorMessage.value = '';
            otpErrorMessage.value = '';
            successMessage.value = '';

            if (!/^\d{10}$/.test(phoneNumber.value.trim())) {
                errorMessage.value = 'Phone number must contain exactly 10 digits.';
                return;
            }

            if (!email.value) {
                errorMessage.value = 'Enter your email first.';
                return;
            }

            otpLoading.value = true;
            try {
                await axios.post('http://localhost:3000/send-otp', { email: email.value });
                otpSent.value = true;
                otpVerified.value = false;
                otp.value = '';
                startResendCooldown();
                successMessage.value = 'OTP sent to your email.';
            } catch (error: any) {
                errorMessage.value = error.response?.data?.message || 'Failed to send OTP.';
                const retryAfterSeconds = error.response?.data?.retryAfterSeconds;
                if (retryAfterSeconds) startResendCooldown(retryAfterSeconds);
            } finally {
                otpLoading.value = false;
            }
        };

        const verifyOtp = async () => {
            errorMessage.value = '';
            otpErrorMessage.value = '';
            successMessage.value = '';

            otpLoading.value = true;
            try {
                await axios.post('http://localhost:3000/verify-otp', {
                    email: email.value,
                    otp: otp.value,
                });
                otpVerified.value = true;
                successMessage.value = 'Email verified.';
            } catch (error: any) {
                otpErrorMessage.value = error.response?.data?.message || 'Invalid OTP.';
            } finally {
                otpLoading.value = false;
            }
        };

        const handleSignup = async () => {
            errorMessage.value = '';
            successMessage.value = '';

            if (!name.value || !email.value || !password.value) {
                errorMessage.value = 'Name, email and password are required.';
                return;
            }

            if (!phoneNumber.value) {
                errorMessage.value = 'Phone number is required.';
                return;
            }

            if (!/^\d{10}$/.test(phoneNumber.value.trim())) {
                errorMessage.value = 'Phone number must contain exactly 10 digits.';
                return;
            }

            if (!otpVerified.value) {
                errorMessage.value = 'Please verify your email before signing up.';
                return;
            }

            loading.value = true;

            try {
                const response = await axios.post('http://localhost:3000/register', {
                    name: name.value,
                    email: email.value,
                    phoneNumber: phoneNumber.value,
                    password: password.value,
                    role: role.value,
                });

                authStore.setAuthData(response.data);
                successMessage.value = 'Account created successfully.';
                router.push('/dashboard');
            } catch (error: any) {
                errorMessage.value = error.response?.data?.message || 'Registration failed.';
            } finally {
                loading.value = false;
            }
        };

        return {
            name, email, phoneNumber, password, role, loading, errorMessage, successMessage,
            otp, otpSent, otpVerified, otpLoading, resendSeconds, otpErrorMessage,
            sanitizePhoneNumber, sendOtp, verifyOtp, handleSignup,
        };
    },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.auth-page {
    --color-bg: #f6f7f9;
    --color-surface: #ffffff;
    --color-border: #e3e7ec;
    --color-text: #171a21;
    --color-text-muted: #667085;
    --color-primary: #1e40af;
    --color-primary-hover: #17337f;
    --color-primary-soft: #e8edfb;
    --color-danger: #b42318;
    --color-danger-soft: #fdedec;
    --color-success: #15803d;
    --color-success-soft: #e9f7ee;

    min-height: 100vh;
    height: 100vh;
    display: grid;
    grid-template-columns: 420px minmax(0, 1fr);
    overflow: hidden;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: var(--color-text);
    background: var(--color-surface);
}

.brand-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow-y: auto;
    height: 100vh;
    padding: 24px 28px;
    background: var(--color-surface);
}

.brand-panel-inner {
    width: 100%;
    max-width: 360px;
}

.logo {
    display: block;
    height: 84px;
    width: auto;
    margin: 0 auto 30px;
    object-fit: contain;
}

.auth-head {
    margin-bottom: 22px;
}

h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.01em;
}

.subtitle {
    margin: 8px 0 0;
    color: var(--color-text-muted);
    font-size: 0.92rem;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

label {
    font-size: 0.86rem;
    font-weight: 500;
    color: var(--color-text);
}

input,
select {
    box-sizing: border-box;
    width: 100%;
    padding: 11px 13px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    font: inherit;
    font-size: 0.94rem;
    color: var(--color-text);
    background: var(--color-surface);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

input:focus,
select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.14);
}

.btn {
    padding: 11px 16px;
    border: 1px solid transparent;
    border-radius: 10px;
    font: inherit;
    font-size: 0.94rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-block {
    width: 100%;
}

.btn-primary {
    background: var(--color-primary);
    color: #fff;
}

.btn-primary:not(:disabled):hover {
    background: var(--color-primary-hover);
}

.btn-secondary {
    background: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text);
}

.btn-secondary:not(:disabled):hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.btn-ghost {
    background: transparent;
    border-color: transparent;
    color: var(--color-text-muted);
    padding-left: 4px;
    padding-right: 4px;
}

.btn-ghost:not(:disabled):hover {
    color: var(--color-primary);
}

.otp-block {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border: 1px dashed var(--color-border);
    border-radius: 12px;
    background: #fafbfc;
}

.otp-actions {
    display: flex;
    align-items: center;
    gap: 6px;
}

.otp-actions .btn-primary {
    flex: 1;
}

.alert {
    margin: 0;
    padding: 10px 13px;
    border-radius: 10px;
    font-size: 0.88rem;
}

.alert-danger {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}

.alert-success {
    background: var(--color-success-soft);
    color: var(--color-success);
}

.link-text {
    margin: 20px 0 0;
    text-align: center;
    font-size: 0.88rem;
    color: var(--color-text-muted);
}

.link-text a {
    color: var(--color-primary);
    font-weight: 600;
    text-decoration: none;
}

.link-text a:hover {
    text-decoration: underline;
}

.visual-panel {
    position: relative;
    background-size: cover;
    background-position: right center;
    background-repeat: no-repeat;
}

.visual-overlay {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 40px;
    background: linear-gradient(0deg, rgba(20, 15, 5, 0.42) 0%, rgba(20, 15, 5, 0) 55%);
}

.visual-tag {
    margin: 0;
    max-width: 380px;
    color: #fff;
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: -0.01em;
}

@media (max-height: 850px) {
    .brand-panel {
        overflow-y: hidden;
        padding-top: 12px;
        padding-bottom: 12px;
    }

    .brand-panel-inner {
        zoom: 0.9;
    }

    .logo {
        height: 58px;
        margin-bottom: 14px;
    }

    .auth-head {
        margin-bottom: 12px;
    }

    .auth-form {
        gap: 9px;
    }

    .field {
        gap: 4px;
    }

    label {
        font-size: 0.78rem;
    }

    input,
    select {
        padding-top: 7px;
        padding-bottom: 7px;
    }

    .btn {
        padding-top: 8px;
        padding-bottom: 8px;
    }

    .otp-block {
        gap: 7px;
        padding: 10px;
    }

    .link-text {
        margin-top: 12px;
    }
}

</style>
