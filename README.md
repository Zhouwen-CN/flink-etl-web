<div align="center">
  <img alt="logo" width="120" height="120" src="./src/common/assets/images/layouts/logo.png">
  <h1>Flink ETL Web</h1>
</div>

## 简介

Flink ETL Web 是 [Flink ETL API](https://gitee.com/Zhouwen-CN/flink-etl-api) 的前端项目

基于 [V3 Admin Vite](https://github.com/un-pany/v3-admin-vite) 模板开发，主要用于 ETL 任务的管理与调度。

## 技术栈

| 类别         | 技术                                          |
| ------------ | --------------------------------------------- |
| 框架         | Vue 3.5+ (Composition API + `<script setup>`) |
| 构建工具     | Vite 7                                        |
| 开发语言     | TypeScript                                    |
| UI 组件库    | Element Plus                                  |
| 状态管理     | Pinia                                         |
| 路由管理     | Vue Router                                    |
| CSS 预处理器 | Scss                                          |
| 网络请求     | Axios                                         |
| 代码规范     | ESLint                                        |
| 包管理器     | pnpm                                          |

## 功能模块

- **权限管理**：用户管理、角色管理、权限管理（页面级动态路由 + 按钮级权限控制）
- **ETL 管理**：Flink 集群管理、Jar 包管理、ETL 任务管理、任务实例管理（运行、停止、检查点恢复等）
- **日志管理**：登录日志、异常日志
- **系统工具**：字典管理、定时任务
- **基础功能**：登录验证码、多主题（普通/黑暗/深蓝）、多布局（左侧/顶部/混合）、标签页导航、全屏、动态侧边栏、动态面包屑

## 使用

### 环境要求

- Node.js 20.19+ 或 22.12+
- pnpm 10+

### 本地开发

```bash
# 安装依赖
pnpm i

# 启动开发服务
pnpm dev
```

### 打包构建

```bash
# 生产环境
pnpm build

# 预发布环境
pnpm build:staging
```

### 代码检查

```bash
# 代码校验与格式化
pnpm lint
```

## 致谢

本项目基于 [V3 Admin Vite](https://github.com/un-pany/v3-admin-vite) 开发，感谢原作者 [pany](https://github.com/pany-ang) 提供的优秀模板。

## License

[MIT](./LICENSE)
