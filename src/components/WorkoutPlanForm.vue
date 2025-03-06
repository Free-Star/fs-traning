<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useWorkoutStore } from '../stores/workout'
import type { WorkoutType, Exercise } from '../stores/workout'
import { showToast } from '@nutui/nutui'

const workoutStore = useWorkoutStore()

const props = defineProps({
  editMode: {
    type: Boolean,
    default: false
  },
  planId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['saved', 'canceled'])

const workoutTypes: WorkoutType[] = ['推', '拉', '腿', '胸', '背', '肩', '手臂']

// 表单数据
const formData = reactive({
  name: '',
  type: workoutTypes[0],
  exercises: [] as Exercise[]
})

// 新动作表单
const newExercise = reactive({
  name: '',
  sets: null,
  timePerSet: null,
  restBetweenSets: null
})

// 编辑模式加载数据
if (props.editMode && props.planId) {
  const plan = workoutStore.workoutPlans.find(p => p.id === props.planId)
  if (plan) {
    formData.name = plan.name
    formData.type = plan.type
    formData.exercises = [...plan.exercises]
  }
}

// 添加新动作
const addExercise = () => {
  if (!newExercise.name.trim()) {
    showToast.text('请输入动作名称')
    return
  }
  
  formData.exercises.push({
    id: Date.now().toString(),
    name: newExercise.name,
    sets: newExercise.sets as any,
    timePerSet: newExercise.timePerSet as any,
    restBetweenSets: newExercise.restBetweenSets as any
  })
  
  // 重置表单
  newExercise.name = ''
  showToast.success('已添加新动作')
}

// 删除动作
function removeExercise(index: number) {
  formData.exercises.splice(index, 1)
}

// 计算总训练时间
const totalTime = computed(() => {
  return formData.exercises.reduce((total, exercise) => {
    const exerciseTime = exercise.sets * exercise.timePerSet
    const restTime = (exercise.sets - 1) * exercise.restBetweenSets
    return total + exerciseTime + restTime
  }, 0)
})

// 格式化时间
const formattedTotalTime = computed(() => {
  const hours = Math.floor(totalTime.value / 3600)
  const minutes = Math.floor((totalTime.value % 3600) / 60)
  const seconds = totalTime.value % 60
  
  let result = ''
  if (hours > 0) {
    result += `${hours}小时 `
  }
  if (minutes > 0 || hours > 0) {
    result += `${minutes}分钟 `
  }
  result += `${seconds}秒`
  
  return result
})

// 保存计划
function savePlan() {
  if (!formData.name.trim()) {
    showToast.text('请输入计划名称')
    return
  }
  
  if (formData.exercises.length === 0) {
    showToast.text('请至少添加一个训练动作')
    return
  }
  
  if (props.editMode && props.planId) {
    workoutStore.updateWorkoutPlan(props.planId, {
      name: formData.name,
      type: formData.type,
      exercises: formData.exercises
    })
    showToast.success('计划已更新')
  } else {
    workoutStore.addWorkoutPlan({
      name: formData.name,
      type: formData.type,
      exercises: formData.exercises
    })
    showToast.success('计划已创建')
  }
  
  emit('saved')
}

function cancel() {
  emit('canceled')
}
</script>

<template>
  <div class="workout-plan-form">
    <nut-cell-group title="基本信息">
      <nut-cell title="计划名称">
        <input
          v-model="formData.name"
          type="text"
          class="nut-input"
          placeholder="输入训练计划名称"
        />
      </nut-cell>
      
      <nut-cell title="训练类型">
        <select
          v-model="formData.type"
          class="nut-select"
        >
          <option v-for="type in workoutTypes" :key="type" :value="type">
            {{ type }}
          </option>
          <option value="custom">自定义</option>
        </select>
      </nut-cell>
    </nut-cell-group>
    
    <nut-cell-group title="训练动作列表">
      <nut-empty
        v-if="formData.exercises.length === 0"
        description="还没有添加训练动作"
      />
      
      <div v-else class="exercise-list">
        <nut-cell 
          v-for="(exercise, index) in formData.exercises" 
          :key="exercise.id"
          :title="exercise.name"
          :desc="`${exercise.sets}组 × ${exercise.timePerSet}秒，休息${exercise.restBetweenSets}秒`"
        >
          <template #link>
            <nut-button
              type="danger"
              size="small"
              @click="removeExercise(index)"
            >
              <Icon icon="mdi:delete" />
            </nut-button>
          </template>
        </nut-cell>
      </div>
    </nut-cell-group>
    
    <nut-cell-group title="添加新动作">
      <nut-cell title="动作名称">
        <input 
          v-model="newExercise.name" 
          type="text" 
          class="nut-input"
          placeholder="动作名称，例如：卧推"
        />
      </nut-cell>
      
      <nut-cell title="组数">
        <input 
          v-model.number="newExercise.sets" 
          type="number" 
          min="1"
          class="nut-input"
          placeholder="请输入训练组数"
        />
      </nut-cell>
      
      <nut-cell title="每组时间（秒）">
        <input 
          v-model.number="newExercise.timePerSet" 
          type="number" 
          min="1"
          class="nut-input"
          placeholder="每组持续时间（秒）"
        />
      </nut-cell>
      
      <nut-cell title="组间休息时间（秒）">
        <input 
          v-model.number="newExercise.restBetweenSets" 
          type="number" 
          min="0"
          class="nut-input"
          placeholder="组间休息时间（秒）"
        />
      </nut-cell>
    </nut-cell-group>
    <div class="action-buttons">
      <nut-button 
        type="primary"
        block
        @click="addExercise"
        class="mb-4"
      >
        <Icon icon="mdi:plus" /> 添加动作
      </nut-button>
    </div>
    
    <nut-cell-group>
      <nut-cell title="预计总训练时长" :desc="formattedTotalTime" />
    </nut-cell-group>
    
    <div class="action-buttons">
      <nut-button 
        type="primary"
        block
        @click="savePlan"
        class="mb-2"
      >
        <Icon icon="mdi:check" /> 保存计划
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
.workout-plan-form {
  padding: 16px;
  max-width: 100%;
  background-color: #f5f5f5;
}

.exercise-list {
  max-height: 300px;
  overflow-y: auto;
}

.action-buttons {
  margin: 16px 0;
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

.mb-2 {
  margin-bottom: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style> 