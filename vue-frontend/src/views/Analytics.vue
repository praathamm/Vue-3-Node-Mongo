<template>
<div class="analytics-wrapper">
    <div class="analytics-container">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h1>Onboarding Dashboard</h1>
                <p>Real-time insights into employee onboarding progress</p>
            </div>
            <router-link to="/hr-dashboard" class="back-btn">← Go to Dashboard</router-link>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
            Loading dashboard data...
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-message">
            <h3>Error loading dashboard data</h3>
            <p>{{ error }}</p>
        </div>

        <!-- Dashboard Content -->
        <div v-else-if="dashboardData">
            <!-- Summary Cards -->
            <div class="summary-grid">
                <div class="summary-card border-blue">
                    <div class="card-content">
                        <div class="card-icon bg-blue">
                            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z">
                                </path>
                            </svg>
                        </div>
                        <div class="card-details">
                            <dl>
                                <dt>Total Employees</dt>
                                <dd class="value-with-rate">
                                    <span class="value">{{ dashboardData.summary.totalEmployees }}</span>
                                    <span class="rate rate-blue">(100%)</span>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div class="summary-card border-green">
                    <div class="card-content">
                        <div class="card-icon bg-green">
                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div class="card-details">
                            <dl>
                                <dt>Completed</dt>
                                <dd class="value-with-rate">
                                    <span class="value">{{ dashboardData.summary.completedOnboarding }}</span>
                                    <span class="rate rate-green">({{ dashboardData.summary.completionRate }})</span>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div class="summary-card border-yellow">
                    <div class="card-content">
                        <div class="card-icon bg-yellow">
                            <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div class="card-details">
                            <dl>
                                <dt>Pending</dt>
                                <dd class="value-with-rate">
                                    <span class="value">{{ dashboardData.summary.pendingOnboarding }}</span>
                                    <span class="rate rate-yellow">({{ 100 -
                                        parseInt(dashboardData.summary.completionRate) }}%)</span>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div class="summary-card border-purple">
                    <div class="card-content">
                        <div class="card-icon bg-purple">
                            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                                </path>
                            </svg>
                        </div>
                        <div class="card-details">
                            <dl>
                                <dt>Docs Verified</dt>
                                <dd class="value-with-rate">
                                    <span class="value">{{ dashboardData.summary.documentsVerified }}</span>
                                    <span class="rate rate-purple">({{
                                        dashboardData.summary.documentVerificationRate }})</span>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detailed Breakdown Tables -->
            <div class="tables-grid">
                <!-- Pending Onboarding -->
                <div class="table-wrapper">
                    <h3 class="table-title">
                        <svg class="icon-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Pending Onboarding ({{ dashboardData.summary.pendingOnboarding }})
                    </h3>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>Joining Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="employee in dashboardData.detailedBreakdown.employeesWithPendingOnboarding"
                                    :key="employee.employeeId">
                                    <td>
                                        <div class="employee-code">{{ employee.employeeCode }}</div>
                                        <div class="employee-designation">{{ employee.designation }}</div>
                                    </td>
                                    <td>{{ employee.department }}</td>
                                    <td>{{ formatDate(employee.joiningDate) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Pending Documents -->
                <div class="table-wrapper">
                    <h3 class="table-title">
                        <svg class="icon-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                            </path>
                        </svg>
                        Pending Documents ({{ dashboardData.summary.documentsPending }})
                    </h3>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Missing Documents</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="employee in dashboardData.detailedBreakdown.employeesWithPendingDocuments"
                                    :key="employee.employeeId">
                                    <td>
                                        <div class="employee-code">{{ employee.employeeCode }}</div>
                                        <div class="employee-designation">{{ employee.department }} - {{
                                            employee.designation }}</div>
                                    </td>
                                    <td>
                                        <div class="doc-tags">
                                            <span v-for="doc in employee.missingDocs" :key="doc" class="doc-tag">
                                                {{ doc }}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Completed Employees Section -->
            <div class="completed-section">
                <h3 class="table-title">
                    <svg class="icon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Completed Onboarding ({{ dashboardData.summary.completedOnboarding }})
                </h3>
                <div class="completed-grid">
                    <div v-for="employee in dashboardData.detailedBreakdown.employeesWithCompletedOnboarding"
                        :key="employee.employeeId" class="completed-card">
                        <div class="completed-card-content">
                            <div>
                                <div class="employee-code">{{ employee.employeeCode }}</div>
                                <div class="employee-designation">{{ employee.department }}</div>
                            </div>
                            <div class="text-right">
                                <div class="text-xs text-gray-500">Completed</div>
                                <div class="text-xs text-gray-500">{{ formatDate(employee.completedAt) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

export default defineComponent({
    name: 'Analytics',
    setup() {
        const authStore = useAuthStore();
        const dashboardData = ref<any>(null);
        const loading = ref(true);
        const error = ref<string | null>(null);

        const fetchDashboardData = async () => {
            try {
                loading.value = true;
                error.value = null;

                const response = await axios.get('http://localhost:3000/onboard/dashboard/stats', {
                    headers: {
                        'Authorization': `Bearer ${authStore.token}`,
                    }
                });

                dashboardData.value = response.data;

            } catch (err: any) {
                error.value = err.response?.data?.message || err.message || 'Failed to fetch dashboard data.';
                console.error('Error fetching dashboard data:', err);
            } finally {
                loading.value = false;
            }
        };

        const formatDate = (dateString: string | null) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        onMounted(fetchDashboardData);

        return {
            dashboardData,
            loading,
            error,
            formatDate
        };
    }
});
</script>

<style scoped>
.analytics-wrapper {
    min-height: 100vh;
    padding: 2rem;
    background-color: #f8fafc;
}

.page-header {
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.page-header h1 {
    font-size: 2.25rem;
    font-weight: bold;
    color: #1e293b;
    margin-bottom: 0.5rem;
}

.page-header p {
    color: #64748b;
}

.back-btn {
    background-color: #fff;
    border: 1px solid #e2e8f0;
    color: #334155;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
}

.back-btn:hover {
    background-color: #f8fafc;
    border-color: #cbd5e1;
}

.loading-state,
.error-message {
    text-align: center;
    padding: 4rem;
    margin-top: 2rem;
    background: #fff;
    border-radius: 8px;
    color: #64748b;
}

.error-message {
    color: #dc2626;
    background: #fee2e2;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.summary-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    border-left-width: 4px;
    transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.border-blue {
    border-color: #3b82f6;
}

.border-green {
    border-color: #10b981;
}

.border-yellow {
    border-color: #f59e0b;
}

.border-purple {
    border-color: #8b5cf6;
}

.card-content {
    display: flex;
    align-items: center;
}

.card-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
}

.card-icon svg {
    width: 24px;
    height: 24px;
}

.bg-blue {
    background-color: #dbeafe;
    color: #2563eb;
}

.bg-green {
    background-color: #d1fae5;
    color: #059669;
}

.bg-yellow {
    background-color: #fef3c7;
    color: #d97706;
}

.bg-purple {
    background-color: #ede9fe;
    color: #7c3aed;
}

.card-details dt {
    font-size: 0.875rem;
    color: #64748b;
    white-space: nowrap;
}

.card-details .value {
    font-size: 1.875rem;
    font-weight: bold;
    color: #1e293b;
}

.value-with-rate {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
}

.card-details .rate {
    font-size: 0.875rem;
}

.rate-green {
    color: #059669;
}

.rate-yellow {
    color: #d97706;
}

.rate-purple {
    color: #7c3aed;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.chart-wrapper {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
}

.chart-wrapper h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
}

.chart-container {
    height: 320px;
}

.chart-container-large {
    height: 384px;
}

.tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
}

.table-wrapper {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
}

.table-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
}

.table-title svg {
    width: 20px;
    height: 20px;
    margin-right: 0.5rem;
}

.icon-yellow {
    color: #f59e0b;
}

.icon-red {
    color: #ef4444;
}

.icon-green {
    color: #10b981;
}

.table-container {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th,
.data-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}

.data-table th {
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748b;
    text-transform: uppercase;
    background-color: #f8fafc;
}

.data-table tbody tr:hover {
    background-color: #f8fafc;
}

.employee-code {
    font-weight: 500;
    color: #1e293b;
}

.employee-designation {
    font-size: 0.875rem;
    color: #64748b;
}

.doc-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.doc-tag {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    background-color: #fee2e2;
    color: #b91c1c;
}

.completed-section {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    margin-top: 2rem;
}

.completed-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.completed-card {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 1rem;
}

.completed-card-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.completed-card .text-right {
    text-align: right;
}

.completed-card .text-xs {
    font-size: 0.75rem;
    color: #475569;
}
</style>