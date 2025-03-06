<script setup lang="ts">
import { ref, computed, provide, reactive } from 'vue';
import { useWorkoutStore } from './stores/workout';
import { useTimerStore } from './stores/timer';
import { useSettingsStore } from './stores/settings';
import { showDialog, showToast } from '@nutui/nutui';

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

function addCycle() {
  navigateTo('addCycle');
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
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
});
const isDarkMode = computed(() => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
});

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

// 当前选中的标签
const activeTab = computed(() => {
  switch (currentView.value) {
    case 'home': return 'home';
    case 'stats': return 'stats';
    case 'trends': return 'trends';
    case 'settings': return 'settings';
    case 'backup': return 'backup';
    default: return '';
  }
});

// 加载初始示例数据
function loadExampleData() {
  if (workoutStore.workoutPlans.length === 0) {
    const pushPlan = workoutStore.addWorkoutPlan({
      name: '推胸日训练计划',
      type: '推',
      exercises: [
        {
          id: '1',
          name: '卧推',
          sets: 4,
          timePerSet: 40,
          restBetweenSets: 60
        },
        {
          id: '2',
          name: '上斜哑铃卧推',
          sets: 3,
          timePerSet: 40,
          restBetweenSets: 60
        },
        {
          id: '3',
          name: '蝴蝶机夹胸',
          sets: 3,
          timePerSet: 40,
          restBetweenSets: 60
        }
      ]
    });
    
    const pullPlan = workoutStore.addWorkoutPlan({
      name: '拉背日训练计划',
      type: '拉',
      exercises: [
        {
          id: '4',
          name: '引体向上',
          sets: 4,
          timePerSet: 30,
          restBetweenSets: 60
        },
        {
          id: '5',
          name: '坐姿划船',
          sets: 3,
          timePerSet: 40,
          restBetweenSets: 60
        },
        {
          id: '6',
          name: '器械下拉',
          sets: 3,
          timePerSet: 40,
          restBetweenSets: 60
        }
      ]
    });
    
    const legPlan = workoutStore.addWorkoutPlan({
      name: '腿部训练计划',
      type: '腿',
      exercises: [
        {
          id: '7',
          name: '深蹲',
          sets: 4,
          timePerSet: 40,
          restBetweenSets: 90
        },
        {
          id: '8',
          name: '腿举',
          sets: 3,
          timePerSet: 40,
          restBetweenSets: 90
        },
        {
          id: '9',
          name: '小腿提踵',
          sets: 3,
          timePerSet: 40,
          restBetweenSets: 60
        }
      ]
    });
  }
}

// 初始化加载示例数据
loadExampleData();
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
          <h1 class="app-title">健身计时器</h1>
          <p class="app-subtitle">定制化训练计划，追踪训练进度</p>
        </header>
        
        <div class="section-card workout-list">
          <nut-cell-group title="我的训练计划">
            <template v-if="workoutStore.workoutPlans.length">
              <nut-cell 
                v-for="workout in workoutStore.workoutPlans" 
                :key="workout.id"
                :title="workout.name" 
                :desc="workout.type + ' - ' + workout.exercises.length + '个动作'"
                is-link 
              >
                <template #link>
                  <div class="workout-actions">
                    <nut-button size="small" type="primary" @click.stop="startWorkout(workout.id)">开始</nut-button>
                    <nut-button size="small" type="default" @click.stop="editWorkout(workout.id)">编辑</nut-button>
                    <nut-button size="small" type="danger" @click.stop="confirmDeleteWorkout(workout.id)">删除</nut-button>
                  </div>
                </template>
              </nut-cell>
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
                  <nut-button size="small" type="primary" style="margin-left: 8px" @click.stop="startWorkout(workoutStore.getTodayWorkoutPlan.id)">开始</nut-button>
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
          :plan-id="editingWorkout"
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
      <span class="add-icon">+</span>
    </nut-button>

    <!-- 底部标签栏 -->
    <nut-tabbar v-model="currentView" unactive-color="#7d7e80" active-color="var(--nutui-brand-color)" class="fixed-tabbar">
      <nut-tabbar-item name="home">
        主页
      </nut-tabbar-item>
      <nut-tabbar-item name="stats">
        统计
      </nut-tabbar-item>
      <nut-tabbar-item name="trends">
        趋势
      </nut-tabbar-item>
      <nut-tabbar-item name="settings">
        设置
      </nut-tabbar-item>
      <nut-tabbar-item name="backup">
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
</style>