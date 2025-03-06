<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { showToast } from '@nutui/nutui'

const settingsStore = useSettingsStore()

// 临时存储设置，确认后再应用
const tempSettings = ref({
  soundEnabled: settingsStore.soundEnabled,
  vibrationEnabled: settingsStore.vibrationEnabled,
  exerciseTime: settingsStore.defaultSettings.exerciseTime,
  restTime: settingsStore.defaultSettings.restTime,
  themeColor: settingsStore.themeColor,
  isDarkMode: settingsStore.isDarkMode
})

// 颜色选项
const colorOptions = [
  { name: '蓝色', value: '#1989fa' },
  { name: '绿色', value: '#07c160' },
  { name: '红色', value: '#ee0a24' },
  { name: '橙色', value: '#ff9800' },
  { name: '紫色', value: '#8a2be2' }
]

// 保存设置
function saveSettings() {
  // 更新设置
  settingsStore.soundEnabled = tempSettings.value.soundEnabled
  settingsStore.vibrationEnabled = tempSettings.value.vibrationEnabled
  settingsStore.defaultSettings.exerciseTime = tempSettings.value.exerciseTime
  settingsStore.defaultSettings.restTime = tempSettings.value.restTime
  settingsStore.themeColor = tempSettings.value.themeColor
  settingsStore.isDarkMode = tempSettings.value.isDarkMode
  
  // 应用主题
  settingsStore.applyTheme()
  
  // 保存到本地存储
  settingsStore.saveSettings()
  
  showToast.success('设置已保存')
}

// 测试声音
function testSound() {
  if (!tempSettings.value.soundEnabled) {
    showToast.text('请先开启声音')
    return
  }
  
  settingsStore.playSound('rest-end' as any)
}

// 测试震动
function testVibration() {
  if (!tempSettings.value.vibrationEnabled) {
    showToast.text('请先开启震动')
    return
  }
  
  settingsStore.vibrate([100, 50, 100])
}

// 重置为默认设置
function resetDefaults() {
  tempSettings.value = {
    soundEnabled: true,
    vibrationEnabled: true,
    exerciseTime: 40,
    restTime: 30,
    themeColor: '#1989fa',
    isDarkMode: false
  }
  
  showToast.text('已重置为默认设置，请点击保存以应用')
}
</script>

<template>
  <div class="settings-container">
    <!-- <nut-cell-group title="训练计时设置">
      <nut-cell title="默认训练时间(秒)">
        <input
          v-model.number="tempSettings.exerciseTime"
          type="number"
          min="5"
          max="300"
          class="nut-input"
        />
      </nut-cell>
      
      <nut-cell title="默认休息时间(秒)">
        <input
          v-model.number="tempSettings.restTime"
          type="number"
          min="5"
          max="300"
          class="nut-input"
        />
      </nut-cell>
    </nut-cell-group> -->
    
    <nut-cell-group title="通知设置">
      <nut-cell title="声音提醒">
        <nut-switch v-model="tempSettings.soundEnabled" />
        声音提醒
      </nut-cell>
      
      <nut-cell title="震动提醒">
        <nut-switch v-model="tempSettings.vibrationEnabled" />
        震动提醒
      </nut-cell>
      
      <nut-cell>
        <div class="test-buttons">
          <nut-button 
            type="primary" 
            size="small"
            @click="testSound"
          >
            测试声音
          </nut-button>
          
          <nut-button 
            type="primary" 
            size="small"
            @click="testVibration"
          >
            测试震动
          </nut-button>
        </div>
      </nut-cell>
    </nut-cell-group>
    
    <nut-cell-group title="界面设置">
      <nut-cell title="主题颜色">
        <div class="color-options">
          <div
            v-for="color in colorOptions"
            :key="color.value"
            class="color-option"
            :style="{ backgroundColor: color.value }"
            :class="{ active: tempSettings.themeColor === color.value }"
            @click="tempSettings.themeColor = color.value"
          ></div>
        </div>
      </nut-cell>
<!--       
      <nut-cell title="深色模式">
        <nut-switch v-model="tempSettings.isDarkMode" />
        深色模式
      </nut-cell> -->
    </nut-cell-group>
    
    <div class="action-buttons">
      <nut-button 
        type="primary"
        block
        @click="saveSettings"
        class="save-button"
      >
        保存设置
      </nut-button>
      
      <nut-button 
        type="default"
        block
        @click="resetDefaults"
      >
        重置为默认
      </nut-button>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  padding: 16px;
  background-color: #f5f5f5;
}

.nut-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 14px;
}

.test-buttons {
  display: flex;
  gap: 10px;
}

.color-options {
  display: flex;
  gap: 10px;
}

.color-option {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
}

.color-option.active {
  transform: scale(1.2);
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px var(--nutui-brand-color);
}

.action-buttons {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.save-button {
  margin-bottom: 10px;
}
</style> 