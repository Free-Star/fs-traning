<script setup lang="ts">
import { computed, watch, ref, onUnmounted } from 'vue'
import { useTimerStore } from '../stores/timer'
import { useSettingsStore } from '../stores/settings'

const timerStore = useTimerStore()
const settingsStore = useSettingsStore()

// 计时器动画参考元素
const progressCircleRef = ref(null)
let progressAnimation: any = null

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
    settingsStore.playSound('exercise-end' as any)
    settingsStore.vibrate(200)
  } else if (oldState === 'rest' && newState === 'exercise') {
    // 休息结束，开始下一组训练
    settingsStore.playSound('rest-end' as any)
    settingsStore.vibrate([100, 50, 100])
  } else if (newState === 'exercise' && oldState !== 'exercise') {
    // 训练开始
    settingsStore.playSound('exercise-start' as any)
    settingsStore.vibrate(100)
  } else if (newState === 'completed') {
    // 整个训练完成
    settingsStore.playSound('exercise-end' as any)
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
    progressAnimation?.cancel?.()
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
        <svg class="progress-svg" viewBox="0 0 100 100">
          <circle
            class="progress-track"
            cx="50"
            cy="50"
            r="46"
            fill="transparent"
            stroke="#e0e0e0"
            stroke-width="8"
          />
          <circle
            class="progress-indicator"
            cx="50"
            cy="50"
            r="46"
            fill="transparent"
            :stroke="statusColor"
            stroke-width="8"
            stroke-dasharray="289.02652413026095"
            :stroke-dashoffset="289.02652413026095 * (progressPercentage / 100)"
            transform="rotate(-90, 50, 50)"
          />
        </svg>
        <div class="time-display">{{ formattedTime }}</div>
        <div class="status-text" :style="{ color: statusColor }">{{ statusText }}</div>
      </div>
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
    
    <!-- 训练进度显示在最下方 -->
    <div class="exercise-progress" v-if="timerStore.currentWorkout">
      <div class="progress-title">训练进度</div>
      <div class="exercise-list">
        <div 
          v-for="(exercise, exIndex) in timerStore.currentWorkout.exercises" 
          :key="exercise.id"
          class="exercise-row"
        >
          <div class="exercise-name" :class="{'current-exercise': exIndex === timerStore.currentExerciseIndex}">
            {{ exIndex + 1 }}. {{ exercise.name }}
          </div>
          <div class="set-indicators">
            <div 
              v-for="setIndex in exercise.sets" 
              :key="setIndex"
              class="set-indicator"
              :class="{
                'completed': exIndex < timerStore.currentExerciseIndex || 
                            (exIndex === timerStore.currentExerciseIndex && setIndex - 1 < timerStore.currentSetIndex),
                'current': exIndex === timerStore.currentExerciseIndex && setIndex - 1 === timerStore.currentSetIndex,
                'upcoming': exIndex > timerStore.currentExerciseIndex || 
                           (exIndex === timerStore.currentExerciseIndex && setIndex - 1 > timerStore.currentSetIndex)
              }"
            ></div>
          </div>
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
  overflow-y: auto;
}

.progress-circle-container {
  margin: 20px auto;
  position: relative;
  width: 220px;
  height: 220px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s ease;
  aspect-ratio: 1 / 1;
  position: relative;
}

.progress-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-track {
  stroke-linecap: round;
}

.progress-indicator {
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
}

.time-display {
  font-size: 3.2rem;
  font-weight: bold;
  color: #333;
  z-index: 1;
}

.status-text {
  font-size: 1.2rem;
  margin-top: 10px;
  font-weight: 500;
  z-index: 1;
}

.control-buttons {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.control-button {
  flex: 1;
  border-radius: 8px;
}

.info-card {
  margin-top: 16px;
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

/* 训练进度样式 */
.exercise-progress {
  margin-top: 10%;
  margin-bottom: 0;
  padding: 10px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.progress-title {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 10px;
  text-align: center;
}

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exercise-row {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.exercise-name {
  flex: 1;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 10px;
  color: #666;
}

.current-exercise {
  color: var(--nutui-brand-color);
  font-weight: 500;
}

.set-indicators {
  display: flex;
  gap: 4px;
}

.set-indicator {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.set-indicator.upcoming {
  background-color: #e0e0e0;
}

.set-indicator.current {
  background-color: var(--nutui-brand-color);
  transform: scale(1.05);
}

.set-indicator.completed {
  background-color: #4caf50;
}
</style> 