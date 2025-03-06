import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'

// 导入样式
import '@nutui/nutui/dist/style.css'
// 移除不存在的样式导入

// 导入NutUI组件
import {
  Button,
  Navbar,
  Tabbar,
  TabbarItem,
  Cell,
  CellGroup,
  Dialog,
  Toast,
  Empty,
  Swipe,
  Grid,
  GridItem,
  Switch,
  Progress
} from '@nutui/nutui'

// 导入Iconify图标组件
import { Icon } from '@iconify/vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// 注册NutUI组件
app.use(Button)
app.use(Cell)
app.use(CellGroup)
app.use(Dialog)
app.use(Empty)
app.use(Grid)
app.use(GridItem)
app.use(Navbar)
app.use(Progress)
app.use(Swipe)
app.use(Switch)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Toast)

// 注册Iconify图标组件
app.component('Icon', Icon)

app.mount('#app')
