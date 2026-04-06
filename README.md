# rd-fund-guardian-frontend

研发费用合规智能管理系统前端项目。

本项目基于 `React + TypeScript + Vite + Tailwind CSS + React Router`，已经完成与后端第一版核心接口的联调，适合作为测试版前端使用。

## 技术栈

- `React 18`
- `TypeScript`
- `Vite 6`
- `Tailwind CSS 4`
- `React Router 7`
- `Radix UI`
- `Material UI`
- `Recharts`
- `Lucide React`

## 主要页面

- 登录页
- 首页概览
- 人员管理
- 设备管理
- 打卡记录导入
- 项目列表
- 创建项目
- 月度汇总
- 待结算项目
- 操作日志
- 账号管理

## 当前能力

- 已接入后端真实接口的主流程页面
- 支持登录、退出、未登录跳转
- 支持项目、员工、设备、账号等基础管理
- 支持月度费用维护、凭证上传、待结算闭环
- 支持打卡模板下载、导入预览、确认导入
- 支持首页与项目列表基础可视化
- 登录页已接入品牌 Logo 和插画

## 项目结构

```text
src/
├─ app/
│  ├─ api/             接口请求层
│  ├─ assets/          图片与品牌资源
│  ├─ components/      通用组件与布局
│  └─ pages/           页面组件
├─ imports/            Figma / SVG 导入资源
├─ styles/             全局样式
└─ main.tsx            应用入口
```

## 本地运行

### 1. 安装依赖

使用 `npm`：

```powershell
npm install
```

或使用 `pnpm`：

```powershell
pnpm install
```

### 2. 环境变量

参考 [\.env.example](C:/Users/dell/Desktop/RDCM/rd-fund-guardian/rd-fund-guardian-frontend/.env.example)：

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_API_DEV_USERNAME=user1
VITE_API_DEV_PASSWORD=123456
```

当前前端真正使用的是：

- `VITE_API_BASE_URL`

后两个开发账号变量目前可以保留，但不是主流程必需项。

### 3. 启动开发环境

```powershell
npm run dev
```

默认访问地址：

- 前端：`http://localhost:5173`

### 4. 构建生产包

```powershell
npm run build
```

## 接口联调说明

默认通过环境变量访问后端：

```env
VITE_API_BASE_URL=http://localhost:8080
```

常见联调前提：

- 后端已启动在 `8080`
- 后端已允许 `http://localhost:5173` 跨域
- 登录成功后会自动保存 token
- token 失效会自动清理并跳转回登录页

## 视觉说明

这一版前端已经做了第一轮视觉整理：

- 首页增加了趋势图和状态分布图
- 项目列表增加了概览卡片和趋势图
- 月度汇总增加了费用结构图
- 登录页增加了品牌 Logo 和插画

整体风格保持：

- 浅色背景
- 卡片式布局
- 低饱和强调色
- 偏商务、偏管理系统的视觉方向

## 适用阶段

当前版本适合：

- 内部联调测试
- 小伙伴试用
- 老师演示
- 甲方前的第一版确认

如果后面进入第二轮迭代，建议继续补：

- 更多数据可视化
- 页面文案统一
- 细节交互和异常提示优化
