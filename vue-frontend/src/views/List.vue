<template>
<div class="list-container">
    <!-- Add Employee Form (Admin Only) -->
    <div v-if="userRole === 'admin'" class="add-employee-section">
        <h3>Add New Employee</h3>
        <form @submit.prevent="addEmployee" class="employee-form">
            <div class="form-row">
                <input v-model="newEmployee.emp_code" placeholder="Employee Code" required>
                <input v-model="newEmployee.name" placeholder="Name" required>
                <input v-model="newEmployee.department" placeholder="Department" required>
                <input v-model="newEmployee.position" placeholder="Position" required>
            </div>
            <div class="form-row">
                <input v-model="newEmployee.salary" type="number" placeholder="Salary">
                <input v-model="newEmployee.email" type="email" placeholder="Email">
                <input v-model="newEmployee.phone" placeholder="Phone">
                <button type="submit" :disabled="addingEmployee">
                    {{ addingEmployee ? 'Adding...' : 'Add Employee' }}
                </button>
            </div>
        </form>
    </div>

    <!-- Employees List -->
    <div class="employees-section">
        <div class="section-header">
            <h3>Employees List</h3>
            <button @click="fetchEmployees" class="refresh-btn">Refresh</button>
        </div>

        <div v-if="loading" class="loading">Loading employees...</div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="!loading && employees.length === 0" class="no-data">
            No employees found.
        </div>

        <div v-if="!loading && employees.length > 0" class="employees-grid">
            <div v-for="employee in employees" :key="employee._id" class="employee-card">
                <div v-if="!employee.editing" class="employee-info">
                    <div class="employee-header">
                        <h4>{{ employee.name }}</h4>
                        <span class="emp-id">{{ employee.emp_code }}</span>
                    </div>
                    <div class="employee-details">
                        <p><strong>Department:</strong> {{ employee.department }}</p>
                        <p><strong>Position:</strong> {{ employee.position }}</p>
                        <p v-if="employee.salary"><strong>Salary:</strong> ${{ employee.salary.toLocaleString() }}</p>
                        <p v-if="employee.email"><strong>Email:</strong> {{ employee.email }}</p>
                        <p v-if="employee.phone"><strong>Phone:</strong> {{ employee.phone }}</p>
                        <p v-if="employee.created_by"><strong>Created by:</strong> {{ employee.created_by }}</p>
                    </div>
                    <div class="employee-actions">
                        <button v-if="userRole === 'admin'" @click="startEdit(employee)" class="edit-btn">
                            Edit
                        </button>
                        <button v-if="canDelete(employee)" @click="deleteEmployee(employee._id)" class="delete-btn"
                            :disabled="deletingId === employee._id">
                            {{ deletingId === employee._id ? 'Deleting...' : 'Delete' }}
                        </button>
                    </div>
                </div>

                <!-- Edit Form -->
                <div v-if="employee.editing && userRole === 'admin'" class="edit-form">
                    <div class="form-row">
                        <input v-model="employee.editData.name" placeholder="Name">
                        <input v-model="employee.editData.department" placeholder="Department">
                    </div>
                    <div class="form-row">
                        <input v-model="employee.editData.position" placeholder="Position">
                        <input v-model="employee.editData.salary" type="number" placeholder="Salary">
                    </div>
                    <div class="form-row">
                        <input v-model="employee.editData.email" type="email" placeholder="Email">
                        <input v-model="employee.editData.phone" placeholder="Phone">
                    </div>
                    <div class="edit-actions">
                        <button @click="saveEmployee(employee)" :disabled="updatingId === employee._id">
                            {{ updatingId === employee._id ? 'Saving...' : 'Save' }}
                        </button>
                        <button @click="cancelEdit(employee)">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

export default {
    name: "ListTab",
    setup() {
        const router = useRouter();
        const employees = ref<any[]>([]);
        const loading = ref(false);
        const error = ref("");
        const userRole = ref(sessionStorage.getItem("userRole") || "");
        const empCode = ref(sessionStorage.getItem("empCode") || "");
        const deletingId = ref("");
        const updatingId = ref("");
        const addingEmployee = ref(false);

        const newEmployee = ref({
            emp_code: "",
            name: "",
            department: "",
            position: "",
            salary: "",
            email: "",
            phone: ""
        });

        const getAuthHeaders = () => {
            const token = sessionStorage.getItem("authToken");
            return {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            };
        };

        const canDelete = (employee: any) => {
            if (userRole.value === "admin") return true;
            return employee.created_by === empCode.value;
        };

        const fetchEmployees = async () => {
            loading.value = true;
            error.value = "";
            try {
                const response = await axios.get("http://localhost:3000/employees", {
                    headers: getAuthHeaders()
                });
                employees.value = response.data.employees.map((emp: any) => ({
                    ...emp,
                    editing: false,
                    editData: { ...emp }
                }));
            } catch (err: any) {
                error.value = err.response?.data?.message || "Failed to fetch employees";
                if (err.response?.status === 401 || err.response?.status === 403) {
                    router.push("/login");
                }
            } finally {
                loading.value = false;
            }
        };

        const addEmployee = async () => {
            addingEmployee.value = true;
            try {
                await axios.post("http://localhost:3000/employees", newEmployee.value, {
                    headers: getAuthHeaders()
                });
                newEmployee.value = { emp_code: "", name: "", department: "", position: "", salary: "", email: "", phone: "" };
                await fetchEmployees();
            } catch (err: any) {
                error.value = err.response?.data?.message || "Failed to add employee";
            } finally {
                addingEmployee.value = false;
            }
        };

        const startEdit = (employee: any) => {
            employee.editing = true;
            employee.editData = { ...employee };
        };

        const cancelEdit = (employee: any) => {
            employee.editing = false;
        };

        const saveEmployee = async (employee: any) => {
            updatingId.value = employee._id;
            try {
                await axios.put(`http://localhost:3000/employees/${employee._id}`, employee.editData, {
                    headers: getAuthHeaders()
                });
                Object.assign(employee, employee.editData);
                employee.editing = false;
            } catch (err: any) {
                error.value = err.response?.data?.message || "Failed to update employee";
            } finally {
                updatingId.value = "";
            }
        };

        const deleteEmployee = async (employeeId: string) => {
            if (!confirm("Are you sure you want to delete this employee?")) return;
            deletingId.value = employeeId;
            try {
                await axios.delete(`http://localhost:3000/employees/${employeeId}`, {
                    headers: getAuthHeaders()
                });
                employees.value = employees.value.filter((emp: any) => emp._id !== employeeId);
            } catch (err: any) {
                error.value = err.response?.data?.message || "Failed to delete employee";
            } finally {
                deletingId.value = "";
            }
        };

        onMounted(fetchEmployees);

        return {
            employees,
            loading,
            error,
            userRole,
            empCode,
            deletingId,
            updatingId,
            addingEmployee,
            newEmployee,
            fetchEmployees,
            addEmployee,
            startEdit,
            cancelEdit,
            saveEmployee,
            deleteEmployee,
            canDelete
        };
    }
};
</script>

<style scoped>
.list-container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 2rem;
}
</style>
