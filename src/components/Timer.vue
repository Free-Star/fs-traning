<script setup lang="ts">
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
import { useTimerStore } from '../stores/timer'
import { useSettingsStore } from '../stores/settings'

const timerStore = useTimerStore()
const settingsStore = useSettingsStore()

// 计时器动画参考元素
const progressCircleRef = ref(null)
let progressAnimation = null

const formattedTime = computed(() => {
  const minutes = Math.floor(timerStore.timeRemaining / 60)
  const seconds = timerStore.timeRemaining % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const statusText = computed(() => {
  switch (timerStore.currentState) {
    case 'exercise':
      return '训练中'
    case 'rest':
      return '休息中'
    case 'completed':
      return '已完成'
    default:
      return '准备开始'
  }
})

const statusColor = computed(() => {
  switch (timerStore.currentState) {
    case 'exercise':
      return 'var(--nutui-brand-color)'
    case 'rest':
      return '#ff9800'
    case 'completed':
      return '#4caf50'
    default:
      return '#999'
  }
})

const progressPercentage = computed(() => {
  return timerStore.progress * 100
})

// 监听状态变化，播放相应的声音和震动
watch(() => timerStore.currentState, (newState, oldState) => {
  if (oldState === 'exercise' && newState === 'rest') {
    // 训练结束，休息开始
    settingsStore.playSound('exercise-end')
    settingsStore.vibrate(200)
  } else if (oldState === 'rest' && newState === 'exercise') {
    // 休息结束，开始下一组训练
    settingsStore.playSound('rest-end')
    settingsStore.vibrate([100, 50, 100])
  } else if (newState === 'exercise' && oldState !== 'exercise') {
    // 训练开始
    settingsStore.playSound('exercise-start')
    settingsStore.vibrate(100)
  } else if (newState === 'completed') {
    // 整个训练完成
    settingsStore.playSound('exercise-end')
    settingsStore.vibrate([200, 100, 200, 100, 200])
  }
})

// 时间结束前3秒提醒
watch(() => timerStore.timeRemaining, (newTime) => {
  if (timerStore.isRunning && [3, 2, 1].includes(newTime)) {
    settingsStore.vibrate(100)
  }
})

// 清理操作
onUnmounted(() => {
  if (progressAnimation) {
    progressAnimation.cancel()
  }
})
</script>

<template>
  <div class="timer-container">
    <!-- 训练动作信息 -->
    <nut-cell-group v-if="timerStore.currentExercise">
      <nut-cell :title="timerStore.currentExercise.name" :desc="statusText + ' - 第 ' + (timerStore.currentSetIndex + 1) + ' / ' + timerStore.totalSets + ' 组'" />
    </nut-cell-group>
    
    <!-- 圆形进度条和计时器 -->
    <div class="progress-circle-container">
      <div class="progress-circle" ref="progressCircleRef" :style="{ borderColor: statusColor }">
        <div class="time-display">{{ formattedTime }}</div>
        <div class="status-text" :style="{ color: statusColor }">{{ statusText }}</div>
      </div>
      <nut-progress 
        :percentage="progressPercentage" 
        :status="timerStore.currentState === 'exercise' ? 'active' : timerStore.currentState === 'rest' ? 'warning' : 'success'"
        stroke-width="15"
        class="progress-bar"
      />
    </div>
    
    <!-- 控制按钮 -->
    <div class="control-buttons">
      <nut-button 
        :type="timerStore.isRunning ? 'warning' : 'primary'" 
        size="large"
        class="control-button" 
        @click="timerStore.togglePause"
      >
        {{ timerStore.isRunning ? '暂停' : '继续' }}
      </nut-button>
      
      <nut-button 
        type="info" 
        size="large"
        class="control-button" 
        @click="timerStore.skip"
      >
        跳过
      </nut-button>
      
      <nut-button 
        type="danger" 
        size="large"
        class="control-button" 
        @click="timerStore.reset"
      >
        重置
      </nut-button>
    </div>

    <!-- 训练信息卡片 -->
    <div class="info-card" v-if="timerStore.currentWorkout">
      <h3>{{ timerStore.currentWorkout.name }}</h3>
      <div class="workout-info">
        <div class="info-item">
          <div class="info-value">{{ timerStore.currentExerciseIndex + 1 }}</div>
          <div class="info-label">当前动作</div>
        </div>
        <div class="info-item">
          <div class="info-value">{{ timerStore.currentWorkout.exercises.length }}</div>
          <div class="info-label">总动作数</div>
        </div>
        <div class="info-item">
          <div class="info-value">{{ Math.floor(timerStore.totalWorkoutTime / 60) }}</div>
          <div class="info-label">已训练(分)</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timer-container {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  max-width: 100%;
  margin: 0 auto;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.progress-circle-container {
  margin: 30px auto;
  position: relative;
  width: 240px;
  height: 240px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-circle {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  border: 8px solid var(--nutui-brand-color);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s ease;
}

.time-display {
  font-size: 3.5rem;
  font-weight: bold;
  color: #333;
}

.status-text {
  font-size: 1.2rem;
  margin-top: 10px;
  font-weight: 500;
}

.progress-bar {
  margin: 20px 0;
  width: 100%;
}

.control-buttons {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
}

.control-button {
  flex: 1;
  border-radius: 8px;
}

.info-card {
  margin-top: 30px;
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-card h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #333;
  text-align: center;
}

.workout-info {
  display: flex;
  justify-content: space-between;
}

.info-item {
  text-align: center;
  flex: 1;
}

.info-value {
  font-size: 22px;
  font-weight: bold;
  color: var(--nutui-brand-color);
}

.info-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

/* 自定义进度条样式 */
:deep(.nut-progress-outer) {
  background-color: rgba(0, 0, 0, 0.05);
}

:deep(.nut-progress-active .nut-progress-inner) {
  background: var(--nutui-brand-color);
}

:deep(.nut-progress-warning .nut-progress-inner) {
  background: #ff9800;
}
</style> 