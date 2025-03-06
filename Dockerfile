# 使用Node.js官方镜像作为基础镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和锁文件
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci

# 复制项目文件
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 5173

# 启动命令
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"] 