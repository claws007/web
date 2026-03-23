<script setup lang="ts">
import { ref } from "vue";
import Form from "@/components/Form.vue";
import Input from "@/components/Input.vue";
import Textarea from "@/components/Textarea.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import { required, minLength, optional } from "@/utils/validators";
import { msg } from "@/utils/message";

const logoInputRef = ref<HTMLInputElement | null>(null);
const logoFileName = ref("");
const companyName = ref("");
const companyIntro = ref("");
const loading = ref(false);

const formValidators = {
  companyName: [
    required("请输入公司名称"),
    minLength(2, "公司名称至少2个字符"),
  ],
  companyIntro: [
    // required("请输入公司简介"),
    optional([minLength(6, "公司简介至少6个字符")]),
  ],
};

function openLogoPicker() {
  logoInputRef.value?.click();
}

function onLogoChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  logoFileName.value = file?.name ?? "";
}

async function handleCreate() {
  loading.value = true;
  try {
    msg.info("请接入公司创建 API 后提交数据");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuroraBackground
    class="size-full"
    view-class="v justify-center items-center"
  >
    <div class="create-company-page">
      <section class="hero">
        <h1 class="title">
          开启你的
          <span class="title-gradient">一人公司之旅</span>
        </h1>
        <p class="subtitle">在数字维度中凝聚第一枚晶石，定义你的品牌之源。</p>
      </section>

      <Form :validators="formValidators" @submit="handleCreate">
        <div class="panel">
          <div class="upload-area">
            <button class="upload-btn" type="button" @click="openLogoPicker">
              <span class="upload-plus">
                <span class="relative -top-0.75"> + </span></span
              >
              <span class="upload-text"> UPLOAD</span>
            </button>
            <input
              ref="logoInputRef"
              type="file"
              accept="image/*"
              class="hidden-input"
              @change="onLogoChange"
            />
            <p class="upload-hint">上传公司 Logo / 商标</p>
            <p v-if="logoFileName" class="upload-file">
              已选择：{{ logoFileName }}
            </p>
          </div>

          <div class="form-grid">
            <Input
              v-model="companyName"
              label="公司名称"
              placeholder="输入公司名称..."
              field-name="companyName"
            />

            <Textarea
              v-model="companyIntro"
              label="公司简介"
              placeholder="描述你的愿景与使命..."
              field-name="companyIntro"
              :rows="3"
            />
          </div>

          <PrimaryButton type="submit" :loading="loading">
            创建我的第一家公司 ✦
          </PrimaryButton>
        </div>
      </Form>
    </div>
  </AuroraBackground>
</template>

<style scoped>
.create-company-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.hero {
  text-align: center;
  margin-bottom: 1.4rem;
  position: relative;
  z-index: 1;
}

.title {
  margin: 0;
  /* font-size: clamp(2.05rem, 5vw, 3rem); */
  font-size: 1.85rem;
  letter-spacing: 0.02em;
  font-weight: 700;
  color: #10131b;
}

.title-gradient {
  background: linear-gradient(90deg, #007f9f 0%, #4a43cf 54%, #8133cf 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.subtitle {
  margin: 0.8rem 0 0;
  color: #434955;
  font-size: 0.84rem;
  letter-spacing: 0.04em;
}

.panel {
  min-width: 400px;
  background: rgb(255 255 255 / 0.54);
  border: 1px solid rgb(160 188 220 / 0.34);
  border-radius: 1.3rem;
  box-shadow:
    0 18px 42px rgb(106 117 154 / 0.13),
    0 0 0 1px rgb(255 255 255 / 0.52) inset;
  backdrop-filter: blur(10px);
  padding: 2.15rem 1.9rem 1.7rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  gap: 1rem;
}

.upload-area {
  display: grid;
  justify-items: center;
  gap: 0.62rem;
  margin-bottom: 0.15rem;
}

.upload-btn {
  width: 5.4rem;
  height: 5.4rem;
  border-radius: 999px;
  border: 1px solid rgb(160 194 222 / 0.55);
  background: radial-gradient(
    circle at 30% 22%,
    rgb(255 255 255 / 0.92),
    rgb(247 248 252 / 0.88)
  );
  color: #4e8fa2;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  box-shadow: 0 12px 22px rgb(124 150 182 / 0.12);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgb(124 150 182 / 0.2);
}

.upload-plus {
  width: 1.55rem;
  height: 1.55rem;
  border-radius: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  background: #4d9bad;
}

.upload-text {
  font-size: 0.53rem;
  letter-spacing: 0.12em;
  color: #4d5b66;
}

.hidden-input {
  display: none;
}

.upload-hint {
  margin: 0;
  font-size: 0.66rem;
  color: #8b8f99;
}

.upload-file {
  margin: 0;
  font-size: 0.66rem;
  color: #4e728d;
}

.intro-group {
  display: grid;
  gap: 0.4rem;
}

.intro-input {
  width: 100%;
  min-height: 6.4rem;
  resize: vertical;
  border-radius: 0.72rem;
  border: 1px solid rgb(216 222 233 / 0.82);
  background: rgb(248 250 253 / 0.8);
  padding: 0.85rem 0.95rem;
  font-size: 0.88rem;
  color: #252c38;
  outline: none;
}

.intro-input::placeholder {
  color: #c0c6d1;
}

.intro-error {
  margin: 0;
  font-size: 0.72rem;
  color: #d03d4f;
}

.create-btn {
  margin-top: 0.5rem;
  width: 100%;
  border: none;
  border-radius: 999px;
  padding: 0.88rem 1rem;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #fff;
  background: linear-gradient(90deg, #046d85 0%, #5f3de0 50%, #a92f7d 100%);
  box-shadow: 0 14px 30px rgb(102 69 192 / 0.25);
  cursor: pointer;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.create-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 34px rgb(102 69 192 / 0.33);
}

@media (max-width: 520px) {
  .panel {
    padding: 1.35rem 1.05rem 1.35rem;
    border-radius: 1.05rem;
  }

  .title {
    line-height: 1.15;
  }

  .subtitle {
    font-size: 0.78rem;
  }
}
</style>
