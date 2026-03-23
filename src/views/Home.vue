<template>
  <div class="home-page">
    <div class="home-container">
      <!-- Left Panel: Task List -->
      <div class="left-panel">
        <div class="panel-header">
          <h2>任务队列</h2>
          <p class="header-desc">数字货金：当前正在转化的能量场</p>
        </div>

        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="['tab-button', { active: activeTab === tab }]"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <div class="controls">
          <select class="filter-select">
            <option>筛选</option>
          </select>
          <button class="execute-button">⚡ 执行执行</button>
        </div>

        <div class="task-list">
          <!-- Empty State -->
          <div class="empty-state">
            <div class="empty-icon">⏳</div>
            <p>任务队列空空如也</p>
            <p class="empty-hint">在输入框中输入或在历史中启动新任务</p>
          </div>
        </div>
      </div>

      <!-- Right Panel: Agents -->
      <div class="right-panel">
        <!-- Agent Card -->
        <div class="agent-section">
          <div class="agent-card">
            <div class="agent-icon">🔧</div>
            <h3>智实Agent</h3>
            <p class="agent-desc">点击上方按钮开始创建新一个Agent</p>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-queue">
          <div class="queue-icon">⌛</div>
          <h3>任务队列空空如也</h3>
          <p>在输入框中输入或在历史中启动新任务</p>
          <button class="history-button">📋 查看历史档案</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const activeTab = ref("全部");
const tabs = ["全部", "执行中", "待处理"];
</script>

<style scoped>
.home-page {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.home-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  height: 100%;
}

/* Left Panel */
.left-panel {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  overflow: hidden;
}

.panel-header {
  margin-bottom: 20px;
}

.panel-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}

.header-desc {
  margin: 0;
  font-size: 12px;
  color: #999;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
}

.tab-button {
  padding: 6px 12px;
  border: none;
  background: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab-button.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab-button:hover:not(.active) {
  color: #666;
}

/* Controls */
.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.execute-button {
  padding: 8px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.execute-button:hover {
  background: #5568d3;
  transform: scale(1.02);
}

/* Task List */
.task-list {
  flex: 1;
  overflow: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.empty-hint {
  font-size: 12px;
  color: #ccc;
  margin-top: 4px;
}

/* Right Panel */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Agent Section */
.agent-section {
  display: flex;
  justify-content: center;
}

.agent-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 160px;
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.agent-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.agent-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.agent-card h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.agent-desc {
  margin: 0;
  font-size: 12px;
  color: #999;
}

/* Empty Queue */
.empty-queue {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.queue-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-queue h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.empty-queue p {
  margin: 0 0 16px 0;
  font-size: 12px;
  color: #999;
}

.history-button {
  padding: 8px 16px;
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.history-button:hover {
  background: #f5f7ff;
}

/* Responsive */
@media (max-width: 1024px) {
  .home-container {
    grid-template-columns: 1fr;
  }
}
</style>
