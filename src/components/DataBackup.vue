<script setup lang="ts">
import { ref } from 'vue'
import { useWorkoutStore } from '../stores/workout'
import { showToast } from '@nutui/nutui'

const workoutStore = useWorkoutStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)

// 导出数据
function exportData() {
  try {
    workoutStore.exportData()
    showToast.success('数据导出成功')
  } catch (error) {
    console.error('导出数据失败:', error)
    showToast.fail('导出失败，请重试')
  }
}

// 触发文件选择
function triggerFileSelect() {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

// 导入数据
function importFile(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) {
    return
  }
  
  isImporting.value = true
  const file = target.files[0]
  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const result = e.target?.result
      if (typeof result === 'string') {
        const success = workoutStore.importData(result)
        if (success) {
          showToast.success('数据导入成功')
        } else {
          showToast.fail('导入失败，数据格式不正确')
        }
      }
    } catch (error) {
      console.error('导入数据失败:', error)
      showToast.fail('导入失败，请检查文件格式')
    } finally {
      isImporting.value = false
      // 重置文件输入
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
  }
  
  reader.onerror = () => {
    showToast.fail('读取文件失败')
    isImporting.value = false
  }
  
  reader.readAsText(file)
}

// 清除所有数据
function clearAllData() {
  workoutStore.workoutPlans.length = 0
  workoutStore.cyclePlans.length = 0
  workoutStore.workoutRecords.length = 0
  workoutStore.saveToLocalStorage()
  showToast.success('所有数据已清除')
}
</script>

<template>
  <div class="data-backup">
    <nut-cell-group title="数据备份与恢复">
      <nut-cell title="导出数据" desc="将所有训练计划和记录导出为JSON文件">
        <template #link>
          <nut-button 
            type="primary" 
            size="small"
            @click="exportData"
          >
            导出
          </nut-button>
        </template>
      </nut-cell>
      
      <nut-cell title="导入数据" desc="从JSON文件导入训练计划和记录">
        <template #link>
          <input 
            ref="fileInput" 
            type="file" 
            accept=".json" 
            style="display: none" 
            @change="importFile"
          />
          <nut-button 
            type="primary" 
            size="small"
            @click="triggerFileSelect"
            :loading="isImporting"
          >
            导入
          </nut-button>
        </template>
      </nut-cell>
    </nut-cell-group>
    
    <nut-cell-group title="危险操作">
      <nut-cell title="清除所有数据" desc="此操作不可恢复，请谨慎操作！">
        <template #link>
          <nut-button 
            type="danger" 
            size="small"
            @click="clearAllData"
          >
            清除
          </nut-button>
        </template>
      </nut-cell>
    </nut-cell-group>
    
    <div class="backup-info">
      <p>数据说明：</p>
      <ul>
        <li>所有数据都保存在您的设备上</li>
        <li>为防止数据丢失，建议定期导出备份</li>
        <li>导入数据会覆盖当前所有数据</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.data-backup {
  padding: 16px;
  background-color: #f5f5f5;
}

.backup-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}

.backup-info p {
  margin: 0 0 8px 0;
  font-weight: bold;
}

.backup-info ul {
  margin: 0;
  padding-left: 20px;
}

.backup-info li {
  margin-bottom: 5px;
}
</style> 