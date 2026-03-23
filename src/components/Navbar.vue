<template>
  <nav class="navbar">
    <div class="navbar-left">
      <!-- Company Selector -->
      <div class="company-selector">
        <button class="company-button">
          <span class="company-icon">🏢</span>
          <span>{{ currentCompany || "Select Company" }}</span>
          <span class="dropdown-icon">▼</span>
        </button>
      </div>
    </div>

    <div class="navbar-center">
      <!-- Search Bar -->
      <div class="search-container">
        <input
          type="text"
          placeholder="搜索资源或智能体..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <div class="navbar-right">
      <!-- Settings -->
      <button class="icon-button" title="Settings">
        <span>⚙️</span>
      </button>

      <!-- Notifications -->
      <button class="icon-button" title="Notifications">
        <span>🔔</span>
        <span class="notification-badge">3</span>
      </button>

      <!-- User Avatar (click to logout) -->
      <button class="user-avatar" title="退出登录" @click="handleLogout">
        <span>{{ userInitial }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
import { RouteName } from "@/router/route-name";

const router = useRouter();
const userStore = useUserStore();

const currentCompany = computed(() => {
  // TODO: Get current company from user store or API
  return "My Company";
});

const userInitial = computed(() => {
  const name = userStore.user?.name || userStore.user?.email || "User";
  return name.charAt(0).toUpperCase();
});

function handleLogout() {
  userStore.logout();
  // Use replace to avoid returning to protected page via browser back
  router.replace({ name: RouteName.Login });
}
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  gap: 20px;
}

.navbar-left {
  flex-shrink: 0;
}

.navbar-center {
  flex: 1;
  max-width: 400px;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* Company Selector */
.company-selector {
  display: flex;
  align-items: center;
}

.company-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}

.company-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.company-icon {
  font-size: 16px;
}

.dropdown-icon {
  font-size: 12px;
  opacity: 0.8;
}

/* Search */
.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 40px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
  pointer-events: none;
  opacity: 0.7;
}

/* Icon Buttons */
.icon-button {
  position: relative;
  padding: 8px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

/* Notification Badge */
.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff6b6b;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
}

/* User Avatar */
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.5);
  color: white;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar:hover {
  background: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.7);
}
</style>
