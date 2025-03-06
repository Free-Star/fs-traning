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
      
      // 定义所有可能的音频文件路径格式
      // 注意: Vite开发服务器下，应当使用 '/sounds/xxx.mp3'，但部署后可能需要其他路径
      const soundPaths = [
        `/sounds/${type}.mp3`,                  // 标准路径
        `./sounds/${type}.mp3`,                 // 相对路径
        `../public/sounds/${type}.mp3`,         // 开发环境路径
        `${window.location.origin}/sounds/${type}.mp3` // 绝对路径
      ];
      
      // 尝试所有可能的路径
      let audioLoaded = false;
      
      // 创建一个新的Audio对象
      const audio = new Audio();
      
      // 监听音频加载错误
      audio.onerror = (e) => {
        const currentPath = audio.src;
        console.error(`音频加载失败 (${currentPath}):`, e);
        
        // 如果有更多路径可尝试，则尝试下一个
        const currentIndex = soundPaths.findIndex(path => path === currentPath.replace(window.location.origin, ''));
        if (currentIndex >= 0 && currentIndex < soundPaths.length - 1) {
          console.log(`尝试下一个路径: ${soundPaths[currentIndex + 1]}`);
          audio.src = soundPaths[currentIndex + 1];
        } else {
          console.error('所有路径都已尝试，无法加载音频');
          
        }
      };
      
      // 当音频可以播放时
      audio.oncanplaythrough = () => {
        console.log('音频已加载，准备播放:', audio.src);
        audioLoaded = true;
        
        try {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => console.log('音频播放成功'))
              .catch(e => console.error('音频播放失败:', e));
          }
        } catch (e) {
          console.error('播放音频时出错:', e);
        }
      };
      
      // 设置第一个路径开始尝试
      audio.src = soundPaths[0];
      console.log('尝试第一个路径:', soundPaths[0]);
      
      // 确保音频有足够的音量
      audio.volume = 1.0;
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