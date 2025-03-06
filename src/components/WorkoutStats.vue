<script setup lang="ts">
import { computed } from 'vue'
import { useWorkoutStore } from '../stores/workout'

const workoutStore = useWorkoutStore()

// 计算当前周范围（从周日到周六）
const currentWeekRange = computed(() => {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 是周日，6 是周六
  
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek) // 回到本周的周日
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // 前进到周六
  endOfWeek.setHours(23, 59, 59, 999)
  
  return { startOfWeek, endOfWeek }
})

// 计算当前月范围
const currentMonthRange = computed(() => {
  const now = new Date()
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  endOfMonth.setHours(23, 59, 59, 999)
  
  return { startOfMonth, endOfMonth }
})

// 本周的训练记录
const thisWeekRecords = computed(() => {
  return workoutStore.workoutRecords.filter(record => {
    const recordDate = new Date(record.date)
    return recordDate >= currentWeekRange.value.startOfWeek && 
           recordDate <= currentWeekRange.value.endOfWeek
  })
})

// 本月的训练记录
const thisMonthRecords = computed(() => {
  return workoutStore.workoutRecords.filter(record => {
    const recordDate = new Date(record.date)
    return recordDate >= currentMonthRange.value.startOfMonth && 
           recordDate <= currentMonthRange.value.endOfMonth
  })
})

// 本周训练次数
const weeklyWorkoutCount = computed(() => thisWeekRecords.value.length)

// 本月训练次数
const monthlyWorkoutCount = computed(() => thisMonthRecords.value.length)

// 过去30天的训练记录
const last30DaysRecords = computed(() => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)
  
  return workoutStore.workoutRecords.filter(record => {
    const recordDate = new Date(record.date)
    return recordDate >= thirtyDaysAgo
  })
})

// 获取过去30天内训练的日期
const trainingDaysInLast30Days = computed(() => {
  const recordDates = last30DaysRecords.value.map(record => {
    const date = new Date(record.date)
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  })
  
  // 返回唯一的日期
  return [...new Set(recordDates)]
})

// 训练坚持率（过去30天有多少天训练）
const consistencyRate = computed(() => {
  return Math.round((trainingDaysInLast30Days.value.length / 30) * 100)
})

// 当前日期
const currentDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
})

// 总训练时长（分钟）
const totalTrainingDuration = computed(() => {
  return Math.round(workoutStore.workoutRecords.reduce((total, record) => {
    return total + (record.duration || 0)
  }, 0) / 60)
})

// 平均每次训练时长（分钟）
const averageTrainingDuration = computed(() => {
  const totalRecords = workoutStore.workoutRecords.length
  if (totalRecords === 0) return 0
  
  return Math.round(totalTrainingDuration.value / totalRecords)
})

// 格式化时间（将秒转为更易读的格式）
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  let result = ''
  if (hours > 0) {
    result += `${hours}小时 `
  }
  if (minutes > 0 || hours > 0) {
    result += `${minutes}分钟 `
  }
  result += `${remainingSeconds}秒`
  
  return result
}

// 判断日期是否有训练
function hasTrainingOnDate(day: number): boolean {
  const date = new Date()
  date.setDate(date.getDate() - (30 - day))
  const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  return trainingDaysInLast30Days.value.includes(dateString)
}

// 获取日期的日
function getDayOfMonth(day: number): number {
  const date = new Date()
  date.setDate(date.getDate() - (30 - day))
  return date.getDate()
}
</script>

<template>
  <div class="workout-stats">
    <div class="stat-header">
      <h2>训练统计</h2>
      <div class="current-date">{{ currentDate }}</div>
    </div>
    
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-info">
          <div class="stat-value">{{ weeklyWorkoutCount }}</div>
          <div class="stat-label">本周训练次数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <div class="stat-value">{{ monthlyWorkoutCount }}</div>
          <div class="stat-label">本月训练次数</div>
        </div>
      </div>
    </div>
    
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-info">
          <div class="stat-value">{{ totalTrainingDuration }}</div>
          <div class="stat-label">总训练时长(分)</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-value">{{ consistencyRate }}%</div>
          <div class="stat-label">30天坚持率</div>
        </div>
      </div>
    </div>
    
    <nut-cell-group title="30天训练日历" class="calendar-group">
      <div class="calendar-container">
        <div class="calendar-weekdays">
          <div v-for="weekday in ['日', '一', '二', '三', '四', '五', '六']" :key="weekday" class="weekday">{{ weekday }}</div>
        </div>
        <div class="calendar-grid">
          <div 
            v-for="day in 30" 
            :key="day"
            :class="['calendar-day', hasTrainingOnDate(day) ? 'trained' : '']"
          >
            {{ getDayOfMonth(day) }}
          </div>
        </div>
      </div>
    </nut-cell-group>
    
    <nut-cell-group title="最近训练记录">
      <template v-if="workoutStore.workoutRecords.length > 0">
        <nut-cell 
          v-for="record in [...workoutStore.workoutRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)" 
          :key="record.id"
          :title="workoutStore.workoutPlans.find(p => p.id === record.planId)?.name || '未知计划'" 
        >
          <template #desc>
            <div>{{ new Date(record.date).toLocaleDateString() }}</div>
            <div>时长: {{ formatTime(record.duration) }}</div>
          </template>
        </nut-cell>
      </template>
      <nut-empty v-else description="暂无训练记录" />
    </nut-cell-group>
  </div>
</template>

<style scoped>
.workout-stats {
  padding: 16px;
  background-color: #f5f5f5;
}

.stat-header {
  margin-bottom: 20px;
  text-align: center;
}

.stat-header h2 {
  margin: 0;
  color: var(--nutui-brand-color);
  font-size: 24px;
}

.current-date {
  color: #666;
  font-size: 14px;
  margin-top: 4px;
}

.stats-cards {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
}

.stat-icon {
  font-size: 24px;
  margin-right: 12px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--nutui-brand-color);
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.calendar-group {
  margin-top: 16px;
}

.calendar-container {
  background-color: white;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 12px;
  color: #666;
  padding: 4px 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  aspect-ratio: 1/1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.calendar-day.trained {
  background-color: var(--nutui-brand-color);
  color: white;
  font-weight: bold;
}
</style> 