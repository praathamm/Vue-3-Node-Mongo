<template>
<div class="dashboard-container">
  <!-- Header -->
  <HeaderSection :userRole="userRole" :empCode="empCode" @logout="handleLogout" />


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

        <!-- Edit Form (Admin Only) -->
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
import { useRouter } from "vue-router";
import HeaderSection from "./Header.vue";
import axios from "axios";

export default {
  name: "DashboardPage",
  components: {
    HeaderSection,
  },
  setup() {
    const router = useRouter();
    const employees = ref([]);
    const loading = ref(false);
    const error = ref("");
    const userRole = ref("");
    const empCode = ref("");
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

    // Get auth token and user info
    const getAuthHeaders = () => {
      const token = sessionStorage.getItem('authToken');
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    };

    // Check if user can delete employee
    const canDelete = (employee: any) => {
      if (userRole.value === 'admin') return true;
      return employee.created_by === empCode.value;
    };

    // Fetch employees
    const fetchEmployees = async () => {
      loading.value = true;
      error.value = "";

      try {
        const response = await axios.get('http://localhost:3000/employees', {
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
          handleLogout();
        }
      } finally {
        loading.value = false;
      }
    };

    // Add employee (Admin only)
    const addEmployee = async () => {
      if (userRole.value !== 'admin') return;

      addingEmployee.value = true;
      try {
        await axios.post('http://localhost:3000/employees', newEmployee.value, {
          headers: getAuthHeaders()
        });

        // Reset form
        newEmployee.value = {
          emp_code: "",
          name: "",
          department: "",
          position: "",
          salary: "",
          email: "",
          phone: ""
        };

        // Refresh list
        await fetchEmployees();
      } catch (err: any) {
        error.value = err.response?.data?.message || "Failed to add employee";
      } finally {
        addingEmployee.value = false;
      }
    };

    // Start editing employee
    const startEdit = (employee: any) => {
      employee.editing = true;
      employee.editData = { ...employee };
    };

    // Cancel editing
    const cancelEdit = (employee: any) => {
      employee.editing = false;
    };

    // Save employee changes
    const saveEmployee = async (employee: any) => {
      updatingId.value = employee._id;
      try {
        await axios.put(`http://localhost:3000/employees/${employee._id}`,
          employee.editData, {
          headers: getAuthHeaders()
        });

        // Update local data
        Object.assign(employee, employee.editData);
        employee.editing = false;
      } catch (err: any) {
        error.value = err.response?.data?.message || "Failed to update employee";
      } finally {
        updatingId.value = "";
      }
    };

    // Delete employee
    const deleteEmployee = async (employeeId: string) => {
      if (!confirm('Are you sure you want to delete this employee?')) return;

      deletingId.value = employeeId;
      try {
        await axios.delete(`http://localhost:3000/employees/${employeeId}`, {
          headers: getAuthHeaders()
        });

        // Remove from local list
        employees.value = employees.value.filter((emp: any) => emp._id !== employeeId);
      } catch (err: any) {
        error.value = err.response?.data?.message || "Failed to delete employee";
      } finally {
        deletingId.value = "";
      }
    };

    // Logout
    const handleLogout = async () => {
      try {
        await axios.post('http://localhost:3000/logout', {}, {
          headers: getAuthHeaders()
        });
      } catch (err) {
        console.log("Logout API call failed, but clearing local storage anyway");
      }

      // Clear session storage
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('empCode');

      router.push('/login');
    };

    // Initialize component
    onMounted(() => {
      const token = sessionStorage.getItem('authToken');
      userRole.value = sessionStorage.getItem('userRole') || '';
      empCode.value = sessionStorage.getItem('empCode') || '';

      if (!token) {
        router.push('/login');
        return;
      }

      fetchEmployees();
    });

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
      handleLogout,
      canDelete
    };
  },
};
</script>

<style>
.dashboard-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  color: #0f3460;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
}

.role-badge.admin {
  background: #28a745;
  color: white;
}

.role-badge.user {
  background: #007bff;
  color: white;
}

.emp-code {
  font-weight: bold;
  color: #6c757d;
}

.logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #c82333;
}

.add-employee-section,
.employees-section {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.add-employee-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.add-employee-section h3 {
  margin-top: 0;
  color: #0f3460;
}

.employee-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: center;
}

.form-row input,
.form-row button {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-row button {
  background: #0f3460;
  color: white;
  border: none;
  cursor: pointer;
}

.form-row button:hover:not(:disabled) {
  background: #16213e;
}

.form-row button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  color: #0f3460;
  margin: 0;
}

.refresh-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.refresh-btn:hover {
  background: #218838;
}

.loading,
.error-message,
.no-data {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.error-message {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.employees-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.employee-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.employee-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.employee-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.employee-header h4 {
  margin: 0;
  color: #0f3460;
}

.emp-id {
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.employee-details {
  margin-bottom: 1rem;
}

.employee-details p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.employee-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.edit-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.edit-btn:hover {
  background: #0056b3;
}

.delete-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.delete-btn:hover:not(:disabled) {
  background: #c82333;
}

.delete-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.edit-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.edit-form input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.edit-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.edit-actions button:first-child {
  background: #28a745;
  color: white;
}

.edit-actions button:first-child:hover:not(:disabled) {
  background: #218838;
}

.edit-actions button:first-child:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.edit-actions button:last-child {
  background: #6c757d;
  color: white;
}

.edit-actions button:last-child:hover {
  background: #5a6268;
}

/* Responsive design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .user-info {
    justify-content: center;
  }

  .add-employee-section,
  .employees-section {
    padding: 0 1rem;
  }

  .employees-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
