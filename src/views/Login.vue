<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import KeepLoginCheckbox from "@/components/Checkbox.vue";
import { useUserStore } from "@/store/user";
import { msg } from "@/utils/message";

const router = useRouter();
const userStore = useUserStore();

const userId = ref("");
const password = ref("");
const keepLoggedIn = ref(true);
const loading = ref(false);

async function handleSubmit() {
  loading.value = true;
  try {
    await userStore.login(userId.value, password.value, keepLoggedIn.value);
    router.push("/");
  } catch {
    msg.error("登录失败，请检查您的账号和密码");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuroraBackground>
    <main class="login-page">
      <section class="login-shell">
        <div class="brand-mark" aria-hidden="true">✦</div>
        <h1 class="brand-title">
          <div>一人工作室</div>
          <p class="card-subtitle">只一人可抵千军万马</p>
        </h1>

        <form class="login-card" @submit.prevent="handleSubmit">
          <h2 class="card-title">欢迎回来</h2>
          <p class="card-subtitle">请输入您的凭证以启动您的个人工作室</p>

          <div class="form-grid">
            <Input
              v-model="userId"
              label="ID"
              placeholder="yourname@alchemy.io"
              type="email"
              validate="^[^\s@]+@[^\s@]+\.[^\s@]+$"
            />
            <Input
              v-model="password"
              label="Password"
              placeholder="••••••••"
              type="password"
            />
          </div>

          <div class="meta-row">
            <KeepLoginCheckbox v-model="keepLoggedIn" label="保持登录" />
            <a href="#" class="forgot-link">忘记密码</a>
          </div>

          <PrimaryButton class="w-full" type="submit" :loading="loading"
            >登录</PrimaryButton
          >

          <p class="or-text">或者通过以下方式登录</p>

          <div class="social-row">
            <button type="button" class="social-btn">Google</button>
            <button type="button" class="social-btn">GitHub</button>
          </div>
        </form>

        <p class="register-text">
          还没有账户？先来
          <a href="#">注册一个用户吧！</a>
        </p>
      </section>
    </main>
  </AuroraBackground>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.login-shell {
  width: min(92vw, 25rem);
  text-align: center;
}

.brand-mark {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 0.7rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: var(--secondary);
  border: 1px solid rgb(0 104 119 / 0.6);
  background: rgb(255 255 255 / 0.75);
  box-shadow: 0 8px 24px rgb(0 104 119 / 0.14);
}

.brand-title {
  font-size: 1.85rem;
  font-weight: 800;
  margin-bottom: 1.6rem;
  color: #11131a;
}

.login-card {
  border-radius: 2rem;
  padding: 2.15rem 1.9rem 1.7rem;
  background: rgb(248 247 253 / 0.86);
  border: 1px solid rgb(120 37 234 / 0.13);
  box-shadow: 0 20px 60px rgb(30 56 111 / 0.08);
  backdrop-filter: blur(8px);
}

.card-title {
  font-size: 2.1rem;
  font-weight: 800;
  margin-bottom: 0.4rem;
  color: #11131a;
}

.card-subtitle {
  font-size: 0.84rem;
  font-weight: 400;
  color: var(--foreground-muted);
  margin-bottom: 1.25rem;
}

.form-grid {
  display: grid;
  gap: 1.15rem;
  text-align: left;
  margin-bottom: 1rem;
}

.meta-row {
  margin-bottom: 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.78rem;
}

.forgot-link {
  color: var(--primary);
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.or-text {
  margin: 1rem 0 0.95rem;
  color: rgb(90 102 109 / 0.75);
  font-size: 0.72rem;
}

.social-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.social-btn {
  height: 2.4rem;
  border-radius: 999px;
  border: 1px solid rgb(90 102 109 / 0.25);
  background: rgb(255 255 255 / 0.85);
  font-size: 0.9rem;
  color: #242933;
  cursor: pointer;
  transition: transform var(--duration-gentle) var(--ease-crystal);
}

.social-btn:hover {
  transform: translateY(-1px);
}

.register-text {
  margin-top: 1.55rem;
  font-size: 0.93rem;
  color: var(--foreground-muted);
}

.register-text a {
  color: #b50066;
  text-decoration: none;
  font-weight: 700;
}

@media (max-width: 540px) {
  .brand-title {
    font-size: 1.6rem;
  }

  .card-title {
    font-size: 1.8rem;
  }

  .login-card {
    padding: 1.75rem 1.35rem 1.45rem;
    border-radius: 1.5rem;
  }
}
</style>
