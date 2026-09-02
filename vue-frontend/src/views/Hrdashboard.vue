<template>
<div class="dashboard-container">
    <header class="dashboard-header">
        <h1>HR Dashboard</h1>
        <!-- Ensure authStore.user exists before accessing its properties -->
        <div v-if="authStore.user" class="user-info">
            <span class="role-badge">{{ authStore.user.role }}</span> Welcome, <strong>{{ authStore.user.name
            }}</strong>
            <button @click="handleLogout" class="logout-btn">Logout</button>
        </div>
        <div v-else class="user-info">
            <button @click="handleLogout" class="logout-btn">Login</button>
        </div>
    </header>

    <div class="tabs-navigation">
        <div class="tabs-container">
            <router-link to="/hr-dashboard" class="tab-item" active-class="active">Onboarding</router-link>
            <router-link to="/analytics" class="tab-item" active-class="active">Analytics</router-link>
        </div>
        <div class="search-container">
            <input type="text" v-model="searchQuery" placeholder="Search by name or email..." class="search-input" />
        </div>
    </div>

    <div v-if="loading" class="loading-state">Loading employee data...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else class="content-area">
        <div class="left-column">
            <div class="onboarding-section">
                <h2>Not Onboarded</h2>
                <div v-if="filteredNotOnboarded.length > 0" class="employee-list">
                    <div v-for="employee in filteredNotOnboarded" :key="employee._id" class="employee-item">
                        <div class="employee-main-info">
                            <div>
                                <strong>{{ employee.name }}</strong> ({{ employee.role }})
                                <div class="employee-email">{{ employee.email }}</div>
                            </div>
                            <div class="actions-group">
                                <button @click="toggleAddDetails(employee)" class="add-details-btn"
                                    title="Add Pre-Onboarding Details">+</button>
                                <button v-if="employee.role === 'Employee'" @click="beginOnboarding(employee)"
                                    class="onboard-btn"
                                    :disabled="!employee.detailsAdded || onboardingId === employee._id">
                                    {{ onboardingId === employee._id ? 'Starting...' : 'Begin Onboarding' }}
                                </button>
                            </div>
                        </div>
                        <!-- Form to add details before onboarding -->
                        <div v-if="employee.isAddingDetails" class="details-edit-form">
                            <h4>Add Pre-Onboarding Details</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Department</label>
                                    <input v-model="employee.details.department" placeholder="Department" />
                                </div>
                                <div class="form-group">
                                    <label>Designation</label>
                                    <input v-model="employee.details.designation" placeholder="Designation" />
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Joining Date</label>
                                    <input v-model="employee.details.joiningDate" type="date" />
                                </div>
                                <div class="form-group">
                                    <label>Employee Code</label>
                                    <input v-model="employee.details.emp_code" placeholder="Employee Code" />
                                </div>
                            </div>
                            <div class="edit-actions">
                                <button @click="savePreOnboardingDetails(employee)" class="save-btn"
                                    :disabled="employee.isSavingPreDetails">
                                    {{ employee.isSavingPreDetails ? 'Saving...' : 'Save Details' }}
                                </button>
                                <button @click="toggleAddDetails(employee)" class="cancel-btn">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="no-data">No employees to onboard.</div>
            </div>
            <div class="onboarding-section">
                <h2>Documents Verified</h2>
                <div v-if="verifiedEmployees.length > 0" class="employee-list">
                    <div v-for="employee in verifiedEmployees" :key="employee.email" class="employee-item">
                        <div class="employee-main-info">
                            <div>
                                <strong>{{ employee.name }}</strong>
                                <div class="employee-email">{{ employee.email }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="no-data">No employees with verified documents found.</div>
            </div>
        </div>

        <div class="onboarding-section">
            <h2>Onboarded</h2>
            <div v-if="filteredOnboarded.length > 0" class="employee-list">
                <div v-for="employee in filteredOnboarded" :key="employee._id" class="employee-item">
                    <div class="employee-main-info">
                        <div>
                            <strong>{{ employee.name }}</strong> ({{ employee.role }})
                            <div class="employee-email">{{ employee.email }}</div>
                        </div>
                        <button v-if="employee.role === 'Employee'" @click="checkOnboardingStatus(employee)"
                            class="status-btn" :disabled="statusLoadingId === employee._id">
                            {{ statusLoadingId === employee._id ? 'Loading...' : (employee.onboardingStatus ? 'Refresh'
                                :
                                'Check Status') }}
                        </button>
                    </div>
                    <div v-if="employee.onboardingStatus && !employee.isEditingDetails"
                        class="onboarding-status-details">
                        <p>
                            <strong>Status:</strong>
                            <span :class="`status-chip status-${employee.onboardingStatus.status}`">
                                {{ employee.onboardingStatus.status }}
                            </span>
                            <button @click="startEditDetails(employee)" class="edit-details-btn">Edit Details</button>
                            <span v-if="employee.onboardingStatus.documentsVerified" class="verified-badge">
                                ✓ Documents Verified
                            </span>
                            <button v-else @click="startVerification(employee)"
                                :class="['verify-btn', { 'disabled': employee.onboardingStatus.status !== 'completed' }]"
                                :title="employee.onboardingStatus.status !== 'completed' ? 'Employee must complete all tasks first' : 'Verify employee documents'">
                                Verify Docs
                            </button>
                        </p>
                        <p><strong>Department:</strong> {{ employee.onboardingStatus.department }}</p>
                        <p><strong>Designation:</strong> {{ employee.onboardingStatus.designation }}</p>
                        <p><strong>Joining Date:</strong> {{ employee.onboardingStatus.joiningDate ? new
                            Date(employee.onboardingStatus.joiningDate).toLocaleDateString() : 'N/A' }}</p>
                        <p><strong>Employee Code:</strong> {{ employee.onboardingStatus.employeeCode }}</p>
                        <p><strong>Overall Progress:</strong> {{ employee.onboardingStatus.progress.overallCompletion
                            }}%</p>
                        <div class="progress-bar-container">
                            <div class="progress-bar"
                                :style="{ width: employee.onboardingStatus.progress.overallCompletion + '%' }"></div>
                        </div>
                        <p><strong>Tasks:</strong> {{ employee.onboardingStatus.progress.tasksCompleted }} |
                            <strong>Docs:</strong> {{ employee.onboardingStatus.progress.mandatoryDocsUploaded }}
                        </p>
                    </div>
                    <!-- Edit Form for Onboarding Details -->
                    <div v-if="employee.isEditingDetails" class="details-edit-form">
                        <h4>Edit Onboarding Details</h4>
                        <div class="form-group">
                            <label>Department</label>
                            <input v-model="employee.editDetails.department" placeholder="Department" />
                        </div>
                        <div class="form-group">
                            <label>Designation</label>
                            <input v-model="employee.editDetails.designation" placeholder="Designation" />
                        </div>
                        <div class="form-group">
                            <label>Joining Date</label>
                            <input v-model="employee.editDetails.joiningDate" type="date" />
                        </div>
                        <div class="form-group">
                            <label>Employee Code</label>
                            <input v-model="employee.editDetails.employeeCode" placeholder="Employee Code" />
                        </div>
                        <div class="edit-actions">
                            <button @click="saveDetails(employee)" class="save-btn"
                                :disabled="employee.isSavingDetails">
                                {{ employee.isSavingDetails ? 'Saving...' : 'Save' }}
                            </button>
                            <button @click="cancelEditDetails(employee)" class="cancel-btn">Cancel</button>
                        </div>
                    </div>
                    <!-- Document Verification Form -->
                    <div v-if="employee.isVerifyingDocs" class="verification-form">
                        <h4>Verify Documents</h4>
                        <div v-if="employee.verificationData && employee.verificationData.documentsForVerification.length > 0"
                            class="doc-verification-list">
                            <div v-for="doc in employee.verificationData.documentsForVerification" :key="doc.docType"
                                class="doc-verification-item">
                                <a :href="doc.fileUrl" target="_blank" class="doc-link">{{ doc.fileName || doc.docType
                                }}</a>
                                <div class="verification-controls">
                                    <label class="radio-label"><input type="radio" :name="`verify-${doc.docType}`"
                                            value="verified" v-model="doc.verificationStatus"> Verified</label>
                                    <label class="radio-label"><input type="radio" :name="`verify-${doc.docType}`"
                                            value="not verified" v-model="doc.verificationStatus"> Not Verified</label>
                                </div>
                                <input v-model="doc.comments" placeholder="Optional comments..."
                                    class="comments-input" />
                            </div>
                        </div>
                        <div v-else class="no-data">No documents available for verification.</div>
                        <div class="edit-actions">
                            <button @click="submitVerification(employee)" class="save-btn"
                                :disabled="employee.isSavingVerification">
                                {{ employee.isSavingVerification ? 'Saving...' : 'Submit Verification' }}
                            </button>
                            <button @click="cancelVerification(employee)" class="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="no-data">No onboarded Employees found.</div>
        </div>
    </div>
    <ChatBot :auto-analyze="true" />
</div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import axios from 'axios';
import ChatBot from './ChatBot.vue';

export default defineComponent({
    name: 'HrDashboard',
    components: {
        ChatBot,
    },
    setup() {
        const authStore = useAuthStore();
        const router = useRouter();
        const loading = ref(true);
        const error = ref("");
        const onboarded = ref<any[]>([]);
        const notOnboarded = ref<any[]>([]);
        const onboardingId = ref<string | null>(null);
        const statusLoadingId = ref<string | null>(null);
        const verifiedEmployees = ref<any[]>([]);
        const searchQuery = ref("");

        const handleLogout = () => {
            authStore.logout();
            router.push('/login');
        };

        const fetchEmployeeData = async () => {
            loading.value = true;
            error.value = "";
            try {
                const response = await axios.get("http://localhost:3000/getemployees", {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });

                const verifiedResponse = await axios.get("http://localhost:3000/verified-employees", {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });
                verifiedEmployees.value = verifiedResponse.data.data;

                const data = response.data.data;
                notOnboarded.value = data.employeesNotOnboarded.map((e: any) => {
                    const hasDetails = e.department && e.designation && e.joiningDate && e.emp_code;
                    return {
                        ...e,
                        isAddingDetails: false,
                        details: {
                            department: e.department || '',
                            designation: e.designation || '',
                            joiningDate: e.joiningDate ? new Date(e.joiningDate).toISOString().split('T')[0] : '',
                            emp_code: e.emp_code || '',
                        },
                        detailsAdded: hasDetails,
                        isSavingPreDetails: false,
                    };
                });
                onboarded.value = data.employeesOnboarded.map((e: any) => ({
                    ...e,
                    onboardingStatus: null,
                    isEditingDetails: false,
                    editDetails: {},
                    isSavingDetails: false,
                    isVerifyingDocs: false,
                    verificationData: null,
                    isSavingVerification: false,
                }));
            } catch (e: any) {
                error.value = e.response?.data?.message || "An error occurred while fetching data.";
            } finally {
                loading.value = false;
            }
        };

        const beginOnboarding = async (employee: any) => {
            onboardingId.value = employee._id;
            error.value = ""; // Clear previous errors
            try {
                await axios.post("http://localhost:3000/onboard", employee, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });
                // On success, re-fetch the data to move the user to the 'Onboarded' list
                await fetchEmployeeData();
            } catch (err: any) {
                error.value = err.response?.data?.message || "Failed to start onboarding process.";
            } finally {
                onboardingId.value = null;
            }
        };

        const toggleAddDetails = (employee: any) => {
            employee.isAddingDetails = !employee.isAddingDetails;
        };

        const savePreOnboardingDetails = async (employee: any) => {
            employee.isSavingPreDetails = true;
            error.value = "";
            try {
                if (!employee.details.department || !employee.details.designation || !employee.details.joiningDate || !employee.details.emp_code) {
                    throw new Error("Department, Designation, Joining Date, and Employee Code are required.");
                }

                await axios.put(`http://localhost:3000/users/${employee._id}`, employee.details, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });

                employee.detailsAdded = true;
                employee.isAddingDetails = false;
            } catch (err: any) {
                error.value = err.message || err.response?.data?.message || `Failed to save details for ${employee.name}.`;
            } finally {
                employee.isSavingPreDetails = false;
            }
        };

        const checkOnboardingStatus = async (employee: any) => {
            statusLoadingId.value = employee._id;
            error.value = ""; // Clear global error
            try {
                const response = await axios.get(`http://localhost:3000/onboard/status/${employee._id}`, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });
                employee.onboardingStatus = response.data;
            } catch (err: any) {
                error.value = err.response?.data?.message || `Failed to fetch status for ${employee.name}.`;
                employee.onboardingStatus = null;
            } finally {
                statusLoadingId.value = null;
            }
        };

        const startEditDetails = (employee: any) => {
            employee.isEditingDetails = true;
            // Pre-fill the form with existing data
            employee.editDetails = {
                department: employee.onboardingStatus.department,
                designation: employee.onboardingStatus.designation,
                // Format date for the date input field (YYYY-MM-DD)
                joiningDate: employee.onboardingStatus.joiningDate ? new Date(employee.onboardingStatus.joiningDate).toISOString().split('T')[0] : '',
                employeeCode: employee.onboardingStatus.employeeCode || ''
            };
        };

        const cancelEditDetails = (employee: any) => {
            employee.isEditingDetails = false;
            employee.editDetails = {};
        };

        const saveDetails = async (employee: any) => {
            employee.isSavingDetails = true;
            error.value = "";
            try {
                await axios.put(`http://localhost:3000/onboard/details/${employee._id}`, employee.editDetails, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });
                // Update local data on success and refresh status
                employee.isEditingDetails = false;
                await checkOnboardingStatus(employee); // Refresh to show updated data

            } catch (err: any) {
                error.value = err.response?.data?.message || `Failed to update details for ${employee.name}.`;
            } finally {
                employee.isSavingDetails = false;
            }
        };

        const startVerification = async (employee: any) => {
            if (employee.onboardingStatus.status !== 'completed') {
                alert("employee has not completed document uploading process yet");
                return;
            }

            employee.isVerifyingDocs = true; // Show form immediately with loading state
            employee.verificationData = null; // Reset previous data
            error.value = "";
            try {
                const response = await axios.get(`http://localhost:3000/onboard/documents/verify/${employee._id}`, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });
                // Prepare form data
                response.data.documentsForVerification.forEach((doc: any) => {
                    doc.verificationStatus = doc.verified ? 'verified' : 'not verified';
                    doc.comments = doc.verificationComments || '';
                });
                employee.verificationData = response.data;
            } catch (err: any) {
                error.value = err.response?.data?.message || `Failed to fetch documents for ${employee.name}.`;
                employee.isVerifyingDocs = false; // Close form on error
            }
        };

        const cancelVerification = (employee: any) => {
            employee.isVerifyingDocs = false;
            employee.verificationData = null;
        };

        const submitVerification = async (employee: any) => {
            employee.isSavingVerification = true;
            error.value = "";
            try {
                const payload = {
                    documentsVerification: employee.verificationData.documentsForVerification.map((doc: any) => ({
                        docType: doc.docType,
                        fileUrl: doc.fileUrl,
                        verificationStatus: doc.verificationStatus,
                        comments: doc.comments,
                    }))
                };
                await axios.put(`http://localhost:3000/onboard/documents/verify/${employee._id}`, payload, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });
                cancelVerification(employee); // Close form on success
            } catch (err: any) {
                error.value = err.response?.data?.message || `Failed to submit verification for ${employee.name}.`;
            } finally {
                employee.isSavingVerification = false;
            }
        };

        const filteredNotOnboarded = computed(() => {
            if (!searchQuery.value) return notOnboarded.value;
            const query = searchQuery.value.toLowerCase();
            return notOnboarded.value.filter(e =>
                e.name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query)
            );
        });

        const filteredOnboarded = computed(() => {
            if (!searchQuery.value) return onboarded.value;
            const query = searchQuery.value.toLowerCase();
            return onboarded.value.filter(e =>
                e.name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query)
            );
        });

        onMounted(() => {
            if (authStore.userRole === 'HR') {
                fetchEmployeeData();
            }
        });

        return { authStore, handleLogout, loading, error, onboarded, notOnboarded, beginOnboarding, onboardingId, checkOnboardingStatus, statusLoadingId, startEditDetails, cancelEditDetails, saveDetails, toggleAddDetails, savePreOnboardingDetails, searchQuery, filteredNotOnboarded, filteredOnboarded, startVerification, cancelVerification, submitVerification, verifiedEmployees };
    },
});
</script>

<style scoped>
.dashboard-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
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
    background: #28a745;
    color: white;
    text-transform: uppercase;
}

.left-column {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.content-area {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 2rem;
    align-items: start;
}

.onboarding-section {
    background: #fff;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.onboarding-section h2 {
    margin-top: 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
    color: #0f3460;
}

.employee-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.employee-item {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 6px;
    border-left: 4px solid #0f3460;
}

.employee-email {
    font-size: 0.9rem;
    color: #6c757d;
    margin-top: 4px;
}

.onboard-btn {
    padding: 0.4rem 0.8rem;
    border: none;
    background-color: #007bff;
    color: white;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background-color 0.2s;
}

.onboard-btn:hover:not(:disabled) {
    background-color: #0056b3;
}

.onboard-btn:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
}

.employee-main-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.status-btn {
    padding: 0.4rem 0.8rem;
    border: 1px solid #007bff;
    background-color: transparent;
    color: #007bff;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
    white-space: nowrap;
}

.actions-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.add-details-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid #6c757d;
    background-color: #f8f9fa;
    color: #343a40;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.status-btn:hover:not(:disabled) {
    background-color: #007bff;
    color: white;
}

.status-btn:disabled {
    border-color: #6c757d;
    color: #6c757d;
    cursor: not-allowed;
}

.onboarding-status-details {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e9ecef;
    font-size: 0.9rem;
}

.onboarding-status-details p {
    margin: 0.5rem 0;
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

.edit-details-btn {
    margin-left: 1rem;
    font-size: 0.8rem;
    padding: 0.2rem 0.6rem;
    border: 1px solid #6c757d;
    background: transparent;
    color: #6c757d;
    border-radius: 4px;
    cursor: pointer;
}

.verify-btn {
    margin-left: 0.5rem;
    font-size: 0.8rem;
    padding: 0.2rem 0.6rem;
    border: 1px solid #17a2b8;
    background: transparent;
    color: #17a2b8;
    border-radius: 4px;
    cursor: pointer;
}

.verify-btn.disabled {
    border-color: #6c757d;
    color: #6c757d;
    cursor: not-allowed;
}

.verified-badge {
    margin-left: 0.5rem;
    font-size: 0.8rem;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    background-color: #d4edda;
    color: #155724;
    font-weight: 500;
}

.edit-details-btn:hover {
    background: #6c757d;
    color: white;
}

.details-edit-form {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e9ecef;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-row {
    display: flex;
    gap: 1rem;
}

.form-row .form-group {
    flex: 1;
}

.details-edit-form h4 {
    margin: 0 0 0.5rem 0;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
    color: #343a40;
}

.form-group input {
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
}

.edit-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.save-btn,
.cancel-btn {
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid transparent;
}

.save-btn {
    background-color: #28a745;
    color: white;
}

.cancel-btn {
    background-color: #6c757d;
    color: white;
}

.tabs-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 2rem;
}

.tabs-container {
    display: flex;
    gap: 0.5rem;
}

.search-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 6px;
    min-width: 250px;
}

.search-input:focus {
    outline: none;
    border-color: #0f3460;
}

.tab-item {
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    color: #4a5568;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
}

.tab-item:hover {
    color: #0f3460;
}

.tab-item.active {
    color: #0f3460;
    border-bottom-color: #0f3460;
}
</style>