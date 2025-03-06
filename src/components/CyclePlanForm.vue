<script setup lang="ts">
import { reactive} from 'vue'
import { useWorkoutStore } from '../stores/workout'
import type { CycleType } from '../stores/workout'
import { showToast } from '@nutui/nutui'

const workoutStore = useWorkoutStore()

const props = defineProps({
  editMode: {
    type: Boolean,
    default: false
  },
  cycleId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['saved', 'canceled'])

// 周期类型选项
const cycleTypes = [
  { value: 'three-split', label: '三分法（推、拉、腿）' },
  { value: 'five-split', label: '五分法（胸、背、肩、腿、手臂）' },
  { value: 'custom', label: '自定义' }
]

// 星期几选项
const weekdays = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' }
]

// 表单数据
const formData = reactive({
  name: '',
  type: 'three-split' as CycleType,
  schedule: {} as Record<number, string>,
  active: true
})

// 编辑模式加载数据
if (props.editMode && props.cycleId) {
  const cycle = workoutStore.cyclePlans.find(c => c.id === props.cycleId)
  if (cycle) {
    formData.name = cycle.name
    formData.type = cycle.type
    formData.schedule = { ...cycle.schedule }
    formData.active = cycle.active
  }
}

// 根据周期类型获取默认计划建议
function getDefaultScheduleSuggestion() {
  if (formData.type === 'three-split') {
    return [
      { day: 1, type: '推' },
      { day: 3, type: '拉' },
      { day: 5, type: '腿' }
    ]
  } else if (formData.type === 'five-split') {
    return [
      { day: 1, type: '胸' },
      { day: 2, type: '背' },
      { day: 3, type: '肩' },
      { day: 5, type: '腿' },
      { day: 6, type: '手臂' }
    ]
  }
  return []
}

// 应用默认安排建议
function applyDefaultSchedule() {
  const suggestions = getDefaultScheduleSuggestion()
  
  // 清除当前安排
  formData.schedule = {}
  
  suggestions.forEach(suggestion => {
    const plansOfType = workoutStore.workoutPlans.filter(plan => plan.type === suggestion.type)
    if (plansOfType.length > 0) {
      formData.schedule[suggestion.day] = plansOfType[0].id
    }
  })

  showToast.success('已应用默认建议')
}

// 保存周期计划
function saveCyclePlan() {
  if (!formData.name.trim()) {
    showToast.text('请输入计划名称')
    return
  }
  
  if (Object.keys(formData.schedule).length === 0) {
    showToast.text('请至少安排一天训练')
    return
  }
  
  if (props.editMode && props.cycleId) {
    // 更新计划
    const workoutPlanIds = Object.values(formData.schedule)
    const workoutPlans = workoutStore.workoutPlans.filter(plan => 
      workoutPlanIds.includes(plan.id)
    )
    
    workoutStore.cyclePlans.forEach(plan => {
      if (plan.id === props.cycleId) {
        plan.name = formData.name
        plan.type = formData.type
        plan.schedule = { ...formData.schedule }
        plan.workoutPlans = [...workoutPlans]
        plan.active = formData.active
        plan.updatedAt = new Date()
      } else if (formData.active) {
        // 如果当前计划激活，则其他计划设为非激活
        plan.active = false
      }
    })
    showToast.success('周期计划已更新')
  } else {
    // 创建新计划
    const workoutPlanIds = Object.values(formData.schedule)
    const workoutPlans = workoutStore.workoutPlans.filter(plan => 
      workoutPlanIds.includes(plan.id)
    )
    
    // 如果当前计划激活，则其他计划设为非激活
    if (formData.active) {
      workoutStore.cyclePlans.forEach(plan => {
        plan.active = false
      })
    }
    
    const newCycle = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      workoutPlans,
      schedule: { ...formData.schedule },
      active: formData.active,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    workoutStore.cyclePlans.push(newCycle)
    showToast.success('周期计划已创建')
  }
  
  emit('saved')
}

function cancel() {
  emit('canceled')
}
</script>

<template>
  <div class="cycle-plan-form">
    <nut-cell-group title="基本信息">
      <nut-cell title="计划名称">
        <input 
          v-model="formData.name" 
          type="text" 
          class="nut-input"
          placeholder="输入周期计划名称"
        >
      </nut-cell>
      
      <nut-cell title="周期类型">
        <select 
          v-model="formData.type" 
          class="nut-select"
        >
          <option v-for="type in cycleTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </nut-cell>
    </nut-cell-group>
    
    <div class="schedule-header">
      <div class="schedule-title">每周训练安排</div>
      <nut-button 
        size="small"
        type="primary"
        @click="applyDefaultSchedule"
      >
        应用默认建议
      </nut-button>
    </div>
    
    <nut-cell-group>
      <nut-cell 
        v-for="day in weekdays" 
        :key="day.value"
        :title="day.label"
      >
        <select 
          v-model="formData.schedule[day.value]" 
          class="nut-select"
        >
          <option value="">不训练</option>
          <option 
            v-for="plan in workoutStore.workoutPlans" 
            :key="plan.id" 
            :value="plan.id"
          >
            {{ plan.name }} ({{ plan.type }})
          </option>
        </select>
      </nut-cell>
    </nut-cell-group>
    
    <nut-cell-group>
      <nut-cell>
        <nut-switch v-model="formData.active" />
        <span class="ml-2">设为当前活跃计划</span>
      </nut-cell>
    </nut-cell-group>
    
    <div class="action-buttons">
      <nut-button 
        type="primary"
        block
        @click="saveCyclePlan"
        class="mb-2"
      >
        保存周期计划
      </nut-button>
      
      <nut-button 
        type="default"
        block
        @click="cancel"
      >
        取消
      </nut-button>
    </div>
  </div>
</template>

<style scoped>
.cycle-plan-form {
  padding: 16px;
  max-width: 100%;
  background-color: #f5f5f5;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  margin-top: 16px;
  background-color: #fff;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #f2f2f2;
}

.schedule-title {
  font-size: 14px;
  font-weight: bold;
}

.nut-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 14px;
}

.nut-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 14px;
  background-color: #fff;
}

.action-buttons {
  margin: 16px 0;
}

.mb-2 {
  margin-bottom: 8px;
}

.ml-2 {
  margin-left: 8px;
}
</style> 