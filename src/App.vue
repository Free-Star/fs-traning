<script setup lang="ts">
import { ref, computed, provide, reactive } from 'vue';
import { useWorkoutStore } from './stores/workout';
import { useTimerStore } from './stores/timer';
import { useSettingsStore } from './stores/settings';
import { showToast } from '@nutui/nutui';
import './style.css'
import '@nutui/nutui/dist/style.css'

// 导入组件
import Timer from './components/Timer.vue';
import WorkoutPlanForm from './components/WorkoutPlanForm.vue';
import CyclePlanForm from './components/CyclePlanForm.vue';
import WorkoutStats from './components/WorkoutStats.vue';
import WorkoutTrends from './components/WorkoutTrends.vue';
import Settings from './components/Settings.vue';
import DataBackup from './components/DataBackup.vue';

// 视图类型定义
type View = 'home' | 'timer' | 'addWorkout' | 'addCycle' | 'stats' | 'trends' | 'settings' | 'backup';

// 状态管理
const workoutStore = useWorkoutStore();
const timerStore = useTimerStore();
const settingsStore = useSettingsStore();
const currentView = ref<View>('home');
const editingWorkout = ref<string | null>(null);
const showDeleteConfirm = ref(false);
const workoutToDelete = ref<string | null>(null);
const slideIndex = ref<number | null>(null);

// 左滑相关的触摸处理
let startX = 0;
let startY = 0;
const MIN_DISTANCE = 50;

function handleTouchStart(e: TouchEvent, index: number) {
  if (slideIndex.value !== null && slideIndex.value !== index) {
    slideIndex.value = null;
  }
  
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
}

function handleTouchMove(e: TouchEvent, index: number) {
  const currentX = e.touches[0].clientX;
  const currentY = e.touches[0].clientY;
  
  // 计算X和Y方向的移动距离
  const deltaX = startX - currentX;
  const deltaY = startY - currentY;
  
  // 如果Y方向移动较大，认为是上下滑动，不做处理
  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    return;
  }
  
  // 阻止默认行为，防止页面滚动
  e.preventDefault();
  
  if (deltaX > MIN_DISTANCE) {
    slideIndex.value = index;
  } else if (deltaX < -MIN_DISTANCE && slideIndex.value === index) {
    slideIndex.value = null;
  }
}

function resetSlideIndex() {
  slideIndex.value = null;
}

// 主题配置
const theme = reactive({
  primaryColor: 'var(--nutui-brand-color)',
  activeColor: 'var(--nutui-brand-color)'
});

// 提供给子组件的主题
provide('theme', theme);

// 导航函数
function navigateTo(view: View) {
  currentView.value = view;
}

function startWorkout(id: string) {
  try {
    const plan = workoutStore.workoutPlans.find(p => p.id === id);
    if (plan) {
      console.log('找到训练计划:', plan.name);
      timerStore.initWorkout(plan);
      console.log('导航到计时页面');
      navigateTo('timer');
    } else {
      console.error('未找到训练计划，ID:', id);
    }
  } catch (error) {
    console.error('启动训练计划时出错:', error);
  }
}

function editWorkout(id: string) {
  editingWorkout.value = id;
  navigateTo('addWorkout');
}

function addWorkout() {
  editingWorkout.value = null;
  navigateTo('addWorkout');
}

function confirmDeleteWorkout(id: string) {
  workoutToDelete.value = id;
  showDeleteConfirm.value = true;
}

function deleteWorkout() {
  if (workoutToDelete.value) {
    workoutStore.deleteWorkoutPlan(workoutToDelete.value);
    showToast.success('删除成功');
  }
  showDeleteConfirm.value = false;
  workoutToDelete.value = null;
}

function cancelDelete() {
  showDeleteConfirm.value = false;
  workoutToDelete.value = null;
}

// 计算属性
const isHomePage = computed(() => currentView.value === 'home');
const isNotHomePage = computed(() => currentView.value !== 'home');

// 标题文本
const pageTitle = computed(() => {
  switch (currentView.value) {
    case 'timer': return '训练计时';
    case 'addWorkout': return editingWorkout.value ? '编辑训练计划' : '新建训练计划';
    case 'addCycle': return '新建循环';
    case 'stats': return '训练统计';
    case 'trends': return '训练趋势分析';
    case 'settings': return '设置';
    case 'backup': return '数据备份';
    default: return '';
  }
});


</script>

<template>
  <div class="app-container" :class="{ 'dark': settingsStore.isDarkMode }">
    <!-- 顶部导航栏 - 除首页外显示 -->
    <nut-navbar v-if="isNotHomePage" :title="pageTitle" left-show @on-click-back="navigateTo('home')" />

    <!-- 内容区域 -->
    <div class="content" :class="{ 'has-navbar': isNotHomePage, 'home-page': isHomePage }">
      <!-- 首页内容 -->
      <div v-if="isHomePage" class="home-content">
        <header class="app-header">
          <h1 class="app-title">😡监管者</h1>
          <p class="app-subtitle">定制化训练计划，追踪训练进度</p>
        </header>
        
        <div class="section-card workout-list">
          <nut-cell-group title="我的训练计划">
            <template v-if="workoutStore.workoutPlans.length">
              <div 
                v-for="(workout, index) in workoutStore.workoutPlans" 
                :key="workout.id"
                class="swipe-cell-container"
                @touchstart="handleTouchStart($event, index)"
                @touchmove="handleTouchMove($event, index)"
              >
                <div 
                  class="swipe-cell"
                  :class="{ 'active': slideIndex === index }"
                >
                  <nut-cell 
                    :title="workout.name" 
                    :desc="workout.type + ' - ' + workout.exercises.length + '个动作'"
                    is-link 
                    @click="startWorkout(workout.id)"
                  ></nut-cell>
                  <div class="swipe-actions">
                    <nut-button shape="square" type="default" @click.stop="editWorkout(workout.id); resetSlideIndex()">
                      <Icon icon="mdi:pencil"  />
                    </nut-button>
                    <nut-button shape="square" type="danger" @click.stop="confirmDeleteWorkout(workout.id); resetSlideIndex()">
                      <Icon icon="mdi:delete"  />
                    </nut-button>
                  </div>
                </div>
              </div>
            </template>
            <nut-empty v-else description="尚无训练计划，请添加" />
          </nut-cell-group>
        </div>

        <div class="section-card stats-summary">
          <nut-cell-group title="训练数据">
            <nut-cell title="总训练次数">
              <template #desc>{{ workoutStore.workoutRecords.length }}</template>
            </nut-cell>
            <nut-cell title="今日训练计划">
              <template #desc>
                <template v-if="workoutStore.getTodayWorkoutPlan">
                  <span>{{ workoutStore.getTodayWorkoutPlan.name }}</span>
                  <nut-button size="small" type="primary" style="margin-left: 8px" @click.stop="startWorkout(workoutStore.getTodayWorkoutPlan.id)">
                    <Icon icon="mdi:play-circle" />
                  </nut-button>
                </template>
                <span v-else>暂无</span>
              </template>
            </nut-cell>
          </nut-cell-group>
        </div>
      </div>

      <!-- 计时器页面 -->
      <div v-else-if="currentView === 'timer'" class="timer-view">
        <Timer />
      </div>

      <!-- 添加训练计划页面 -->
      <div v-else-if="currentView === 'addWorkout'" class="add-workout-view">
        <WorkoutPlanForm 
          :edit-mode="editingWorkout !== null"
          :plan-id="editingWorkout || undefined"
          @saved="navigateTo('home')"
          @canceled="navigateTo('home')"
        />
      </div>

      <!-- 添加循环页面 -->
      <div v-else-if="currentView === 'addCycle'" class="add-cycle-view">
        <CyclePlanForm
          @saved="navigateTo('home')"
          @canceled="navigateTo('home')"
        />
      </div>

      <!-- 统计页面 -->
      <div v-else-if="currentView === 'stats'" class="stats-view">
        <WorkoutStats />
      </div>

      <!-- 训练趋势分析 -->
      <WorkoutTrends v-if="currentView === 'trends'" />

      <!-- 设置页面 -->
      <Settings v-if="currentView === 'settings'" />

      <!-- 数据备份页面 -->
      <DataBackup v-if="currentView === 'backup'" />
    </div>

    <!-- 浮动添加按钮 - 仅在首页显示 -->
    <nut-button v-if="isHomePage" type="primary" class="add-button" size="large" @click="addWorkout">
      <Icon icon="mdi:plus" style="font-size: 32px; display: flex; align-items: center; justify-content: center;" />
    </nut-button>

    <!-- 底部标签栏 -->
    <nut-tabbar v-model="currentView" unactive-color="#7d7e80" active-color="var(--nutui-brand-color)" class="fixed-tabbar">
      <nut-tabbar-item name="home">
        <template #icon>
          <Icon icon="mdi:home" />
        </template>
        主页
      </nut-tabbar-item>
      <nut-tabbar-item name="stats">
        <template #icon>
          <Icon icon="mdi:chart-line" />
        </template>
        统计
      </nut-tabbar-item>
      <nut-tabbar-item name="trends">
        <template #icon>
          <Icon icon="mdi:chart-bar" />
        </template>
        趋势
      </nut-tabbar-item>
      <nut-tabbar-item name="settings">
        <template #icon>
          <Icon icon="mdi:cog" />
        </template>
        设置
      </nut-tabbar-item>
      <nut-tabbar-item name="backup">
        <template #icon>
          <Icon icon="mdi:download" />
        </template>
        备份
      </nut-tabbar-item>
    </nut-tabbar>

    <!-- 删除确认对话框 -->
    <nut-dialog title="确认删除" v-model:visible="showDeleteConfirm" @confirm="deleteWorkout" @cancel="cancelDelete">
      <p>确定要删除这个训练计划吗？此操作不可恢复。</p>
    </nut-dialog>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--nutui-gray-1);
}

.content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  padding-bottom: 60px; /* 为底部菜单留出空间 */
}

.content.has-navbar {
  padding-top: 56px;
}

.fixed-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.app-header {
  text-align: center;
  margin-bottom: 20px;
  padding: 20px 0;
  background: linear-gradient(135deg, var(--nutui-brand-color), var(--nutui-brand-color-light));
  color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.app-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 6px;
}

.app-subtitle {
  font-size: 14px;
  opacity: 0.8;
}

.workout-actions {
  display: flex;
  gap: 5px;
}

.section-card {
  margin-bottom: 16px;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.add-button {
  position: fixed;
  right: 16px;
  bottom: 80px;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.add-icon {
  font-size: 24px;
  font-weight: bold;
}

/* 暗黑模式样式 */
.dark {
  --nutui-gray-0: #121212;
  --nutui-gray-1: #1e1e1e;
  --nutui-gray-2: #282828;
  --nutui-gray-3: #333;
  --nutui-gray-4: #444;
  --nutui-gray-5: #565656;
  --nutui-gray-6: #666;
  --nutui-gray-7: #767676;
  --nutui-gray-8: #9e9e9e;
  --nutui-gray-9: #ddd;
  --nutui-gray-10: #fff;
  
  color-scheme: dark;
}

.dark .app-header {
  background: linear-gradient(135deg, var(--nutui-brand-color-dark, var(--nutui-brand-color)), #333);
}

.dark .section-card,
.dark .add-button {
  background-color: var(--nutui-gray-2);
  color: var(--nutui-gray-9);
}

.timer-view, .add-workout-view, .add-cycle-view, .stats-view {
  max-width: 100%;
  margin: 0 auto;
}

.swipe-cell-container {
  position: relative;
  overflow: hidden;
}

.swipe-cell {
  position: relative;
  transition: transform 0.3s ease;
  width: 100%;
}

.swipe-cell.active {
  transform: translateX(-120px);
}

.swipe-actions {
  position: absolute;
  right: -120px;
  top: 0;
  height: 100%;
  display: flex;
  width: 120px;
}

.swipe-actions .nut-button {
  height: 100%;
  width: 60px;
  border-radius: 0;
}
</style>