<template>
<div class="summary-page">
  <header class="topbar">
    <div>
      <p class="eyebrow">Courier Staff</p>
      <h1>Shipment Analytics</h1>
      <p class="subtitle">Quick overview of the shipments assigned to you.</p>
    </div>
    <nav>
      <router-link class="btn btn-secondary" to="/dashboard">Control Center</router-link>
      <button type="button" class="btn btn-primary" @click="handleLogout">Logout</button>
    </nav>
    <img class="header-logo" src="/logo.png" alt="CourierLive" />
  </header>

  <p v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</p>

  <main class="content">
    <section class="stats-grid">
      <article class="stat-card">
        <span>Total processed</span>
        <strong>{{ summary.totalShipmentsProcessed }}</strong>
      </article>
      <article class="stat-card accent">
        <span>Delivered</span>
        <strong>{{ summary.deliveredShipments }}</strong>
      </article>
      <article class="stat-card warn">
        <span>Pending</span>
        <strong>{{ summary.pendingShipments }}</strong>
      </article>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>Delivery progress</h2>
        <span class="percent-pill">{{ deliveryPercentage }}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-bar" :style="{ width: `${deliveryPercentage}%` }"></div>
      </div>
      <p class="progress-caption">{{ deliveryPercentage }}% of your processed shipments have been delivered.</p>
    </section>
  </main>
</div>
</template>

<script lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'ShipmentSummaryPage',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const errorMessage = ref('');
    const summary = ref({
      totalShipmentsProcessed: 0,
      deliveredShipments: 0,
      pendingShipments: 0,
    });

    const deliveryPercentage = computed(() => {
      if (!summary.value.totalShipmentsProcessed) return 0;
      return Math.round((summary.value.deliveredShipments / summary.value.totalShipmentsProcessed) * 100);
    });

    const handleLogout = () => {
      authStore.logout();
      router.push('/login');
    };

    onMounted(async () => {
      try {
        const response = await axios.get('http://localhost:3000/shipments/summary', {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        summary.value = response.data.summary;
      } catch (error: any) {
        errorMessage.value = error.response?.data?.message || 'Unable to load shipment analytics.';
      }
    });

    return { summary, deliveryPercentage, errorMessage, handleLogout };
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.summary-page {
  --color-bg: #f6f7f9;
  --color-surface: #ffffff;
  --color-border: #e3e7ec;
  --color-text: #171a21;
  --color-text-muted: #667085;
  --color-primary: #1f6f5c;
  --color-primary-hover: #175647;
  --color-primary-soft: #e4f1ec;
  --color-danger: #b42318;
  --color-danger-soft: #fdedec;
  --color-warning: #b45309;
  --color-warning-soft: #fdf3e3;
  --color-accent-blue: #2563eb;
  --color-accent-orange: #f59e0b;

  min-height: 100vh;
  border-top: 4px solid var(--color-accent-orange);
  padding: 32px;
  background: #ffffff;
  color: var(--color-text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.topbar {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  max-width: 1000px;
  margin: 0 auto 28px;
  padding: 20px 24px 16px;
  border: 1px solid #f1d5b5;
  border-bottom: 4px solid var(--color-accent-orange);
  border-radius: 16px;
  background: var(--color-surface);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.08);
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-primary);
}

h1 {
  margin: 0;
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-accent-blue);
}

.header-logo {
  flex: 0 0 auto;
  width: auto;
  height: 64px;
  object-fit: contain;
}

.subtitle {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  font-size: 0.94rem;
}

nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn {
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 10px 16px;
  font: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.btn-secondary {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card,
.panel {
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  box-shadow: 0 8px 24px rgba(23, 26, 33, 0.05);
}

.stat-card {
  padding: 22px;
}

.stat-card span {
  color: var(--color-text-muted);
  font-size: 0.86rem;
  font-weight: 500;
}

.stat-card strong {
  display: block;
  margin-top: 12px;
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stat-card.accent strong {
  color: var(--color-primary);
}

.stat-card.warn strong {
  color: var(--color-warning);
}

.panel {
  padding: 24px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-accent-blue);
}

.percent-pill {
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
  font-size: 0.86rem;
}

.progress-track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #eef1ef;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.progress-caption {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.alert {
  max-width: 1000px;
  margin: 0 auto 16px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.9rem;
}

.alert-danger {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

@media (max-width: 700px) {
  .summary-page {
    padding: 18px;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
