<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorkoutStore } from '../stores/workout'

const workoutStore = useWorkoutStore()

// 视图类型：周/月
const viewType = ref<'week' | 'month'>('week')

// 获取过去四周的训练数据
const pastFourWeeksData = computed(() => {
  const now = new Date()
  const data = []
  
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() - (7 * i))
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    const weekRecords = workoutStore.workoutRecords.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate >= weekStart && recordDate <= weekEnd
    })
    
    // 计算总训练时间（秒）
    const totalDuration = weekRecords.reduce((total, record) => {
      // 假设每个记录包含实际训练时长
      return total + (record.duration || 0)
    }, 0)
    
    // 计算这周的名称（例如：3月1日-3月7日）
    const weekLabel = `${(weekStart.getMonth() + 1)}月${weekStart.getDate()}日~`
    
    data.unshift({
      label: weekLabel,
      count: weekRecords.length,
      duration: totalDuration
    })
  }
  
  return data
})

// 获取过去六个月的训练数据
const pastSixMonthsData = computed(() => {
  const now = new Date()
  const data = []
  
  for (let i = 0; i < 6; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthStart.setHours(0, 0, 0, 0)
    
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)
    
    const monthRecords = workoutStore.workoutRecords.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate >= monthStart && recordDate <= monthEnd
    })
    
    // 计算总训练时间（秒）
    const totalDuration = monthRecords.reduce((total, record) => {
      return total + (record.duration || 0)
    }, 0)
    
    // 月份名称
    const monthLabel = `${monthStart.getMonth() + 1}月`
    
    data.unshift({
      label: monthLabel,
      count: monthRecords.length,
      duration: totalDuration
    })
  }
  
  return data
})

// 当前显示的数据
const displayData = computed(() => {
  return viewType.value === 'week' ? pastFourWeeksData.value : pastSixMonthsData.value
})

// 获取图表的最大值，用于设置高度比例
const maxCount = computed(() => {
  return Math.max(...displayData.value.map(item => item.count), 1)
})

// 格式化时间（秒转为小时:分钟:秒）
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  let result = ''
  if (hours > 0) {
    result += `${hours}小时`
  }
  if (minutes > 0 || hours > 0) {
    result += ` ${minutes}分钟`
  }
  if (!hours) {
    result += ` ${remainingSeconds}秒`
  }
  
  return result.trim()
}

// 设置图表高度比例
function getBarHeight(count: number): string {
  const percentage = (count / maxCount.value) * 100
  return `${Math.max(percentage, 5)}%` // 最小高度5%，防止完全看不见
}

// 获取平均每次训练时长
const averageTrainingDuration = computed(() => {
  // 所有记录的总时长
  const totalDuration = workoutStore.workoutRecords.reduce((total, record) => {
    return total + (record.duration || 0)
  }, 0)
  
  // 训练次数
  const totalCount = workoutStore.workoutRecords.length
  
  if (totalCount === 0) return 0
  
  return Math.round(totalDuration / totalCount)
})
</script>

<template>
  <div class="workout-trends">
    <div class="view-selector">
      <nut-button 
        size="small" 
        :type="viewType === 'week' ? 'primary' : 'default'"
        @click="viewType = 'week'"
      >
        周视图
      </nut-button>
      <nut-button 
        size="small" 
        :type="viewType === 'month' ? 'primary' : 'default'"
        @click="viewType = 'month'"
      >
        月视图
      </nut-button>
    </div>
    
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ workoutStore.workoutRecords.length }}</div>
        <div class="stat-label">总训练次数</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ formatDuration(averageTrainingDuration) }}</div>
        <div class="stat-label">平均训练时长</div>
      </div>
    </div>
    
    <div class="chart-container">
      <div class="chart-title">{{ viewType === 'week' ? '过去四周训练次数' : '过去六个月训练次数' }}</div>
      
      <div class="chart">
        <div 
          v-for="(item, index) in displayData" 
          :key="index"
          class="chart-bar-container"
        >
          <div class="chart-label">{{ item.label }}</div>
          <div class="chart-bar-wrapper">
            <div 
              class="chart-bar" 
              :style="{ height: getBarHeight(item.count) }"
            >
              <div class="chart-value">{{ item.count }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <nut-cell-group title="训练详情">
      <nut-cell 
        v-for="(item, index) in displayData" 
        :key="index"
        :title="item.label"
        :desc="`${item.count}次训练，总时长${formatDuration(item.duration)}`"
      />
    </nut-cell-group>
  </div>
</template>

<style scoped>
.workout-trends {
  padding: 16px;
  background-color: #f5f5f5;
}

.view-selector {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.stats-cards {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin: 16px 0;
}

.stat-card {
  flex: 1;
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--nutui-brand-color);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.chart-container {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.chart-title {
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200px;
}

.chart-bar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.chart-label {
  font-size: 10px;
  color: #666;
  margin-top: 8px;
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chart-bar-wrapper {
  width: 100%;
  height: 180px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.chart-bar {
  width: 80%;
  background-color: var(--nutui-brand-color);
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.3s ease;
}

.chart-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: bold;
  color: var(--nutui-brand-color);
}
</style> 