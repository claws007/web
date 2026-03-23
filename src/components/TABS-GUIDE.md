# Tabs 组件文档

## 概述

`Tabs` 是一个灵活的标签页组件，支持多种样式和交互方式。遵循 Digital Alchemy 设计系统的视觉规范。

## 基本使用

### 默认样式 (Default)

```vue
<script setup>
import { ref } from 'vue'
import Tabs from '@/components/Tabs.vue'

const activeTab = ref('overview')

const tabs = [
  { id: 'overview', label: '概览' },
  { id: 'data', label: '数据焦金' },
  { id: 'analytics', label: '智能分析' }
]
</script>

<template>
  <Tabs 
    :items="tabs" 
    v-model="activeTab"
    @change="console.log('Tab changed to:', $event)"
  />
</template>
```

### 图标样式 (Icon)

```vue
<template>
  <Tabs 
    :items="tabsWithIcons"
    v-model="activeTab"
    variant="icon"
  />
</template>

<script setup>
const tabsWithIcons = [
  { id: 'overview', label: '概览', icon: '📊' },
  { id: 'data', label: '数据焦金', icon: '💎' },
  { id: 'analytics', label: '智能分析', icon: '✨' }
]
</script>
```

## 属性 (Props)

| 属性 | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| `items` | `TabItem[]` | 必需 | 标签页数据数组 |
| `modelValue` | `string` | - | 当前活跃标签的 ID (v-model) |
| `variant` | `'default' \| 'icon'` | `'default'` | 标签页样式变体 |

### TabItem 接口

```typescript
interface TabItem {
  id: string;           // 唯一标识符
  label: string;        // 标签显示文本
  icon?: string;        // 可选的图标 (Unicode 或 Emoji)
  disabled?: boolean;   // 是否禁用该标签
}
```

## 事件 (Events)

| 事件 | 参数 | 说明 |
|-----|------|------|
| `update:modelValue` | `value: string` | v-model 更新事件 |
| `change` | `value: string` | 标签页改变时触发 |

## 样式特性

✅ **设计系统对齐**

- 遵循 Digital Alchemy 色彩系统
- 使用主色 (#006877) 和辅助色 (#7825ea)
- 毛玻璃效果和光晕边界

✅ **交互反馈**

- 悬停时背景色过渡到主色浅色版本
- 活跃标签显示底部强调线
- 禁用状态降低透明度

✅ **可访问性**

- 支持键盘导航
- 禁用的标签无法交互
- 清晰的焦点状态

## 完整示例

```vue
<script setup>
import { ref } from 'vue'
import Tabs from '@/components/Tabs.vue'

const activeTab = ref('tab1')

const tabs = [
  { 
    id: 'tab1', 
    label: '已激活状态' 
  },
  { 
    id: 'tab2', 
    label: '悬浮状态' 
  },
  { 
    id: 'tab3', 
    label: '默认状态' 
  },
  { 
    id: 'tab4', 
    label: '禁用状态',
    disabled: true 
  }
]

const tabsWithIcons = [
  { id: 'overview', label: '概览', icon: '📊' },
  { id: 'data', label: '数据焦金', icon: '💎' },
  { id: 'automation', label: '自动化流', icon: '⚙️' }
]
</script>

<template>
  <div style="padding: 2rem;">
    <h2>标准标签页</h2>
    <Tabs 
      :items="tabs" 
      v-model="activeTab"
      @change="activeTab = $event"
    />
    <p>当前选中: {{ activeTab }}</p>

    <h2 style="margin-top: 3rem;">图标标签页</h2>
    <Tabs 
      :items="tabsWithIcons" 
      v-model="activeTab"
      variant="icon"
    />
  </div>
</template>
```

## CSS 主题变量

组件使用以下 CSS 变量（可在 `styles/theme.css` 中自定义）:

```css
--primary: #006877;                      /* 主色 */
--primary-soft: #a2eeff;                 /* 主色浅版 */
--surface-container-lowest: rgb(255 255 255 / 0.8);  /* 最浅容器 */
--foreground: #191c1e;                   /* 文字前景色 */
--foreground-muted: #5a666d;             /* 文字次色 */
--outline-ghost: rgb(102 115 124 / 0.15); /* 虚化边框 */
--radius-md: 0.75rem;                    /* 圆角中 */
--font-sans: "Plus Jakarta Sans Variable", "Segoe UI", sans-serif;
```

## 自动注册

该组件已配置在 `unplugin-vue-components` 中自动注册，无需手动导入即可在任何 Vue 模板中使用。

## 最佳实践

1. **使用语义化的 ID**: 使用有意义的标签页 ID，便于追踪和维护
2. **合理的标签数量**: 建议 3-6 个标签，避免过多导致布局混乱
3. **带图标使用图标变体**: 当有图标时，使用 `variant="icon"` 获得更好的视觉效果
4. **谨慎使用禁用状态**: 只在必要时禁用标签，并提供相应的提示
