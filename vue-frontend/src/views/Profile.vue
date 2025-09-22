<template>
<div class="profile-container">
    <h2>My Profile</h2>
    <div class="profile-card">
        <p><strong>Name:</strong> John Doe</p>
        <p><strong>Employee Code:</strong> EMP001</p>
        <p><strong>Department:</strong> IT</p>
        <p><strong>Position:</strong> Full Stack Developer</p>
        <p><strong>Email:</strong> john.doe@example.com</p>
        <p><strong>Phone:</strong> +91 9876543210</p>
    </div>
</div>
</template>

<script lang="ts">
export default {
    name: "ProfileTab",
};
</script>

<style scoped>
.profile-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-card p {
    margin: 0.5rem 0;
    font-size: 1rem;
}
</style>
