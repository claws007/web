<script setup lang="ts">
import { useUserStore } from "@/store/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const form = reactive({
  email: "",
  password: "",
});

const errorMessage = ref("");

const redirectTarget = computed(() => {
  const redirect = route.query.redirect;
  return typeof redirect === "string" && redirect ? redirect : "/";
});

async function submit() {
  errorMessage.value = "";
  try {
    await userStore.login({
      email: form.email.trim(),
      password: form.password,
    });
    await router.replace(redirectTarget.value);
  } catch (error) {
    errorMessage.value = getLoginErrorMessage(error);
  }
}

function getLoginErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof error.error === "object" &&
    error.error !== null &&
    "error" in error.error &&
    typeof error.error.error === "string"
  ) {
    return error.error.error;
  }

  return "Login failed. Please check your email and password.";
}
</script>

<template>
  <div
    class="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f4efe2_0%,#ebe2ce_38%,#d6c1a0_100%)] px-6 py-10"
  >
    <div class="absolute inset-0 opacity-60">
      <div
        class="absolute -left-32 -top-24 size-56 rounded-full bg-white/45 blur-3xl"
      ></div>
      <div
        class="absolute -bottom-28 -right-20 size-72 rounded-full bg-[#7d5f36]/15 blur-3xl"
      ></div>
    </div>

    <div
      class="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center"
    >
      <div
        class="grid w-full overflow-hidden rounded-4xl border border-black/5 bg-white/80 shadow-[0_32px_120px_rgba(76,56,30,0.18)] backdrop-blur md:grid-cols-[1.1fr_0.9fr]"
      >
        <div
          class="hidden bg-[#2c2117] p-10 text-[#f5ecdc] md:flex md:flex-col md:justify-between"
        >
          <div class="space-y-5">
            <div class="text-xs uppercase tracking-[0.35em] text-[#d4b98a]">
              Agents Studio
            </div>
            <h1 class="max-w-sm text-4xl font-semibold leading-tight">
              Sign in to manage your agents and model access.
            </h1>
            <p class="max-w-md text-sm leading-7 text-[#dbc9ab]">
              Your session is persisted locally and the API token is attached
              automatically after login.
            </p>
          </div>

          <div class="grid gap-3 text-sm text-[#f2e7d1]">
            <div class="rounded-2xl border border-white/10 bg-white/6 p-4">
              <div class="text-[#d4b98a]">Session restore</div>
              <div class="mt-1">Stored token is restored on refresh.</div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/6 p-4">
              <div class="text-[#d4b98a]">401 handling</div>
              <div class="mt-1">
                Unauthorized responses clear the local session.
              </div>
            </div>
          </div>
        </div>

        <div class="p-7 sm:p-10">
          <div class="mx-auto flex max-w-md flex-col justify-center gap-6">
            <div class="space-y-2">
              <div
                class="text-xs font-medium uppercase tracking-[0.28em] text-[#8d6b3d]"
              >
                Welcome Back
              </div>
              <h2 class="text-3xl font-semibold text-[#261b12]">Login</h2>
              <p class="text-sm leading-6 text-[#6a5640]">
                Use your account credentials to continue.
              </p>
            </div>

            <div class="grid gap-4">
              <div class="grid gap-2">
                <label class="text-sm font-medium text-[#3d2f20]">Email</label>
                <Input
                  v-model="form.email"
                  type="email"
                  placeholder="alice@example.com"
                />
              </div>

              <div class="grid gap-2">
                <label class="text-sm font-medium text-[#3d2f20]"
                  >Password</label
                >
                <Input
                  v-model="form.password"
                  type="password"
                  placeholder="Enter your password"
                />
              </div>

              <div
                v-if="errorMessage"
                class="rounded-2xl bg-[#fff1ef] px-4 py-3 text-sm text-[#cf5337]"
              >
                {{ errorMessage }}
              </div>

              <Button
                type="primary"
                @click="submit"
                :disabled="!form.email.trim() || !form.password"
                :is-loading="userStore.loggingIn"
                class="h-11 rounded-xl"
              >
                Sign In
              </Button>
            </div>

            <div class="text-xs leading-6 text-[#7a6853]">
              After login you will be redirected to
              <span class="font-semibold text-[#3d2f20]">{{
                redirectTarget
              }}</span
              >.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
