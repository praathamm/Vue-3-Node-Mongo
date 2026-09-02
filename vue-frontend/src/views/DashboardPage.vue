<template>
<div class="dashboard">
  <header class="topbar">
    <div>
      <h2>Generic CRUD App</h2>
      <p>Welcome, {{ user?.name || 'User' }}</p>
    </div>
    <button @click="handleLogout">Logout</button>
  </header>

  <main class="content">
    <section class="panel">
      <h3>{{ editingId ? 'Edit item' : 'Add new item' }}</h3>

      <form @submit.prevent="saveItem">
        <label>Title</label>
        <input v-model="form.title" type="text" placeholder="Item title" />

        <label>Description</label>
        <textarea v-model="form.description" placeholder="Item description"></textarea>

        <div class="buttons">
          <button type="submit">{{ editingId ? 'Update' : 'Create' }}</button>
          <button v-if="editingId" type="button" class="secondary" @click="resetForm">Cancel</button>
        </div>
      </form>

      <p v-if="formError" class="error">{{ formError }}</p>
    </section>

    <section class="panel">
      <h3>Items</h3>

      <table v-if="items.length">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item._id">
            <td>{{ item.title }}</td>
            <td>{{ item.description }}</td>
            <td>
              <button type="button" @click="editItem(item)">Edit</button>
              <button type="button" class="danger" @click="deleteItem(item._id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else class="empty">No items yet.</p>
    </section>

    <section v-if="user?.role === 'admin'" class="panel">
      <h3>Users</h3>
      <ul class="users">
        <li v-for="person in users" :key="person.userId">
          {{ person.name }} - {{ person.email }} - {{ person.role }}
        </li>
      </ul>
    </section>
  </main>
  <ChatBot />
</div>
</template>

<script lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import ChatBot from './ChatBot.vue';

interface Item {
  _id: string;
  title: string;
  description: string;
  createdBy?: string;
}

export default {
  name: 'DashboardPage',
  components: { ChatBot },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const user = computed(() => authStore.user);
    const items = ref<Item[]>([]);
    const users = ref<any[]>([]);
    const editingId = ref<string | null>(null);
    const form = ref({ title: '', description: '' });
    const formError = ref('');

    const loadItems = async () => {
      try {
        const response = await axios.get('http://localhost:3000/items', {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        items.value = response.data.items;
      } catch (error: any) {
        console.error('Failed to load items', error);
      }
    };

    const loadUsers = async () => {
      if (authStore.userRole !== 'admin') return;

      try {
        const response = await axios.get('http://localhost:3000/users', {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        users.value = response.data.users;
      } catch (error: any) {
        console.error('Failed to load users', error);
      }
    };

    const resetForm = () => {
      editingId.value = null;
      form.value = { title: '', description: '' };
      formError.value = '';
    };

    const saveItem = async () => {
      formError.value = '';

      if (!form.value.title.trim() || !form.value.description.trim()) {
        formError.value = 'Title and description are required.';
        return;
      }

      try {
        if (editingId.value) {
          await axios.put(`http://localhost:3000/items/${editingId.value}`, form.value, {
            headers: { Authorization: `Bearer ${authStore.token}` },
          });
        } else {
          await axios.post('http://localhost:3000/items', form.value, {
            headers: { Authorization: `Bearer ${authStore.token}` },
          });
        }

        resetForm();
        await loadItems();
      } catch (error: any) {
        formError.value = error.response?.data?.message || 'Save failed.';
      }
    };

    const editItem = (item: Item) => {
      editingId.value = item._id;
      form.value = {
        title: item.title,
        description: item.description,
      };
    };

    const deleteItem = async (id: string) => {
      try {
        await axios.delete(`http://localhost:3000/items/${id}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        await loadItems();
      } catch (error: any) {
        formError.value = error.response?.data?.message || 'Delete failed.';
      }
    };

    const handleLogout = () => {
      authStore.logout();
      router.push('/login');
    };

    onMounted(async () => {
      if (!authStore.isAuthenticated) {
        router.push('/login');
        return;
      }

      await loadItems();
      await loadUsers();
    });

    return {
      user,
      items,
      users,
      form,
      editingId,
      formError,
      saveItem,
      editItem,
      deleteItem,
      resetForm,
      handleLogout,
    };
  },
};
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background: #f3f4f6;
  min-height: 100vh;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 20px;
}

.content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

.panel {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

input,
textarea {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

textarea {
  min-height: 100px;
}

button {
  padding: 9px 12px;
  border: none;
  border-radius: 4px;
  background: #111827;
  color: white;
  cursor: pointer;
}

button.secondary {
  background: #e5e7eb;
  color: #111827;
}

button.danger {
  background: #b91c1c;
}

.buttons {
  display: flex;
  gap: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

.users {
  margin: 0;
  padding-left: 18px;
}

.empty,
.error {
  color: #374151;
}

.error {
  color: #b91c1c;
}

@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
