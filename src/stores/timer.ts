import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useWorkoutStore } from './workout'
import type { Exercise, WorkoutPlan } from './workout'
import { useSettingsStore } from './settings'

export type TimerState = 'idle' | 'exercise' | 'rest' | 'completed'

export const useTimerStore = defineStore('timer', () => {
  // 工作状态
  const workoutStore = useWorkoutStore()
  
  // 状态
  const currentState = ref<TimerState>('idle')
  const currentExerciseIndex = ref(0)
  const currentSetIndex = ref(0)
  const timeRemaining = ref(0)
  const isRunning = ref(false)
  const currentWorkout = ref<WorkoutPlan | null>(null)
  const intervalId = ref<number | null>(null)
  
  // 音频
  const exerciseStartSound = ref<HTMLAudioElement | null>(null)
  const restStartSound = ref<HTMLAudioElement | null>(null)
  const completedSound = ref<HTMLAudioElement | null>(null)
  
  // 设置存储
  const settingsStore = useSettingsStore()
  
  // 训练数据记录
  const workoutStartTime = ref<Date | null>(null)
  const totalWorkoutTime = ref(0)
  
  // 初始化音频
  function initSounds() {
    if (typeof window !== 'undefined') {
      exerciseStartSound.value = new Audio('/sounds/exercise-start.mp3')
      restStartSound.value = new Audio('/sounds/rest-start.mp3')
      completedSound.value = new Audio('/sounds/completed.mp3')
    }
  }
  
  // 计算属性
  const currentExercise = computed<Exercise | null>(() => {
    if (!currentWorkout.value || currentExerciseIndex.value >= currentWorkout.value.exercises.length) {
      return null
    }
    return currentWorkout.value.exercises[currentExerciseIndex.value]
  })
  
  const totalSets = computed(() => {
    if (!currentExercise.value) return 0
    return currentExercise.value.sets
  })
  
  const progress = computed(() => {
    if (currentState.value === 'idle' || currentState.value === 'completed') {
      return 0
    }
    
    let totalTime = 0
    
    if (currentState.value === 'exercise' && currentExercise.value) {
      totalTime = currentExercise.value.timePerSet
    } else if (currentState.value === 'rest' && currentExercise.value) {
      totalTime = currentExercise.value.restBetweenSets
    }
    
    if (totalTime === 0) return 0
    
    return 1 - (timeRemaining.value / totalTime)
  })
  
  const isLastSet = computed(() => 
    currentSetIndex.value === totalSets.value - 1
  )
  
  const isLastExercise = computed(() => {
    if (!currentWorkout.value) return true
    return currentExerciseIndex.value === currentWorkout.value.exercises.length - 1
  })
  
  // 计时器逻辑
  // @ts-ignore - 忽略未使用的变量警告
  const { pause: pauseInterval, resume: resumeInterval } = useIntervalFn(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value -= 1
      
      // 更新总训练时间（仅计算训练时间，不计休息时间）
      if (currentState.value === 'exercise') {
        totalWorkoutTime.value++
      }
    } else {
      handleTimerComplete()
    }
  }, 1000, { immediate: false })
  
  // 初始化训练
  function initWorkout(workout: WorkoutPlan) {
    console.log('初始化训练计划:', workout.name);
    
    // 清除可能存在的计时器
    if (intervalId.value) {
      clearInterval(intervalId.value);
      intervalId.value = null;
    }
    
    currentWorkout.value = workout
    currentExerciseIndex.value = 0
    currentSetIndex.value = 0
    currentState.value = 'idle'
    isRunning.value = false
    
    // 重置记录数据
    workoutStartTime.value = new Date()
    totalWorkoutTime.value = 0
    
    if (workout.exercises && workout.exercises.length > 0) {
      console.log('设置第一个训练动作:', workout.exercises[0].name);
      // 设置第一个动作的训练时间
      timeRemaining.value = workout.exercises[0].timePerSet
      // 自动开始训练
      setTimeout(() => {
        startTimer('exercise')
      }, 500)
    } else {
      console.error('训练计划中没有动作!');
      timeRemaining.value = 0
      currentState.value = 'completed'
    }
  }
  
  // 开始计时器
  function startTimer(state: 'exercise' | 'rest') {
    console.log('开始计时器:', state);
    
    if (intervalId.value) {
      clearInterval(intervalId.value)
    }
    
    currentState.value = state
    isRunning.value = true
    
    intervalId.value = window.setInterval(() => {
      if (timeRemaining.value > 0) {
        timeRemaining.value--
        
        // 更新总训练时间（仅计算训练时间，不计休息时间）
        if (state === 'exercise') {
          totalWorkoutTime.value++
        }
      } else {
        // 时间结束，根据当前状态决定下一步
        if (state === 'exercise') {
          // 训练结束，开始休息或进入下一组
          handleExerciseCompleted()
        } else if (state === 'rest') {
          // 休息结束，开始下一组训练
          handleRestCompleted()
        }
      }
    }, 1000)
  }
  
  // 处理训练完成
  function handleExerciseCompleted() {
    if (!currentExercise.value) return
    
    if (currentSetIndex.value < currentExercise.value.sets - 1) {
      // 还有下一组，开始休息
      currentSetIndex.value++
      timeRemaining.value = currentExercise.value.restBetweenSets
      startTimer('rest')
    } else {
      // 这个动作的所有组都完成了
      moveToNextExercise()
    }
  }
  
  // 处理休息完成
  function handleRestCompleted() {
    if (!currentExercise.value) return
    
    timeRemaining.value = currentExercise.value.timePerSet
    startTimer('exercise')
  }
  
  // 移动到下一个训练动作
  function moveToNextExercise() {
    if (!currentWorkout.value) return
    
    currentExerciseIndex.value++
    currentSetIndex.value = 0
    
    if (currentExerciseIndex.value < currentWorkout.value.exercises.length) {
      // 还有下一个动作
      timeRemaining.value = currentWorkout.value.exercises[currentExerciseIndex.value].timePerSet
      startTimer('exercise')
    } else {
      // 所有动作都完成了
      completeWorkout()
    }
  }
  
  // 完成整个训练
  function completeWorkout() {
    pause()
    currentState.value = 'completed'
    
    // 保存训练记录
    if (currentWorkout.value && workoutStartTime.value) {
      const workoutRecord = {
        id: Date.now().toString(),
        planId: currentWorkout.value.id,
        date: new Date().toISOString(),
        duration: totalWorkoutTime.value,
        completed: true,
        exercises: [] as any[]
      }
      
      workoutStore.workoutRecords.push(workoutRecord as any)
      
      // 通知用户训练完成
      if (settingsStore.playSound) {
        settingsStore.playSound('exercise-end' as any)
      }
      if (settingsStore.vibrate) {
        settingsStore.vibrate([200, 100, 200, 100, 200])
      }
    }
  }
  
  // 暂停/继续
  function togglePause() {
    if (isRunning.value) {
      pause()
    } else {
      resume()
    }
  }
  
  // 暂停
  function pause() {
    isRunning.value = false
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }
  
  // 继续
  function resume() {
    if (currentState.value === 'idle' || currentState.value === 'completed') {
      if (currentExercise.value) {
        timeRemaining.value = currentExercise.value.timePerSet
        startTimer('exercise')
      }
    } else {
      startTimer(currentState.value)
    }
  }
  
  // 计时器完成时的处理
  function handleTimerComplete() {
    pause()
    
    if (currentState.value === 'exercise') {
      // 如果是最后一组，切换到下一个动作
      if (isLastSet.value) {
        if (isLastExercise.value) {
          completeWorkout()
        } else {
          currentExerciseIndex.value += 1
          currentSetIndex.value = 0
          startTimer('exercise')
        }
      } else {
        // 不是最后一组，开始休息
        currentSetIndex.value += 1
        startTimer('rest')
      }
    } else if (currentState.value === 'rest') {
      // 休息结束，开始下一组训练
      startTimer('exercise')
    }
  }
  
  // 跳过当前阶段
  function skip() {
    if (currentState.value === 'exercise') {
      handleExerciseCompleted()
    } else if (currentState.value === 'rest') {
      handleRestCompleted()
    }
  }
  
  // 重置
  function reset() {
    pause()
    currentState.value = 'idle'
    currentExerciseIndex.value = 0
    currentSetIndex.value = 0
    timeRemaining.value = 0
    totalWorkoutTime.value = 0
    workoutStartTime.value = new Date()
  }
  
  // 初始化
  initSounds()
  
  return {
    currentState,
    currentExerciseIndex,
    currentSetIndex,
    timeRemaining,
    isRunning,
    currentWorkout,
    progress,
    currentExercise,
    totalSets,
    isLastSet,
    isLastExercise,
    workoutStartTime,
    totalWorkoutTime,
    initWorkout,
    togglePause,
    skip,
    reset
  }
}) 