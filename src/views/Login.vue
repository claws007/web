<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Form from "@/components/Form.vue";
import Input from "@/components/Input.vue";
import KeepLoginCheckbox from "@/components/Checkbox.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import { useUserStore } from "@/store/user";
import { msg } from "@/utils/message";
import TextButton from "@/components/TextButton.vue";
import DefaultButton from "@/components/DefaultButton.vue";
import { required, email as emailValidator } from "@/utils/validators";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const email = ref("");
const password = ref("");
const keepLoggedIn = ref(true);
const loading = ref(false);

function resolveRedirectPath() {
  const redirect =
    typeof route.query.redirect === "string" ? route.query.redirect : "/";
  if (redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return "/";
}

if (userStore.isLoggedIn) {
  router.replace(resolveRedirectPath());
}

// Define form validators
const formValidators = {
  email: [required("请输入邮箱"), emailValidator()],
  password: [required("请输入密码")],
};

async function handleSubmit() {
  loading.value = true;
  try {
    await userStore.login(email.value, password.value, keepLoggedIn.value);
    router.push(resolveRedirectPath());
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
          <p class="card-subtitle">可抵千军万马</p>
        </h1>

        <Form ref="formRef" :validators="formValidators" @submit="handleSubmit">
          <div class="login-card">
            <h2 class="card-title">欢迎回来</h2>
            <p class="card-subtitle">请输入您的凭证以启动您的个人工作室</p>

            <div class="form-grid">
              <Input
                v-model="email"
                label="Email"
                placeholder="yourname@alchemy.io"
                type="email"
                field-name="email"
              />
              <Input
                v-model="password"
                label="Password"
                placeholder="••••••••"
                type="password"
                field-name="password"
              />
            </div>

            <div class="meta-row">
              <KeepLoginCheckbox v-model="keepLoggedIn" label="保持登录" />
              <TextButton href="#">忘记密码</TextButton>
            </div>

            <PrimaryButton class="w-full" type="submit" :loading="loading"
              >登录</PrimaryButton
            >

            <p class="or-text">或者通过以下方式登录</p>

            <div class="social-row">
              <DefaultButton>Google</DefaultButton>
              <DefaultButton>GitHub</DefaultButton>
            </div>
          </div>
        </Form>

        <p class="register-text">
          还没有账户？先来
          <TextButton href="#" class="register-link"
            >注册一个用户吧！</TextButton
          >
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

.register-text {
  margin-top: 1.55rem;
  font-size: 0.93rem;
  color: var(--foreground-muted);
}

.register-text :deep(.register-link) {
  color: #b50066;
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
