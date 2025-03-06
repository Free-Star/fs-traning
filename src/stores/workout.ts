import { defineStore } from 'pinia'
import { ref, reactive, computed, watch } from 'vue'

// 训练周期类型
export type CycleType = 'three-split' | 'five-split' | 'custom'

// 训练类型
export type WorkoutType = '推' | '拉' | '腿' | '胸' | '背' | '肩' | '手臂' | 'custom'

// 训练动作
export interface Exercise {
  id: string
  name: string
  sets: number
  timePerSet: number // 每组训练时间（秒）
  restBetweenSets: number // 组间休息时间（秒）
  note?: string
}

// 训练计划
export interface WorkoutPlan {
  id: string
  name: string
  type: WorkoutType
  exercises: Exercise[]
  createdAt?: Date
  updatedAt?: Date
}

// 周期计划
export interface CyclePlan {
  id: string
  name: string
  type: CycleType
  workoutPlans: WorkoutPlan[]
  schedule: Record<number, string> // 星期几 -> 训练计划ID
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// 训练记录
export interface WorkoutRecord {
  id: string
  planId: string
  date: Date
  duration: number // 训练时长（秒）
  completed: boolean
}

// 使用LocalStorage存储和加载数据
const STORAGE_KEY_PLANS = 'fitness-tracker-plans'
const STORAGE_KEY_RECORDS = 'fitness-tracker-records'
const STORAGE_KEY_CYCLES = 'fitness-tracker-cycles'

export const useWorkoutStore = defineStore('workout', () => {
  // 状态
  const workoutPlans = ref<WorkoutPlan[]>([])
  const cyclePlans = ref<CyclePlan[]>([])
  const workoutRecords = ref<WorkoutRecord[]>([])
  const currentWorkoutPlanId = ref<string | null>(null)

  // 计算属性
  const currentWorkoutPlan = computed(() => 
    workoutPlans.value.find(plan => plan.id === currentWorkoutPlanId.value) || null
  )

  const getActiveCyclePlan = computed(() => 
    cyclePlans.value.find(cycle => cycle.active) || null
  )

  const getTodayWorkoutPlan = computed(() => {
    if (!getActiveCyclePlan.value) return null
    
    const today = new Date().getDay() // 0是周日，1-6是周一到周六
    const planId = getActiveCyclePlan.value.schedule[today]
    
    return planId ? workoutPlans.value.find(plan => plan.id === planId) || null : null
  })

  const totalWorkoutTime = computed(() => {
    if (!currentWorkoutPlan.value) return 0
    
    return currentWorkoutPlan.value.exercises.reduce((total, exercise) => {
      const exerciseTime = exercise.sets * exercise.timePerSet
      const restTime = (exercise.sets - 1) * exercise.restBetweenSets
      return total + exerciseTime + restTime
    }, 0)
  })

  // 加载数据
  function loadFromLocalStorage() {
    try {
      console.log('正在加载数据...');
      
      // 加载训练计划
      const savedWorkoutPlans = localStorage.getItem('workout-plans')
      if (savedWorkoutPlans) {
        const parsed = JSON.parse(savedWorkoutPlans)
        workoutPlans.value = parsed.map((plan: any) => ({
          ...plan,
          createdAt: plan.createdAt ? new Date(plan.createdAt) : new Date(),
          updatedAt: plan.updatedAt ? new Date(plan.updatedAt) : new Date()
        }))
        console.log(`加载了 ${workoutPlans.value.length} 个训练计划`);
      } else {
        console.log('没有找到保存的训练计划');
      }
      
      // 加载周期计划
      const savedCyclePlans = localStorage.getItem('cycle-plans')
      if (savedCyclePlans) {
        const parsed = JSON.parse(savedCyclePlans)
        cyclePlans.value = parsed.map((cycle: any) => ({
          ...cycle,
          createdAt: cycle.createdAt ? new Date(cycle.createdAt) : new Date(),
          updatedAt: cycle.updatedAt ? new Date(cycle.updatedAt) : new Date(),
          // 重构workoutPlans引用
          workoutPlans: cycle.workoutPlans.map((planId: string) => 
            workoutPlans.value.find(p => p.id === planId)
          ).filter(Boolean)
        }))
        console.log(`加载了 ${cyclePlans.value.length} 个周期计划`);
      } else {
        console.log('没有找到保存的周期计划');
      }
      
      // 加载训练记录
      const savedWorkoutRecords = localStorage.getItem('workout-records')
      if (savedWorkoutRecords) {
        const parsed = JSON.parse(savedWorkoutRecords)
        workoutRecords.value = parsed.map((record: any) => ({
          ...record,
          date: new Date(record.date)
        }))
        console.log(`加载了 ${workoutRecords.value.length} 条训练记录`);
      } else {
        console.log('没有找到保存的训练记录');
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }

  // 保存数据
  function saveToLocalStorage() {
    try {
      console.log('正在保存数据...');
      
      // 保存训练计划
      localStorage.setItem('workout-plans', JSON.stringify(workoutPlans.value))
      console.log(`保存了 ${workoutPlans.value.length} 个训练计划`);
      
      // 保存周期计划（需要处理循环引用）
      const cyclePlansToSave = cyclePlans.value.map(cycle => ({
        ...cycle,
        // 只保存workoutPlans的ID
        workoutPlans: cycle.workoutPlans.map(plan => plan.id)
      }))
      localStorage.setItem('cycle-plans', JSON.stringify(cyclePlansToSave))
      console.log(`保存了 ${cyclePlans.value.length} 个周期计划`);
      
      // 保存训练记录
      localStorage.setItem('workout-records', JSON.stringify(workoutRecords.value))
      console.log(`保存了 ${workoutRecords.value.length} 条训练记录`);
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  }

  // 添加训练计划
  function addWorkoutPlan(plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date()
    const newPlan: WorkoutPlan = {
      ...plan,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now
    }
    
    workoutPlans.value.push(newPlan)
    saveToLocalStorage()
    return newPlan
  }

  // 更新训练计划
  function updateWorkoutPlan(id: string, updates: Partial<Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>>) {
    const planIndex = workoutPlans.value.findIndex(p => p.id === id)
    if (planIndex !== -1) {
      workoutPlans.value[planIndex] = {
        ...workoutPlans.value[planIndex],
        ...updates,
        updatedAt: new Date()
      }
      saveToLocalStorage()
    }
  }

  // 删除训练计划
  function deleteWorkoutPlan(id: string) {
    // 从训练计划列表中删除
    workoutPlans.value = workoutPlans.value.filter(p => p.id !== id)
    
    // 从周期计划中移除该训练计划
    cyclePlans.value.forEach(cycle => {
      // 从workoutPlans数组中移除
      cycle.workoutPlans = cycle.workoutPlans.filter(p => p.id !== id)
      
      // 从schedule中移除
      for (const day in cycle.schedule) {
        if (cycle.schedule[day] === id) {
          delete cycle.schedule[day]
        }
      }
    })
    
    saveToLocalStorage()
  }

  // 添加周期计划
  function addCyclePlan(plan: Omit<CyclePlan, 'id' | 'createdAt' | 'updatedAt'>) {
    // 如果新计划是激活的，需要将其他计划设为非激活
    if (plan.active) {
      cyclePlans.value.forEach(p => p.active = false)
    }
    
    const newPlan: CyclePlan = {
      ...plan,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    cyclePlans.value.push(newPlan)
    saveToLocalStorage()
    return newPlan
  }

  // 设置当前训练计划
  function setCurrentWorkoutPlan(planId: string | null) {
    currentWorkoutPlanId.value = planId
  }

  // 记录训练
  function recordWorkout(planId: string, exercises: WorkoutRecord['exercises']) {
    const newRecord: WorkoutRecord = {
      id: Date.now().toString(),
      planId,
      date: new Date(),
      completed: true, // 默认完成
      exercises
    }
    
    workoutRecords.value.push(newRecord)
    saveToLocalStorage()
    return newRecord
  }

  // 导出数据
  function exportData() {
    const exportData = {
      workoutPlans: workoutPlans.value,
      cyclePlans: cyclePlans.value.map(cycle => ({
        ...cycle,
        workoutPlans: cycle.workoutPlans.map(plan => plan.id)
      })),
      workoutRecords: workoutRecords.value,
      exportDate: new Date()
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    
    const exportFileName = `fitness-data-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileName)
    linkElement.click()
  }
  
  // 导入数据
  function importData(jsonData: string) {
    try {
      const parsedData = JSON.parse(jsonData)
      
      if (parsedData.workoutPlans) {
        workoutPlans.value = parsedData.workoutPlans.map((plan: any) => ({
          ...plan,
          createdAt: plan.createdAt ? new Date(plan.createdAt) : new Date(),
          updatedAt: plan.updatedAt ? new Date(plan.updatedAt) : new Date()
        }))
      }
      
      if (parsedData.workoutRecords) {
        workoutRecords.value = parsedData.workoutRecords.map((record: any) => ({
          ...record,
          date: new Date(record.date)
        }))
      }
      
      if (parsedData.cyclePlans) {
        cyclePlans.value = parsedData.cyclePlans.map((cycle: any) => {
          // 重构workoutPlans引用
          const workoutPlanRefs = cycle.workoutPlans.map((planId: string) => 
            workoutPlans.value.find(p => p.id === planId)
          ).filter(Boolean)
          
          return {
            ...cycle,
            createdAt: cycle.createdAt ? new Date(cycle.createdAt) : new Date(),
            updatedAt: cycle.updatedAt ? new Date(cycle.updatedAt) : new Date(),
            workoutPlans: workoutPlanRefs
          }
        })
      }
      
      saveToLocalStorage()
      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      return false
    }
  }

  // 监听数据变化，自动保存
  watch([workoutPlans, cyclePlans, workoutRecords], () => {
    saveToLocalStorage()
  }, { deep: true })

  // 初始化时加载数据
  loadFromLocalStorage()

  return {
    workoutPlans,
    cyclePlans,
    workoutRecords,
    currentWorkoutPlan,
    getActiveCyclePlan,
    getTodayWorkoutPlan,
    totalWorkoutTime,
    setCurrentWorkoutPlan,
    addWorkoutPlan,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    addCyclePlan,
    recordWorkout,
    loadFromLocalStorage,
    saveToLocalStorage,
    exportData,
    importData
  }
}) 