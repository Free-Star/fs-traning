import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // 声音设置
  const soundEnabled = ref(true)
  const vibrationEnabled = ref(true)
  
  // 默认训练设置
  const defaultSettings = reactive({
    exerciseTime: 40, // 默认每组训练时间（秒）
    restTime: 30,     // 默认组间休息时间（秒）
  })
  
  // 主题设置
  const themeColor = ref('#1989fa') // 默认主题颜色
  const isDarkMode = ref(false)     // 是否为暗黑模式
  
  // 播放声音
  function playSound(type: 'exercise-start' | 'exercise-end' | 'rest-end') {
    if (!soundEnabled.value) return
    
    try {
      console.log('尝试播放声音:', type);
      
      // 声音文件URL
      let soundUrl = '';
      switch (type) {
        case 'exercise-start':
          soundUrl = new URL('/sounds/exercise-start.mp3', import.meta.url).href;
          break;
        case 'exercise-end':
          soundUrl = new URL('/sounds/exercise-end.mp3', import.meta.url).href;
          break;
        case 'rest-end':
          soundUrl = new URL('/sounds/rest-end.mp3', import.meta.url).href;
          break;
      }
      
      // 创建一个临时的Audio对象
      const audio = new Audio(soundUrl);
      
      // 当声音加载完成时播放
      audio.oncanplaythrough = () => {
        audio.play().catch(error => {
          console.error('播放声音失败:', error);
        });
      };
      
      // 处理加载错误
      audio.onerror = (error) => {
        console.error('加载声音文件失败:', error);
      };
    } catch (error) {
      console.error('播放声音时出错:', error);
    }
  }
  
  // 触发震动
  function vibrate(pattern: number | number[]) {
    if (!vibrationEnabled.value) return
    
    try {
      console.log('尝试触发震动:', pattern);
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      } else {
        console.log('该设备不支持震动API');
      }
    } catch (error) {
      console.error('触发震动时出错:', error);
    }
  }
  
  // 保存设置到本地存储
  function saveSettings() {
    localStorage.setItem('fitness-app-settings', JSON.stringify({
      soundEnabled: soundEnabled.value,
      vibrationEnabled: vibrationEnabled.value,
      defaultSettings,
      themeColor: themeColor.value,
      isDarkMode: isDarkMode.value
    }))
  }
  
  // 从本地存储加载设置
  function loadSettings() {
    const savedSettings = localStorage.getItem('fitness-app-settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      soundEnabled.value = parsed.soundEnabled
      vibrationEnabled.value = parsed.vibrationEnabled
      defaultSettings.exerciseTime = parsed.defaultSettings.exerciseTime
      defaultSettings.restTime = parsed.defaultSettings.restTime
      themeColor.value = parsed.themeColor
      isDarkMode.value = parsed.isDarkMode
    }
  }
  
  // 应用主题
  function applyTheme() {
    document.documentElement.style.setProperty('--nutui-brand-color', themeColor.value)
    document.documentElement.style.setProperty('--nutui-brand-color-light', `${themeColor.value}20`)
    
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
  
  // 初始化时加载设置
  loadSettings()
  applyTheme()
  
  return {
    soundEnabled,
    vibrationEnabled,
    defaultSettings,
    themeColor,
    isDarkMode,
    playSound,
    vibrate,
    saveSettings,
    loadSettings,
    applyTheme
  }
}) 