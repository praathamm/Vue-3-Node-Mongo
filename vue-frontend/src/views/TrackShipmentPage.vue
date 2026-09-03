<template>
<div class="track-page">
  <section class="tracker-shell">
    <header class="tracker-header">
      <div>
        <p class="eyebrow">Courier Tracking System</p>
        <h1>Where is your package?</h1>
        <p class="subtitle">Use your tracking number for a live delivery snapshot and complete movement history.</p>
      </div>
      <div class="header-actions">
        <router-link class="login-link" to="/login">Login</router-link>
        <img class="header-logo" src="/logo.png" alt="CourierLive" />
      </div>
    </header>

    <div class="search-panel">
      <label for="tracking-number">Tracking number</label>
      <div class="search-row">
        <input id="tracking-number" v-model="trackingNumber" type="text" placeholder="e.g. TRK-ABC123"
          @keyup.enter="lookupShipment" />
        <button type="button" class="btn btn-primary" @click="lookupShipment">
          {{ loading ? 'Searching...' : 'Track package' }}
        </button>
      </div>
      <p v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</p>
    </div>

    <article v-if="shipment" class="result-card">
      <div class="status-hero" :class="statusTone">
        <div>
          <span class="result-label">Tracking number</span>
          <h2>{{ shipment.trackingNumber }}</h2>
        </div>
        <span class="status-badge">{{ shipment.status }}</span>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <span>Current location</span>
          <strong>{{ shipment.lastUpdatedLocation || 'Awaiting update' }}</strong>
        </div>
        <div class="info-card">
          <span>Expected delivery</span>
          <strong>{{ formatDate(shipment.expectedDeliveryDate) }}</strong>
        </div>
        <div class="info-card">
          <span>Delivery agent</span>
          <strong>{{ shipment.deliveryAgent?.name || 'Not assigned yet' }}</strong>
          <small v-if="shipment.deliveryAgent?.email" class="agent-email">{{ shipment.deliveryAgent.email }}</small>
          <a v-if="shipment.deliveryAgent?.phoneNumber" class="call-agent" :href="`tel:${shipment.deliveryAgent.phoneNumber}`">
            Call delivery agent
          </a>
        </div>
      </div>

      <section v-if="hasShipmentDetails" class="details-section">
        <div class="section-heading">
          <div>
            <span class="result-label">Shipment details</span>
            <h3>From, to and package information</h3>
          </div>
          <span v-if="shipment.deliveryType" class="delivery-type">{{ shipment.deliveryType }}</span>
        </div>
        <div class="details-grid">
          <div v-if="shipment.senderName" class="detail-item"><span>Sender</span><strong>{{ shipment.senderName }}</strong></div>
          <div v-if="shipment.senderEmail" class="detail-item"><span>Sender email</span><strong>{{ shipment.senderEmail }}</strong></div>
          <div v-if="shipment.senderContactNumber" class="detail-item"><span>Sender contact</span><strong>{{ shipment.senderContactNumber }}</strong></div>
          <div v-if="shipment.senderAddress" class="detail-item detail-wide"><span>Pickup address</span><strong>{{ shipment.senderAddress }}</strong></div>
          <div v-if="shipment.recipientName" class="detail-item"><span>Recipient</span><strong>{{ shipment.recipientName }}</strong></div>
          <div v-if="shipment.recipientContactNumber" class="detail-item"><span>Recipient contact</span><strong>{{ shipment.recipientContactNumber }}</strong></div>
          <div v-if="shipment.recipientAddress" class="detail-item detail-wide"><span>Delivery address</span><strong>{{ shipment.recipientAddress }}</strong></div>
          <div v-if="shipment.packageWeight" class="detail-item"><span>Package weight</span><strong>{{ shipment.packageWeight }}</strong></div>
          <div v-if="shipment.packageDescription" class="detail-item detail-wide"><span>Description</span><strong>{{ shipment.packageDescription }}</strong></div>
          <div v-if="shipment.deliveryEmailStatus" class="detail-item"><span>Delivery email</span><strong>{{ shipment.deliveryEmailStatus === 'sent' ? `Sent ${formatDate(shipment.deliveryEmailSentAt)}` : 'Not sent' }}</strong></div>
        </div>
      </section>

      <div class="history">
        <div class="section-heading">
          <div>
            <span class="result-label">Journey so far</span>
            <h3>Tracking history</h3>
          </div>
          <span class="event-count">{{ shipment.trackingHistory.length }} updates</span>
        </div>
        <ol>
          <li v-for="entry in shipment.trackingHistory" :key="`${entry.dateTime}-${entry.status}`">
            <span class="timeline-dot"></span>
            <div class="timeline-content">
              <div class="timeline-topline">
                <strong>{{ entry.status }}</strong>
                <time>{{ formatDate(entry.dateTime) }}</time>
              </div>
              <p>{{ entry.location || 'No location recorded' }}</p>
              <small v-if="entry.reason">{{ entry.reason }}</small>
            </div>
          </li>
        </ol>
      </div>
    </article>
  </section>
</div>
</template>

<script lang="ts">
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';
import { useRoute } from 'vue-router';

interface TrackingEntry {
  dateTime: string;
  status: string;
  location: string;
  reason: string;
}

interface TrackingShipment {
  trackingNumber: string;
  status: string;
  lastUpdatedLocation: string;
  expectedDeliveryDate: string;
  senderName?: string;
  senderAddress?: string;
  senderEmail?: string;
  senderContactNumber?: string;
  recipientName?: string;
  recipientAddress?: string;
  recipientContactNumber?: string;
  packageWeight?: string;
  packageDescription?: string;
  deliveryType?: string;
  deliveryEmailStatus?: string;
  deliveryEmailSentAt?: string | null;
  deliveryAgent?: {
    userId: string;
    name: string;
    email: string;
    phoneNumber?: string;
    role: string;
  } | null;
  trackingHistory: TrackingEntry[];
}

export default {
  name: 'TrackShipmentPage',
  setup() {
    const trackingNumber = ref('');
    const route = useRoute();
    const loading = ref(false);
    const errorMessage = ref('');
    const shipment = ref<TrackingShipment | null>(null);
    const statusTone = computed(() => shipment.value?.status.toLowerCase().replace(/\s+/g, '-') || 'pending');
    const hasShipmentDetails = computed(() => Boolean(
      shipment.value && (
        shipment.value.senderName || shipment.value.senderAddress || shipment.value.senderEmail ||
        shipment.value.senderContactNumber || shipment.value.recipientName || shipment.value.recipientAddress ||
        shipment.value.recipientContactNumber || shipment.value.packageWeight || shipment.value.packageDescription ||
        shipment.value.deliveryType || shipment.value.deliveryEmailStatus
      )
    ));

    const formatDate = (value?: string) => {
      if (!value) return 'N/A';
      return new Date(value).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const lookupShipment = async () => {
      errorMessage.value = '';
      shipment.value = null;

      if (!trackingNumber.value.trim()) {
        errorMessage.value = 'Enter a tracking number first.';
        return;
      }

      loading.value = true;
      try {
        const response = await axios.get(`http://localhost:3000/track/${trackingNumber.value.trim()}`);
        shipment.value = response.data.shipment;
      } catch (error: any) {
        errorMessage.value = error.response?.data?.message || 'Unable to find that shipment.';
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      const queryTrackingNumber = route.query.trackingNumber;
      if (typeof queryTrackingNumber === 'string' && queryTrackingNumber.trim()) {
        trackingNumber.value = queryTrackingNumber;
        lookupShipment();
      }
    });

    return { trackingNumber, loading, errorMessage, shipment, statusTone, hasShipmentDetails, formatDate, lookupShipment };
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.track-page {
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
  --color-success: #15803d;
  --color-success-soft: #e9f7ee;
  --color-accent-blue: #2563eb;
  --color-accent-orange: #f59e0b;

  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--color-text);
}

.tracker-shell {
  width: min(100%, 960px);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  box-shadow: 0 20px 48px rgba(23, 26, 33, 0.08);
}

.tracker-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  padding: 24px 36px 22px;
  background: var(--color-surface);
  border-bottom: 4px solid var(--color-accent-orange);
  color: var(--color-text);
}

.tracker-header h1 {
  max-width: 520px;
  margin: 0;
  font-size: clamp(1.7rem, 3.6vw, 2.4rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-accent-blue);
}

.tracker-header .eyebrow {
  color: var(--color-accent-orange);
  font-weight: 600;
}

.tracker-header .subtitle {
  max-width: 520px;
  margin: 10px 0 0;
  color: var(--color-text-muted);
  font-size: 0.94rem;
}

.login-link {
  padding: 10px 16px;
  border: 1px solid #c9d8ff;
  border-radius: 10px;
  color: var(--color-accent-blue);
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 18px;
}

.header-logo {
  flex: 0 0 auto;
  width: auto;
  height: 64px;
  object-fit: contain;
}

.login-link:hover {
  border-color: var(--color-accent-blue);
}

.search-panel {
  padding: 22px 36px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.search-panel label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-muted);
  font-size: 0.86rem;
  font-weight: 600;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 0.78rem;
  font-weight: 600;
}

.search-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

input,
button {
  font: inherit;
}

input {
  flex: 1;
  min-width: 220px;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(31, 111, 92, 0.14);
}

.btn {
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 12px 20px;
  font-weight: 600;
  font-size: 0.94rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.alert {
  margin: 14px 0 0;
  padding: 10px 13px;
  border-radius: 10px;
  font-size: 0.88rem;
}

.alert-danger {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.result-card {
  margin: 24px 36px 32px;
  padding: 0;
  border: 0;
  background: transparent;
}

.status-hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 22px;
  border-radius: 16px;
  background: var(--color-primary-soft);
}

.status-hero.delayed {
  background: var(--color-warning-soft);
}

.status-hero.delivered {
  background: var(--color-success-soft);
}

.result-label {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.status-hero h2 {
  margin: 6px 0 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-text);
}

.status-badge {
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
}

.status-hero.delayed .status-badge {
  background: var(--color-warning);
}

.status-hero.delivered .status-badge {
  background: var(--color-success);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.info-card {
  min-height: 84px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
}

.track-page {
  border-top: 4px solid var(--color-accent-orange);
}

.info-card span {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
}

.info-card strong {
  display: block;
  margin-top: 8px;
  color: var(--color-text);
  font-weight: 600;
}

.call-agent {
  display: inline-block;
  margin-top: 9px;
  color: var(--color-accent-blue);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
}

.call-agent:hover {
  text-decoration: underline;
}

.details-section {
  margin-top: 16px;
  padding: 22px;
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--color-accent-blue);
  border-radius: 16px;
  background: var(--color-surface);
}

.delivery-type {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.14);
  color: #a16207;
  font-size: 0.8rem;
  font-weight: 700;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.detail-item {
  min-width: 0;
  padding: 12px;
  border-radius: 10px;
  background: #fbfcfe;
}

.detail-item.detail-wide {
  grid-column: span 2;
}

.detail-item span {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.detail-item strong {
  display: block;
  margin-top: 5px;
  overflow-wrap: anywhere;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 600;
}

.history {
  margin-top: 16px;
  padding: 22px;
  border-radius: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.section-heading h3 {
  margin: 6px 0 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
}

.event-count {
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.history ol {
  list-style: none;
  padding: 0;
  margin: 14px 0 0;
  display: grid;
  gap: 12px;
}

.history li {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 12px 0 12px 4px;
}

.history li:not(:last-child)::after {
  position: absolute;
  top: 34px;
  bottom: -12px;
  left: 9px;
  width: 2px;
  background: var(--color-border);
  content: '';
}

.timeline-dot {
  z-index: 1;
  flex: 0 0 12px;
  width: 12px;
  height: 12px;
  margin-top: 4px;
  border: 3px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-soft);
}

.timeline-content {
  flex: 1;
}

.timeline-topline {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.timeline-topline strong {
  font-weight: 600;
  color: var(--color-text);
}

.timeline-topline time {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.timeline-content p {
  margin: 5px 0 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.timeline-content small {
  display: block;
  margin-top: 4px;
  color: var(--color-warning);
}

@media (max-width: 768px) {

  .tracker-header,
  .search-panel {
    padding-right: 20px;
    padding-left: 20px;
  }

  .tracker-header {
    flex-direction: column;
  }

  .result-card {
    margin-right: 20px;
    margin-left: 20px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .detail-item.detail-wide {
    grid-column: auto;
  }

  .section-heading,
  .timeline-topline {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
