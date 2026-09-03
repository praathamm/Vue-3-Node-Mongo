<template>
<div class="dashboard">
  <div v-if="assignmentConfirmation" class="modal-backdrop" role="presentation">
    <section class="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="assignment-confirm-title">
      <div class="confirmation-icon">!</div>
      <p class="eyebrow">Assignment confirmation</p>
      <h2 id="assignment-confirm-title">You should normally assign shipments to yourself.</h2>
      <p>
        You are assigning this shipment to another courier because it may be urgent.
        This will be registered on your record. Proceed?
      </p>
      <div class="confirmation-actions">
        <button type="button" class="secondary" @click="cancelAssignmentConfirmation">Cancel</button>
        <button type="button" @click="confirmAssignment">Yes, proceed</button>
      </div>
    </section>
  </div>
  <div v-if="showBookingSuccess" class="modal-backdrop" role="presentation" @click.self="closeBookingSuccess">
    <section class="success-modal" role="dialog" aria-modal="true" aria-labelledby="booking-success-title">
      <button type="button" class="modal-close" aria-label="Close" @click="closeBookingSuccess">&times;</button>
      <div class="success-icon">&#10003;</div>
      <p class="eyebrow">CourierLive</p>
      <h2 id="booking-success-title">Courier order placed successfully</h2>
      <p class="modal-copy">Your shipment has been booked. Keep this tracking ID to follow its journey.</p>
      <div class="tracking-copy-row">
        <strong>{{ bookingTrackingNumber }}</strong>
        <button type="button" class="copy-button" @click="copyTrackingNumber">
          {{ trackingCopied ? 'Copied' : 'Copy ID' }}
        </button>
      </div>
      <button type="button" class="modal-done" @click="closeBookingSuccess">Done</button>
    </section>
  </div>
  <header class="hero">
    <div>
      <p class="eyebrow">Courier Tracking System</p>
      <h1>{{ isCourierStaff ? 'Courier Control Center' : 'Customer Dashboard' }}</h1>
      <p>
        Welcome, {{ user?.name || 'User' }}.
        <span v-if="user?.phoneNumber">Phone: {{ user.phoneNumber }}</span>
      </p>
    </div>
    <div class="hero-actions">
      <router-link v-if="isCourierStaff" class="ghost-button" to="/analytics">Analytics</router-link>
      <router-link class="ghost-button" to="/track">Public Tracking</router-link>
      <button type="button" @click="handleLogout">Logout</button>
    </div>
    <img class="header-logo" src="/logo.png" alt="CourierLive" />
  </header>

  <main class="content" :class="{ 'customer-content': isCustomer, 'courier-content': isCourierStaff }">
    <section v-if="isCustomer" class="panel booking-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Book a courier</p>
          <h2>New shipment</h2>
        </div>
      </div>

      <form class="stack" @submit.prevent="bookShipment">
        <div class="grid-2">
          <div class="field">
            <label>Sender Name</label>
            <input v-model="bookingForm.senderName" type="text" placeholder="Sender full name" />
          </div>
          <div class="field">
            <label>Sender Address</label>
            <input v-model="bookingForm.senderAddress" type="text" placeholder="Pickup address" />
          </div>
          <div class="field">
            <label>Recipient Name</label>
            <input v-model="bookingForm.recipientName" type="text" placeholder="Recipient full name" />
          </div>
          <div class="field">
            <label>Recipient Address</label>
            <input v-model="bookingForm.recipientAddress" type="text" placeholder="Delivery address" />
          </div>
          <div class="field">
            <label>Sender Contact Number</label>
            <input v-model="bookingForm.senderContactNumber" @input="sanitizeContactNumber('senderContactNumber')"
              type="tel" inputmode="numeric" maxlength="10" placeholder="10-digit sender phone" />
          </div>
          <div class="field">
            <label>Recipient Contact Number</label>
            <input v-model="bookingForm.recipientContactNumber" @input="sanitizeContactNumber('recipientContactNumber')"
              type="tel" inputmode="numeric" maxlength="10" placeholder="10-digit recipient phone" />
          </div>
          <div class="field">
            <label>Package Weight</label>
            <input v-model="bookingForm.packageWeight" type="text" placeholder="e.g. 2.5 kg" />
          </div>
          <div class="field">
            <label>Delivery Type</label>
            <select v-model="bookingForm.deliveryType">
              <option value="Standard">Standard</option>
              <option value="Express">Express</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>Package Description</label>
          <textarea v-model="bookingForm.packageDescription" rows="3" maxlength="300"
            placeholder="Optional package description" @input="resizeDescription"></textarea>
          <small class="character-count">{{ bookingForm.packageDescription.length }}/300</small>
        </div>

        <button type="submit" :disabled="bookingLoading">
          {{ bookingLoading ? 'Booking...' : 'Book Courier' }}
        </button>

        <p v-if="bookingError" class="error">{{ bookingError }}</p>
      </form>
    </section>

    <section v-if="isCustomer" class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Booking history</p>
          <h2>My shipments</h2>
        </div>
        <div class="filter-row">
          <label class="filter-field">
            <span>From</span>
            <input v-model="bookingFilters.from" type="date" placeholder="From" aria-label="From date" />
          </label>
          <label class="filter-field">
            <span>To</span>
            <input v-model="bookingFilters.to" type="date" placeholder="To" aria-label="To date" />
          </label>
          <select v-model="bookingFilters.status">
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Transit">In Transit</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>
          <button type="button" class="secondary" @click="applyBookingFilters">Filter</button>
        </div>
      </div>

      <div v-if="customerShipments.length" class="table-wrapper">
        <table class="shipment-table customer-table">
          <thead>
            <tr>
              <th>Tracking No.</th>
              <th>Route</th>
              <th>Delivery Type</th>
              <th>Status</th>
              <th>Expected</th>
              <th>Agent</th>
              <th aria-label="History"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="shipment in customerShipments" :key="shipment.trackingNumber">
              <tr>
                <td class="tracking-cell">{{ shipment.trackingNumber }}</td>
                <td>{{ shipment.senderName }} to {{ shipment.recipientName }}</td>
                <td>{{ shipment.deliveryType }}</td>
                <td><span class="badge">{{ shipment.status }}</span></td>
                <td>{{ formatDate(shipment.expectedDeliveryDate) }}</td>
                <td>{{ shipment.deliveryAgent?.name || 'Not assigned' }}</td>
                <td class="info-cell">
                  <button type="button" class="info-button" :aria-label="`Show history for ${shipment.trackingNumber}`"
                    @click="toggleCustomerHistory(shipment)">
                    i
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div v-if="historyShipment" class="info-tooltip history-popover">
        <div class="popover-heading">
          <strong>Tracking history</strong>
          <button type="button" class="popover-close" @click="historyShipment = null">Close</button>
        </div>
        <ul>
          <li v-for="entry in historyShipment.trackingHistory" :key="`${entry.dateTime}-${entry.status}`">
            <b>{{ entry.status }}</b>
            <span>{{ formatDate(entry.dateTime) }}</span>
            <small>{{ entry.location || 'No location recorded' }}</small>
            <small v-if="entry.reason">{{ entry.reason }}</small>
          </li>
        </ul>
      </div>

      <p v-if="filtersApplied && !customerShipments.length" class="customer-empty">
        No shipments found for the selected filters.
      </p>
    </section>

    <section v-if="isCourierStaff" class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Managed shipments</p>
          <h2>Shipment queue</h2>
        </div>
      </div>

      <p v-if="actionError" class="error">{{ actionError }}</p>

      <div v-if="activeCourierShipments.length" class="table-wrapper">
        <table class="shipment-table">
          <thead>
            <tr>
              <th>Tracking No.</th>
              <th>Route</th>
              <th>Delivery Type</th>
              <th>Status</th>
              <th>Agent</th>
              <th>Expected</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="shipment in activeCourierShipments" :key="shipment.trackingNumber">
              <tr>
                <td class="tracking-cell">{{ shipment.trackingNumber }}</td>
                <td>{{ shipment.senderName }} to {{ shipment.recipientName }}</td>
                <td>{{ shipment.deliveryType }}</td>
                <td>
                  <select v-if="editingShipment === shipment.trackingNumber"
                    v-model="statusDrafts[shipment.trackingNumber].status" class="table-select">
                    <option value="Arrived at Hub">Arrived at Hub</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                  <span v-else class="badge">{{ shipment.status }}</span>
                </td>
                <td>{{ shipment.deliveryAgent?.name || 'Unassigned' }}</td>
                <td>{{ formatDate(shipment.expectedDeliveryDate) }}</td>
                <td>
                  <div class="table-actions">
                    <button v-if="editingShipment !== shipment.trackingNumber" type="button" class="secondary"
                      @click="startEditingShipment(shipment)">
                      Edit
                    </button>
                    <button v-else type="button" :disabled="actionLoading === `save:${shipment.trackingNumber}`"
                      @click="saveShipmentChanges(shipment.trackingNumber)">
                      {{ actionLoading === `save:${shipment.trackingNumber}` ? 'Saving...' : 'Save changes' }}
                    </button>
                    <button v-if="editingShipment === shipment.trackingNumber" type="button" class="secondary"
                      @click="cancelEditingShipment">
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="editingShipment === shipment.trackingNumber" class="edit-row">
                <td colspan="7">
                  <div class="edit-fields">
                    <label class="edit-field">
                      <span>Last updated location</span>
                      <input v-model="statusDrafts[shipment.trackingNumber].location" type="text"
                        placeholder="e.g. Mumbai Hub" />
                    </label>
                    <label v-if="statusDrafts[shipment.trackingNumber].status === 'Delayed'" class="edit-field">
                      <span>Delay reason</span>
                      <input v-model="statusDrafts[shipment.trackingNumber].reason" type="text" maxlength="200"
                        placeholder="Explain the delay" />
                    </label>
                    <label class="edit-field">
                      <span>Assign courier staff</span>
                      <select v-model="assignmentDrafts[shipment.trackingNumber].deliveryAgentEmail"
                        @focus="rememberAssignment(shipment.trackingNumber)"
                        @change="requestAssignmentConfirmation(shipment.trackingNumber)">
                        <option value="">Select courier staff</option>
                        <option v-for="staff in courierStaff" :key="staff.userId" :value="staff.email">
                          {{ staff.name }} - {{ staff.email }}
                        </option>
                      </select>
                    </label>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <p v-else class="empty">No active shipments are available in the queue yet.</p>

      <div v-if="deliveredShipments.length" class="delivery-history">
        <div class="panel-heading history-heading">
          <div>
            <p class="eyebrow">Completed shipments</p>
            <h2>Delivery History</h2>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="shipment-table history-table">
            <thead>
              <tr>
                <th>Tracking No.</th>
                <th>Route</th>
                <th>Delivery Type</th>
                <th>Agent</th>
                <th>Delivered At</th>
                <th>Status</th>
                <th>Customer Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="shipment in deliveredShipments" :key="shipment.trackingNumber">
                <td class="tracking-cell">{{ shipment.trackingNumber }}</td>
                <td>{{ shipment.senderName }} to {{ shipment.recipientName }}</td>
                <td>{{ shipment.deliveryType }}</td>
                <td>{{ shipment.deliveryAgent?.name || 'Not assigned' }}</td>
                <td>{{ formatDate(shipment.deliveredAt || shipment.updatedAt) }}</td>
                <td><span class="badge delivered-badge">Delivered</span></td>
                <td>
                  <button
                    type="button"
                    class="email-button"
                    :disabled="Boolean(shipment.deliveryEmailSentAt) || actionLoading === `email:${shipment.trackingNumber}`"
                    @click="sendDeliveryEmail(shipment.trackingNumber)"
                  >
                    {{ shipment.deliveryEmailSentAt ? 'Email sent' : actionLoading === `email:${shipment.trackingNumber}` ? 'Sending...' : 'Send mail' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

  </main>
</div>
</template>

<script lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

interface ShipmentHistoryEntry {
  dateTime: string;
  status: string;
  location: string;
  reason: string;
  updatedBy: string;
  updatedByRole: string;
}

interface Shipment {
  shipmentId: string;
  trackingNumber: string;
  senderName: string;
  senderAddress: string;
  recipientName: string;
  recipientAddress: string;
  senderContactNumber: string;
  recipientContactNumber: string;
  packageWeight: string;
  packageDescription: string;
  deliveryType: string;
  status: string;
  lastUpdatedLocation: string;
  expectedDeliveryDate: string;
  updatedAt?: string;
  deliveredAt?: string | null;
  deliveryEmailSentAt?: string | null;
  deliveryAgent?: {
    userId: string;
    name: string;
    email: string;
    role: string;
  } | null;
  trackingHistory: ShipmentHistoryEntry[];
}

interface CourierStaff {
  userId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
}

export default {
  name: 'DashboardPage',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const user = computed(() => authStore.user);
    const isCourierStaff = computed(() => authStore.userRole === 'courier_staff');
    const isCustomer = computed(() => authStore.userRole === 'customer');

    const customerShipments = ref<Shipment[]>([]);
    const courierShipments = ref<Shipment[]>([]);
    const activeCourierShipments = computed(() => courierShipments.value.filter((shipment) => shipment.status !== 'Delivered'));
    const deliveredShipments = computed(() => courierShipments.value.filter((shipment) => shipment.status === 'Delivered'));
    const courierStaff = ref<CourierStaff[]>([]);
    const trackingNumber = ref('');
    const trackingLoading = ref(false);
    const historyShipment = ref<Shipment | null>(null);
    const bookingLoading = ref(false);
    const bookingMessage = ref('');
    const bookingError = ref('');
    const bookingTrackingNumber = ref('');
    const showBookingSuccess = ref(false);
    const trackingCopied = ref(false);
    const actionError = ref('');
    const actionLoading = ref('');
    const editingShipment = ref('');

    const bookingForm = reactive({
      senderName: '',
      senderAddress: '',
      recipientName: '',
      recipientAddress: '',
      senderContactNumber: '',
      recipientContactNumber: '',
      packageWeight: '',
      packageDescription: '',
      deliveryType: 'Standard',
    });

    const bookingFilters = reactive({
      from: '',
      to: '',
      status: '',
    });
    const filtersApplied = ref(false);

    const statusDrafts = reactive<Record<string, { status: string; location: string; reason: string }>>({});
    const assignmentDrafts = reactive<Record<string, { deliveryAgentEmail: string; location: string }>>({});
    const assignmentBeforeChange = reactive<Record<string, string>>({});
    const assignmentConfirmation = ref<{
      trackingNumber: string;
      selectedEmail: string;
      previousEmail: string;
    } | null>(null);

    const sanitizeContactNumber = (field: 'senderContactNumber' | 'recipientContactNumber') => {
      bookingForm[field] = bookingForm[field].replace(/\D/g, '').slice(0, 10);
    };

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

    const ensureDrafts = (shipment: Shipment) => {
      if (!statusDrafts[shipment.trackingNumber]) {
        statusDrafts[shipment.trackingNumber] = {
          status: shipment.status,
          location: shipment.lastUpdatedLocation || '',
          reason: '',
        };
      }

      if (!assignmentDrafts[shipment.trackingNumber]) {
        assignmentDrafts[shipment.trackingNumber] = {
          deliveryAgentEmail: shipment.deliveryAgent?.email || '',
          location: shipment.lastUpdatedLocation || '',
        };
      }
    };

    const loadCourierStaff = async () => {
      if (!isCourierStaff.value) return;

      const response = await axios.get('http://localhost:3000/users', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });

      courierStaff.value = response.data.users.filter((staff: CourierStaff) => staff.role === 'courier_staff');
    };

    const loadShipments = async () => {
      if (!authStore.token) return;

      const params: Record<string, string> = {};
      if (isCustomer.value && bookingFilters.from) params.from = bookingFilters.from;
      if (isCustomer.value && bookingFilters.to) params.to = bookingFilters.to;
      if (isCustomer.value && bookingFilters.status) params.status = bookingFilters.status;

      const response = await axios.get('http://localhost:3000/shipments', {
        headers: { Authorization: `Bearer ${authStore.token}` },
        params,
      });

      const shipments = response.data.shipments as Shipment[];

      shipments.forEach((shipment) => ensureDrafts(shipment));

      if (isCourierStaff.value) {
        courierShipments.value = shipments;
        return;
      }

      customerShipments.value = shipments;
    };

    const refreshCustomerData = async () => {
      await loadShipments();
    };

    const refreshCourierData = async () => {
      await Promise.all([loadShipments(), loadCourierStaff()]);
    };

    const bookShipment = async () => {
      bookingMessage.value = '';
      bookingError.value = '';
      showBookingSuccess.value = false;
      trackingCopied.value = false;

      if (
        !bookingForm.senderName.trim() ||
        !bookingForm.senderAddress.trim() ||
        !bookingForm.recipientName.trim() ||
        !bookingForm.recipientAddress.trim() ||
        !bookingForm.senderContactNumber.trim() ||
        !bookingForm.recipientContactNumber.trim() ||
        !bookingForm.packageWeight.trim()
      ) {
        bookingError.value = 'All mandatory booking fields are required.';
        return;
      }

      const validContactNumber = /^\d{10}$/;
      if (!validContactNumber.test(bookingForm.senderContactNumber) || !validContactNumber.test(bookingForm.recipientContactNumber)) {
        bookingError.value = 'Sender and recipient contact numbers must contain exactly 10 digits.';
        return;
      }

      bookingLoading.value = true;

      try {
        const response = await axios.post(
          'http://localhost:3000/shipments',
          { ...bookingForm },
          { headers: { Authorization: `Bearer ${authStore.token}` } }
        );

        bookingTrackingNumber.value = response.data.shipment.trackingNumber;
        showBookingSuccess.value = true;
        Object.assign(bookingForm, {
          senderName: '',
          senderAddress: '',
          recipientName: '',
          recipientAddress: '',
          senderContactNumber: '',
          recipientContactNumber: '',
          packageWeight: '',
          packageDescription: '',
          deliveryType: 'Standard',
        });
        await refreshCustomerData();
      } catch (error: any) {
        bookingError.value = error.response?.data?.message || 'Booking failed.';
      } finally {
        bookingLoading.value = false;
      }
    };

    const rememberAssignment = (trackingNumberValue: string) => {
      assignmentBeforeChange[trackingNumberValue] = assignmentDrafts[trackingNumberValue]?.deliveryAgentEmail || '';
    };

    const requestAssignmentConfirmation = (trackingNumberValue: string) => {
      const selectedEmail = assignmentDrafts[trackingNumberValue]?.deliveryAgentEmail || '';
      const currentUserEmail = user.value?.email || '';

      if (selectedEmail && selectedEmail.toLowerCase() !== currentUserEmail.toLowerCase()) {
        const previousEmail = assignmentBeforeChange[trackingNumberValue] || '';
        assignmentDrafts[trackingNumberValue].deliveryAgentEmail = previousEmail;
        assignmentConfirmation.value = {
          trackingNumber: trackingNumberValue,
          selectedEmail,
          previousEmail,
        };
      }
    };

    const cancelAssignmentConfirmation = () => {
      if (assignmentConfirmation.value) {
        assignmentDrafts[assignmentConfirmation.value.trackingNumber].deliveryAgentEmail =
          assignmentConfirmation.value.previousEmail;
      }
      assignmentConfirmation.value = null;
    };

    const confirmAssignment = () => {
      if (assignmentConfirmation.value) {
        assignmentDrafts[assignmentConfirmation.value.trackingNumber].deliveryAgentEmail =
          assignmentConfirmation.value.selectedEmail;
      }
      assignmentConfirmation.value = null;
    };

    const closeBookingSuccess = () => {
      showBookingSuccess.value = false;
      trackingCopied.value = false;
    };

    const copyTrackingNumber = async () => {
      if (!bookingTrackingNumber.value) return;
      try {
        await navigator.clipboard.writeText(bookingTrackingNumber.value);
        trackingCopied.value = true;
      } catch (error) {
        trackingCopied.value = false;
      }
    };

    const applyBookingFilters = async () => {
      filtersApplied.value = true;
      await loadShipments();
    };

    const toggleCustomerHistory = async (shipment: Shipment) => {
      if (historyShipment.value?.trackingNumber === shipment.trackingNumber) {
        historyShipment.value = null;
        return;
      }

      trackingNumber.value = shipment.trackingNumber;
      trackingLoading.value = true;

      try {
        const response = await axios.get(`http://localhost:3000/track/${shipment.trackingNumber}`);
        Object.assign(shipment, response.data.shipment);
        historyShipment.value = shipment;
      } catch (error: any) {
      } finally {
        trackingLoading.value = false;
      }
    };

    const resizeDescription = (event: Event) => {
      const textarea = event.target as HTMLTextAreaElement;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    const saveShipmentChanges = async (trackingNumberValue: string) => {
      actionLoading.value = `save:${trackingNumberValue}`;
      actionError.value = '';

      try {
        const statusDraft = statusDrafts[trackingNumberValue];
        const assignmentDraft = assignmentDrafts[trackingNumberValue];
        await axios.patch(
          `http://localhost:3000/shipments/${trackingNumberValue}`,
          {
            status: statusDraft.status,
            location: statusDraft.location,
            reason: statusDraft.reason,
            deliveryAgentEmail: assignmentDraft.deliveryAgentEmail,
          },
          { headers: { Authorization: `Bearer ${authStore.token}` } }
        );

        await refreshCourierData();
        editingShipment.value = '';
      } catch (error: any) {
        actionError.value = error.response?.data?.message || 'Shipment changes could not be saved.';
      } finally {
        actionLoading.value = '';
      }
    };

    const sendDeliveryEmail = async (trackingNumberValue: string) => {
      actionLoading.value = `email:${trackingNumberValue}`;
      actionError.value = '';

      try {
        await axios.post(
          `http://localhost:3000/shipments/${trackingNumberValue}/delivery-email`,
          {},
          { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        await refreshCourierData();
      } catch (error: any) {
        actionError.value = error.response?.data?.message || 'Delivery email could not be sent.';
      } finally {
        actionLoading.value = '';
      }
    };

    const startEditingShipment = (shipment: Shipment) => {
      ensureDrafts(shipment);
      editingShipment.value = shipment.trackingNumber;
    };

    const cancelEditingShipment = () => {
      editingShipment.value = '';
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

      if (isCourierStaff.value) {
        await refreshCourierData();
      } else {
        await refreshCustomerData();
      }
    });

    return {
      user,
      isCourierStaff,
      isCustomer,
      customerShipments,
      courierShipments,
      activeCourierShipments,
      deliveredShipments,
      courierStaff,
      trackingNumber,
      trackingLoading,
      bookingForm,
      bookingFilters,
      filtersApplied,
      historyShipment,
      sanitizeContactNumber,
      bookingLoading,
      bookingMessage,
      bookingError,
      bookingTrackingNumber,
      showBookingSuccess,
      trackingCopied,
      actionError,
      actionLoading,
      editingShipment,
      statusDrafts,
      assignmentDrafts,
      assignmentConfirmation,
      formatDate,
      bookShipment,
      closeBookingSuccess,
      copyTrackingNumber,
      applyBookingFilters,
      startEditingShipment,
      rememberAssignment,
      requestAssignmentConfirmation,
      cancelAssignmentConfirmation,
      confirmAssignment,
      cancelEditingShipment,
      toggleCustomerHistory,
      resizeDescription,
      saveShipmentChanges,
      sendDeliveryEmail,
      handleLogout,
    };
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.dashboard {
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
  --color-success: #15803d;
  --color-success-soft: #e9f7ee;
  --color-warning: #b45309;
  --color-warning-soft: #fdf3e3;
  --color-accent-blue: #2563eb;
  --color-accent-orange: #f59e0b;

  min-height: 100vh;
  border-top: 4px solid var(--color-accent-orange);
  padding: 28px;
  background: #ffffff;
  color: var(--color-text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.modal-backdrop {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(23, 26, 33, 0.42);
}

.success-modal {
  position: relative;
  width: min(100%, 440px);
  padding: 32px;
  border: 1px solid #dbe6ff;
  border-top: 5px solid var(--color-accent-orange);
  border-radius: 18px;
  background: var(--color-surface);
  box-shadow: 0 24px 64px rgba(23, 26, 33, 0.2);
  text-align: center;
}

.confirmation-modal {
  width: min(100%, 480px);
  padding: 30px;
  border: 1px solid #f1d5b5;
  border-top: 5px solid var(--color-accent-orange);
  border-radius: 18px;
  background: var(--color-surface);
  box-shadow: 0 24px 64px rgba(23, 26, 33, 0.2);
  text-align: center;
}

.confirmation-icon {
  display: grid;
  width: 44px;
  height: 44px;
  margin: 0 auto 14px;
  place-items: center;
  border-radius: 50%;
  background: #fff4e6;
  color: var(--color-accent-orange);
  font-size: 1.4rem;
  font-weight: 700;
}

.confirmation-modal h2 {
  margin: 0;
  color: var(--color-accent-blue);
  font-size: 1.2rem;
}

.confirmation-modal p:not(.eyebrow) {
  margin: 12px 0 22px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.55;
}

.confirmation-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.confirmation-actions button {
  min-width: 130px;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 12px;
  padding: 2px 8px;
  background: transparent !important;
  color: var(--color-text-muted) !important;
  font-size: 1.4rem;
  line-height: 1;
}

.success-icon {
  display: grid;
  width: 48px;
  height: 48px;
  margin: 0 auto 14px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-success-soft);
  color: var(--color-success);
  font-size: 1.5rem;
  font-weight: 700;
}

.success-modal .eyebrow {
  margin-bottom: 6px;
}

.success-modal h2 {
  margin: 0;
  color: var(--color-accent-blue);
  font-size: 1.25rem;
}

.modal-copy {
  margin: 10px 0 18px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.tracking-copy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px 10px 16px;
  border: 1px solid #c9d8ff;
  border-radius: 10px;
  background: #f5f8ff;
  color: var(--color-accent-blue);
}

.tracking-copy-row strong {
  overflow-wrap: anywhere;
  font-size: 0.9rem;
}

.copy-button,
.modal-done {
  width: auto !important;
  padding: 8px 12px !important;
  border-radius: 8px !important;
  background: var(--color-accent-blue) !important;
  color: #fff !important;
  font-size: 0.8rem !important;
}

.modal-done {
  width: 100% !important;
  margin-top: 18px;
  padding: 10px 14px !important;
  background: var(--color-primary) !important;
  font-size: 0.88rem !important;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 26px;
  border-radius: 16px;
  background: var(--color-surface);
  border: 1px solid #f1d5b5;
  border-top: 5px solid var(--color-accent-orange);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.08);
  color: var(--color-text);
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--color-accent-orange);
}

.hero h1,
.panel h2 {
  margin: 0;
}

.hero h1 {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-accent-blue);
}

.hero p {
  margin: 8px 0 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.hero-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

button,
.ghost-button {
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 10px 16px;
  font: inherit;
  font-weight: 600;
  font-size: 0.88rem;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.hero button,
.hero .ghost-button {
  background: var(--color-primary-soft);
  border-color: #c9d8ff;
  color: var(--color-accent-blue);
}

.hero button:hover,
.hero .ghost-button:hover {
  background: #dbe6ff;
}

.header-logo {
  flex: 0 0 auto;
  width: auto;
  height: 64px;
  object-fit: contain;
}

.content button {
  background: var(--color-primary);
  color: #fff;
}

.content button:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.content button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

button.secondary {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text);
}

button.secondary:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 20px 0;
}

.stat-card,
.panel,
.tracking-result {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(23, 26, 33, 0.05);
}

.stat-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-card span,
.field label,
.shipment-grid span,
.staff-card span,
.staff-card small,
.history small {
  color: var(--color-text-muted);
  font-size: 0.88rem;
}

.stat-card strong {
  font-size: 2rem;
  font-weight: 700;
}

.content {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.customer-content {
  max-width: 1080px;
  margin-left: auto;
  margin-right: auto;
  grid-template-columns: 1fr;
}

.courier-content {
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  grid-template-columns: 1fr;
}

.panel {
  padding: 22px;
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-heading h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-accent-blue);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grid-2,
.shipment-grid,
.action-grid,
.staff-grid {
  display: grid;
  gap: 14px;
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field,
.action-block,
.staff-card,
.shipment-card,
.tracking-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-weight: 500;
  color: var(--color-text);
  font-size: 0.86rem;
}

input,
select,
textarea {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 11px 13px;
  font: inherit;
  font-size: 0.92rem;
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(31, 111, 92, 0.14);
}

textarea {
  min-height: 78px;
  overflow: hidden;
  resize: none;
}

.grid-2>.field {
  min-width: 0;
}

.shipment-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 14px;
}

.shipment-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 940px;
}

.shipment-table th,
.shipment-table td {
  padding: 13px 14px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  font-size: 0.9rem;
}

.shipment-table th {
  background: #eaf0ff;
  color: var(--color-accent-blue);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.shipment-table tbody tr:last-child td {
  border-bottom: none;
}

.shipment-table tbody tr:hover {
  background: #fafbfc;
}

.tracking-cell {
  color: var(--color-text);
  font-weight: 600;
}

.info-cell {
  position: relative;
  text-align: center !important;
}

.info-button {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-family: Georgia, serif;
  font-style: italic;
  font-weight: 700;
}

.info-tooltip {
  z-index: 5;
  width: 280px;
  max-width: 100%;
  margin: 14px 0 0 auto;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  box-shadow: 0 16px 36px rgba(23, 26, 33, 0.14);
  text-align: left;
  white-space: normal;
}

.popover-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.popover-heading strong {
  font-weight: 600;
}

.popover-close {
  margin: 0;
  padding: 5px 10px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.74rem;
}

.info-tooltip ul {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 10px 0 0;
  list-style: none;
}

.info-tooltip li {
  display: grid;
  gap: 2px;
  padding-left: 9px;
  border-left: 3px solid var(--color-primary);
}

.info-tooltip span,
.info-tooltip small {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.table-select {
  min-width: 150px;
  padding: 8px 10px;
}

.table-actions,
.edit-fields {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.edit-row td {
  padding-top: 12px;
  padding-bottom: 12px;
  background: #fafbfc;
}

.edit-fields input,
.edit-fields select {
  width: auto;
  min-width: 190px;
  padding: 8px 10px;
}

.shipment-card,
.tracking-result {
  padding: 16px;
}

.shipment-card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.shipment-card-top h3 {
  margin: 0;
}

.shipment-card-top p {
  margin: 4px 0 0;
  color: var(--color-text-muted);
}

.badge {
  display: inline-block;
  border-radius: 999px;
  padding: 5px 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 600;
}

.delivered-badge {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.shipment-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.shipment-grid strong,
.staff-card strong {
  display: block;
  margin-top: 4px;
}

.inline-actions,
.filter-row,
.tracking-form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-row input,
.filter-row select {
  width: auto;
  min-width: 150px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 600;
}

.filter-field input {
  min-width: 150px;
}

.character-count {
  align-self: flex-end;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.action-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.action-block {
  padding: 14px;
  border-radius: 14px;
  background: #fafbfc;
  border: 1px solid var(--color-border);
}

.action-block h4,
.history h4 {
  margin: 0;
}

.tracking-panel {
  grid-column: 1 / -1;
}

.tracking-form input {
  flex: 1;
  min-width: 240px;
}

.history ul {
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
  display: grid;
  gap: 12px;
}

.history li {
  border-left: 3px solid var(--color-primary);
  padding-left: 12px;
}

.staff-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.staff-card {
  padding: 14px;
  border-radius: 14px;
  background: #fafbfc;
  border: 1px solid var(--color-border);
}

.success {
  color: var(--color-success);
  margin: 0;
  font-size: 0.88rem;
}

.error,
.empty {
  color: var(--color-danger);
  margin: 0;
  font-size: 0.88rem;
}

.empty {
  padding: 24px;
  text-align: center;
  color: var(--color-text-muted);
  border: 1px dashed var(--color-border);
  border-radius: 14px;
}

.delivery-history {
  margin-top: 28px;
}

.history-heading {
  margin-bottom: 14px;
}

.customer-empty {
  margin: 16px 0 0;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  text-align: center;
}

@media (max-width: 1024px) {

  .content,
  .stats-grid,
  .staff-grid,
  .action-grid,
  .grid-2 {
    grid-template-columns: 1fr;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
