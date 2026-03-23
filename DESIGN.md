```markdown
# 视觉设计系统指南：Digital Alchemy (数字炼金：晶透之光)

## 1. 创意北极星 (Creative North Star)："以光赋形" (Form Defined by Light)
本设计系统的核心哲学是**数字炼金术**。我们将界面视为一种透明的、具有折射率的介质，而非平面的像素集合。通过模拟晶体、光线折射和高透明度玻璃的物理特性，打破传统 UI 的沉闷感。

*   **设计原则：** 拒绝生硬的线条，利用光影深度 (Tonal Depth) 代替容器边界。
*   **视觉特征：** 意向性的不对称布局、层叠的毛玻璃感 (Glassmorphism)、以及如同棱镜折射般的彩虹边缘。
*   **核心目标：** 创造一种既专业可靠，又带有某种“数字魔法”般空灵感的轻盈体验。

---

## 2. 色彩系统 (Color Systems)

本系统严禁使用纯黑或高对比度的粗糙分割线。色彩的应用应像光束穿透晶体一样自然。

### 核心调色盘 (Material Design Tokens)
*   **Primary (主色):** `#006877` (深海青) - 用于关键交互，确保在亮色背景下的可读性。
*   **Secondary (辅助色):** `#7825ea` (灵动紫) - 呼应“炼金术”的神秘感，用于点睛之笔。
*   **Tertiary (三级色):** `#a43073` (晶粉) - 用于情感化的提示或次要行动点。
*   **Background (背景):** `#f7f9fb` (极净白) - 整体基调，模拟纯净的实验室或画廊空间。

### “无边框”规则 (The No-Line Rule)
**禁止使用 1px 的实线进行区域划分。** 边界必须通过以下方式定义：
1.  **色彩位移：** 使用 `surface_container_low` (#f2f4f6) 容器承载在 `surface` 背景上。
2.  **软阴影投影：** 利用 4%-8% 透明度的 `on_surface` 阴影。
3.  **光晕边界：** 使用 cyan (#22d3ee) 与 soft purple (#8A3FFC) 的 15% 透明度渐变作为区域阴影。

### 玻璃与梯度 (Glass & Gradient)
*   **悬浮元素：** 必须使用 `surface_container_lowest` (#ffffff) 配合 80% 的不透明度，并应用 `backdrop-filter: blur(20px)`。
*   **彩虹边框 (The Rainbow Edge)：** 仅在关键卡片或按钮上，使用 1px 的超淡渐变（由 Cyan 到 Purple，透明度 20%），模拟光线在晶体边缘的折射。

---

## 3. 字体排印 (Typography)

我们选用 **Plus Jakarta Sans**，其现代且略带几何感的形态非常符合“数字炼金”的精确性。

*   **色彩：** 统一使用 `on_surface` (#191c1e)，这是一种深石板蓝，能提供比纯黑更高级的对比。
*   **层级逻辑：**
    *   **Display (大标题):** `display-lg` (3.5rem) 用于英雄场景，采用极细的字重配合宽大的字间距。
    *   **Headline (标题):** `headline-md` (1.75rem) 强调板块核心。
    *   **Body (正文):** `body-md` (0.875rem) 用于信息传达，行高需保持在 1.6 倍以增加呼吸感。
    *   **Label (标签):** `label-sm` (0.6875rem) 必须全大写或配合微小的间距调整，增加仪式感。

---

## 4. 深度与高度 (Elevation & Depth)

放弃传统的阴影，转而采用**色调叠层 (Tonal Layering)**。

*   **层叠原则 (The Layering Principle)：**
    *   底层 (Base): `surface`
    *   中间层 (Section): `surface_container_low`
    *   顶层 (Interactive Cards): `surface_container_lowest` (白色) + 极淡的扩散阴影。
*   **环境阴影 (Ambient Shadows)：** 阴影应带有一丝 `primary` (#006877) 的底色，而非中性灰。模糊值建议设置在 30px - 60px 之间，创造一种由于“浮空”而产生的自然软投影。
*   **虚化边框 (Ghost Border)：** 若出于无障碍需求必须使用边框，请使用 `outline_variant` 且不透明度降至 15%。

---

## 5. 组件设计规范 (Components)

### 按钮 (Buttons)
*   **主按钮 (Primary):** 使用从 `primary` 到 `secondary` 的微弱线性渐变。圆角固定为 `full` (9999px)。
*   **晶透按钮 (Ghost/Glass):** 无填充色，背景应用毛玻璃效果，边缘带有 10% 不透明度的“彩虹边框”。

### 卡片与列表 (Cards & Lists)
*   **禁止使用分割线。** 利用 `3.5rem` (spacing-10) 的纵向留白来区分内容块。
*   **交互态：** 当鼠标悬停在卡片上时，背景应从 `surface_container` 缓慢过渡到 `primary_container` (#a2eeff)，并伴随轻微的 Y 轴位移。

### 输入字段 (Input Fields)
*   **状态：** 默认状态下仅显示极细的底部浅色边界。
*   **激活态 (Focus)：** 整个输入框呈现微弱的 cyan 光晕，利用阴影扩散而非加粗边框来提醒用户。

### 芯片 (Chips)
*   采用 `surface_container_high` 作为背景，配合 `on_surface_variant` 的文字。选中时切换为 `secondary_fixed` (#ebdcff) 颜色。

---

## 6. 做与不做 (Do's and Don'ts)

### ✅ 正确做法 (Do)
*   **保持呼吸感：** 在板块之间预留至少 `5.5rem` (spacing-16) 的间距。
*   **利用光晕：** 在页面的角落放置模糊度极高（200px+）的 Cyan 和 Purple 圆形背景，模拟以光为背景的效果。
*   **意向性布局：** 允许图片或文字块稍微偏离轴线，创造动态的美感。

### ❌ 错误做法 (Don'ts)
*   **严禁使用纯黑色文本：** 这会破坏“晶透”的轻盈感。
*   **严禁使用锐利的直角：** 除非是特殊排版，否则请遵循 `md` (0.75rem) 或以上的圆角设定。
*   **拒绝过度装饰：** 虽然强调“魔法感”，但组件的核心功能必须保持清晰，不能让毛玻璃效果遮盖了文字的可读性。

---

## 7. 描述与标签 (Localization)

在应用此系统时，所有系统反馈和界面标签应遵循以下语调：
*   **成功：** “炼金完成” (Synthesis Complete)
*   **加载：** “晶体凝聚中...” (Crystallizing...)
*   **错误：** “波长偏移” (Wavelength Offset)
*   **确定：** “确认” (Confirm)
*   **取消：** “舍弃” (Discard)

通过这些富有诗意的中文词汇，进一步强化“数字炼金”的设计主题。```