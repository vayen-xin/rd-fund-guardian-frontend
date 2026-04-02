import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router";

// ─── Types ────────────────────────────────────────────────────────────────────
type ProjectStatus = "进行中" | "已结束" | "已结算";

type Employee = {
  employeeId: string;
  name: string;
  type: string;
  linkedAt: string;
};

type Device = {
  deviceId: string;
  name: string;
  depreciationRate: number;
  linkedAt: string;
};

type LogType = "创建" | "结束" | "结算";

type LogEntry = {
  time: string;
  operator: string;
  type: LogType;
  details: Record<string, string>;
};

type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string | null;
  status: ProjectStatus;
  createdAt: string;
  createdBy: string;
  settlementAmount?: number;
  employees: Employee[];
  devices: Device[];
  logs: LogEntry[];
};

// ─── Constants ────────────────────────────────────────────────────────────────
const TODAY = "2026-03-01";
const PAGE_SIZE = 5;

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockProjects: Project[] = [
  {
    id: "p1", name: "智能客服系统",
    description: "新一代 AI 驱动的智能客服平台研发，集成自然语言处理与知识图谱技术，支持多渠道接入。",
    startDate: "2026-01-10", endDate: "2026-02-15", status: "已结算",
    createdAt: "2026-01-05 14:30", createdBy: "张伟", settlementAmount: 128500,
    employees: [
      { employeeId: "EMP001", name: "张伟", type: "正式员工", linkedAt: "2026-01-05 14:30" },
      { employeeId: "EMP002", name: "李娜", type: "正式员工", linkedAt: "2026-01-05 14:30" },
      { employeeId: "EMP003", name: "王芳", type: "兼职员工", linkedAt: "2026-01-08 09:00" },
    ],
    devices: [
      { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, linkedAt: "2026-01-05 14:30" },
      { deviceId: "SM002", name: "缝纫机 B", depreciationRate: 28, linkedAt: "2026-01-05 14:30" },
    ],
    logs: [
      { time: "2026-02-15 16:30", operator: "张伟", type: "结算", details: { "结算总金额": "128,500 元", "上传凭证": "5 个文件" } },
      { time: "2026-02-15 10:20", operator: "李娜", type: "结束", details: { "结束时间": "2026-02-15" } },
      { time: "2026-01-05 14:30", operator: "张伟", type: "创建", details: { "关联员工": "3 人", "关联设备": "2 台" } },
    ],
  },
  {
    id: "p2", name: "数据平台 V2",
    description: "企业级大数据分析平台升级，支持实时流处理与离线批处理双模式，提升数据吞吐量。",
    startDate: "2026-02-01", endDate: null, status: "进行中",
    createdAt: "2026-01-28 09:15", createdBy: "刘洋",
    employees: [
      { employeeId: "EMP001", name: "张伟", type: "正式员工", linkedAt: "2026-01-28 09:15" },
      { employeeId: "EMP004", name: "刘洋", type: "正式员工", linkedAt: "2026-01-28 09:15" },
      { employeeId: "EMP005", name: "陈静", type: "正式员工", linkedAt: "2026-01-28 09:15" },
      { employeeId: "EMP007", name: "孙丽", type: "外包人员", linkedAt: "2026-02-03 10:00" },
      { employeeId: "EMP008", name: "周强", type: "外包人员", linkedAt: "2026-02-03 10:00" },
    ],
    devices: [
      { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, linkedAt: "2026-01-28 09:15" },
      { deviceId: "SM004", name: "打包机 D", depreciationRate: 22, linkedAt: "2026-01-28 09:15" },
      { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, linkedAt: "2026-02-01 08:00" },
    ],
    logs: [
      { time: "2026-01-28 09:15", operator: "刘洋", type: "创建", details: { "关联员工": "3 人", "关联设备": "2 台" } },
    ],
  },
  {
    id: "p3", name: "AI 算法研发",
    description: "面向工业检测场景的深度学习算法研发，包含图像识别、缺陷检测和质量预测三个子模块。",
    startDate: "2026-02-10", endDate: "2026-02-28", status: "已结束",
    createdAt: "2026-02-05 11:00", createdBy: "陈静",
    employees: [
      { employeeId: "EMP005", name: "陈静", type: "正式员工", linkedAt: "2026-02-05 11:00" },
      { employeeId: "EMP002", name: "李娜", type: "正式员工", linkedAt: "2026-02-05 11:00" },
    ],
    devices: [
      { deviceId: "SM006", name: "打标机 F", depreciationRate: 31, linkedAt: "2026-02-05 11:00" },
    ],
    logs: [
      { time: "2026-02-28 17:00", operator: "陈静", type: "结束", details: { "结束时间": "2026-02-28" } },
      { time: "2026-02-05 11:00", operator: "陈静", type: "创建", details: { "关联员工": "2 人", "关联设备": "1 台" } },
    ],
  },
  {
    id: "p4", name: "自动化测试框架",
    description: "构建覆盖单元、集成、端到端的全链路自动化测试平台，支持 CI/CD 流水线集成。",
    startDate: "2025-11-01", endDate: "2025-12-31", status: "已结算",
    createdAt: "2025-10-25 10:00", createdBy: "王芳", settlementAmount: 56000,
    employees: [
      { employeeId: "EMP003", name: "王芳", type: "正式员工", linkedAt: "2025-10-25 10:00" },
      { employeeId: "EMP006", name: "赵磊", type: "正式员工", linkedAt: "2025-10-25 10:00" },
    ],
    devices: [
      { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, linkedAt: "2025-10-25 10:00" },
      { deviceId: "SM002", name: "缝纫机 B", depreciationRate: 28, linkedAt: "2025-10-30 09:00" },
    ],
    logs: [
      { time: "2025-12-31 18:00", operator: "王芳", type: "结算", details: { "结算总金额": "56,000 元", "上传凭证": "3 个文件" } },
      { time: "2025-12-31 15:30", operator: "赵磊", type: "结束", details: { "结束时间": "2025-12-31" } },
      { time: "2025-10-25 10:00", operator: "王芳", type: "创建", details: { "关联员工": "2 人", "关联设备": "2 台" } },
    ],
  },
  {
    id: "p5", name: "供应链优化",
    description: "利用运筹学与机器学习方法对供应链库存、物流路径及供应商管理进行全面优化。",
    startDate: "2026-01-15", endDate: null, status: "进行中",
    createdAt: "2026-01-10 16:00", createdBy: "刘洋",
    employees: [
      { employeeId: "EMP004", name: "刘洋", type: "正式员工", linkedAt: "2026-01-10 16:00" },
      { employeeId: "EMP001", name: "张伟", type: "正式员工", linkedAt: "2026-01-10 16:00" },
      { employeeId: "EMP007", name: "孙丽", type: "外包人员", linkedAt: "2026-01-15 09:00" },
      { employeeId: "EMP008", name: "周强", type: "外包人员", linkedAt: "2026-01-15 09:00" },
    ],
    devices: [
      { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, linkedAt: "2026-01-10 16:00" },
      { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, linkedAt: "2026-01-15 09:00" },
    ],
    logs: [
      { time: "2026-01-10 16:00", operator: "刘洋", type: "创建", details: { "关联员工": "2 人", "关联设备": "1 台" } },
    ],
  },
  {
    id: "p6", name: "ERP 系统升级",
    description: "对现有 ERP 系统进行全面升级改造，新增财务、采购、生产排程等核心模块。",
    startDate: "2025-09-01", endDate: "2025-12-15", status: "已结算",
    createdAt: "2025-08-20 09:30", createdBy: "张伟", settlementAmount: 215000,
    employees: [
      { employeeId: "EMP001", name: "张伟", type: "正式员工", linkedAt: "2025-08-20 09:30" },
      { employeeId: "EMP002", name: "李娜", type: "正式员工", linkedAt: "2025-08-20 09:30" },
      { employeeId: "EMP003", name: "王芳", type: "正式员工", linkedAt: "2025-08-20 09:30" },
      { employeeId: "EMP004", name: "刘洋", type: "正式员工", linkedAt: "2025-09-01 08:00" },
      { employeeId: "EMP005", name: "陈静", type: "外包人员", linkedAt: "2025-09-01 08:00" },
      { employeeId: "EMP006", name: "赵磊", type: "外包人员", linkedAt: "2025-09-05 08:00" },
    ],
    devices: [
      { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, linkedAt: "2025-08-20 09:30" },
      { deviceId: "SM002", name: "缝纫机 B", depreciationRate: 28, linkedAt: "2025-08-20 09:30" },
      { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, linkedAt: "2025-09-01 08:00" },
      { deviceId: "SM004", name: "打包机 D", depreciationRate: 22, linkedAt: "2025-09-10 08:00" },
    ],
    logs: [
      { time: "2025-12-15 17:30", operator: "张伟", type: "结算", details: { "结算总金额": "215,000 元", "上传凭证": "8 个文件" } },
      { time: "2025-12-15 14:00", operator: "刘洋", type: "结束", details: { "结束时间": "2025-12-15" } },
      { time: "2025-08-20 09:30", operator: "张伟", type: "创建", details: { "关联员工": "4 人", "关联设备": "3 台" } },
    ],
  },
  {
    id: "p7", name: "移动端 App 重构",
    description: "将原生 App 迁移至 React Native 跨平台架构，同步完成 UI 设计系统升级。",
    startDate: "2026-01-20", endDate: "2026-02-25", status: "已结束",
    createdAt: "2026-01-15 13:00", createdBy: "李娜",
    employees: [
      { employeeId: "EMP002", name: "李娜", type: "正式员工", linkedAt: "2026-01-15 13:00" },
      { employeeId: "EMP005", name: "陈静", type: "正式员工", linkedAt: "2026-01-15 13:00" },
      { employeeId: "EMP007", name: "孙丽", type: "外包人员", linkedAt: "2026-01-20 09:00" },
    ],
    devices: [
      { deviceId: "SM004", name: "打包机 D", depreciationRate: 22, linkedAt: "2026-01-15 13:00" },
    ],
    logs: [
      { time: "2026-02-25 16:00", operator: "李娜", type: "结束", details: { "结束时间": "2026-02-25" } },
      { time: "2026-01-15 13:00", operator: "李娜", type: "创建", details: { "关联员工": "2 人", "关联设备": "1 台" } },
    ],
  },
  {
    id: "p8", name: "数据仓库建设",
    description: "建设统一的企业级数据仓库，规范数据分层架构（ODS/DWD/DWS/ADS），实现数据资产化。",
    startDate: "2025-10-01", endDate: "2025-11-30", status: "已结算",
    createdAt: "2025-09-22 10:00", createdBy: "陈静", settlementAmount: 98000,
    employees: [
      { employeeId: "EMP005", name: "陈静", type: "正式员工", linkedAt: "2025-09-22 10:00" },
      { employeeId: "EMP003", name: "王芳", type: "正式员工", linkedAt: "2025-09-22 10:00" },
      { employeeId: "EMP006", name: "赵磊", type: "正式员工", linkedAt: "2025-09-22 10:00" },
      { employeeId: "EMP008", name: "周强", type: "外包人员", linkedAt: "2025-10-05 09:00" },
    ],
    devices: [
      { deviceId: "SM002", name: "缝纫机 B", depreciationRate: 28, linkedAt: "2025-09-22 10:00" },
      { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, linkedAt: "2025-09-22 10:00" },
      { deviceId: "SM006", name: "打标机 F", depreciationRate: 31, linkedAt: "2025-10-01 08:00" },
    ],
    logs: [
      { time: "2025-11-30 18:00", operator: "陈静", type: "结算", details: { "结算总金额": "98,000 元", "上传凭证": "4 个文件" } },
      { time: "2025-11-30 15:00", operator: "赵磊", type: "结束", details: { "结束时间": "2025-11-30" } },
      { time: "2025-09-22 10:00", operator: "陈静", type: "创建", details: { "关联员工": "3 人", "关联设备": "2 台" } },
    ],
  },
  {
    id: "p9", name: "产品推荐引擎",
    description: "基于协同过滤与深度学习的个性化推荐系统，支持实时排序与 A/B 实验框架。",
    startDate: "2026-02-15", endDate: null, status: "进行中",
    createdAt: "2026-02-10 14:00", createdBy: "王芳",
    employees: [
      { employeeId: "EMP003", name: "王芳", type: "正式员工", linkedAt: "2026-02-10 14:00" },
      { employeeId: "EMP004", name: "刘洋", type: "正式员工", linkedAt: "2026-02-10 14:00" },
      { employeeId: "EMP006", name: "赵磊", type: "外包人员", linkedAt: "2026-02-15 09:00" },
    ],
    devices: [
      { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, linkedAt: "2026-02-10 14:00" },
      { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, linkedAt: "2026-02-15 09:00" },
    ],
    logs: [
      { time: "2026-02-10 14:00", operator: "王芳", type: "创建", details: { "关联员工": "2 人", "关联设备": "1 台" } },
    ],
  },
  {
    id: "p10", name: "安全审计系统",
    description: "构建覆盖网络、应用、数据层的全栈安全审计平台，满足等保三级合规要求。",
    startDate: "2026-01-01", endDate: "2026-02-20", status: "已结束",
    createdAt: "2025-12-25 09:00", createdBy: "赵磊",
    employees: [
      { employeeId: "EMP006", name: "赵磊", type: "正式员工", linkedAt: "2025-12-25 09:00" },
      { employeeId: "EMP008", name: "周强", type: "正式员工", linkedAt: "2025-12-25 09:00" },
    ],
    devices: [
      { deviceId: "SM006", name: "打标机 F", depreciationRate: 31, linkedAt: "2025-12-25 09:00" },
    ],
    logs: [
      { time: "2026-02-20 17:00", operator: "赵磊", type: "结束", details: { "结束时间": "2026-02-20" } },
      { time: "2025-12-25 09:00", operator: "赵磊", type: "创建", details: { "关联员工": "2 人", "关联设备": "1 台" } },
    ],
  },
  {
    id: "p11", name: "客户画像平台",
    description: "整合多维度用户行为数据，构建精准客户画像体系，赋能精准营销与个性化运营。",
    startDate: "2025-12-01", endDate: "2026-01-31", status: "已结算",
    createdAt: "2025-11-20 14:30", createdBy: "孙丽", settlementAmount: 175000,
    employees: [
      { employeeId: "EMP007", name: "孙丽", type: "正式员工", linkedAt: "2025-11-20 14:30" },
      { employeeId: "EMP001", name: "张伟", type: "正式员工", linkedAt: "2025-11-20 14:30" },
      { employeeId: "EMP002", name: "李娜", type: "外包人员", linkedAt: "2025-12-01 08:00" },
      { employeeId: "EMP004", name: "刘洋", type: "外包人员", linkedAt: "2025-12-01 08:00" },
      { employeeId: "EMP005", name: "陈静", type: "外包人员", linkedAt: "2025-12-10 09:00" },
    ],
    devices: [
      { deviceId: "SM002", name: "缝纫机 B", depreciationRate: 28, linkedAt: "2025-11-20 14:30" },
      { deviceId: "SM004", name: "打包机 D", depreciationRate: 22, linkedAt: "2025-11-20 14:30" },
      { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, linkedAt: "2025-12-01 08:00" },
    ],
    logs: [
      { time: "2026-01-31 17:30", operator: "孙丽", type: "结算", details: { "结算总金额": "175,000 元", "上传凭证": "6 个文件" } },
      { time: "2026-01-31 14:00", operator: "张伟", type: "结束", details: { "结束时间": "2026-01-31" } },
      { time: "2025-11-20 14:30", operator: "孙丽", type: "创建", details: { "关联员工": "2 人", "关联设备": "2 台" } },
    ],
  },
  {
    id: "p12", name: "智能排班系统",
    description: "基于约束规划与员工偏好的智能排班引擎，支持多班制、多岗位、弹性工时等复杂场景。",
    startDate: "2026-02-20", endDate: null, status: "进行中",
    createdAt: "2026-02-15 10:30", createdBy: "周强",
    employees: [
      { employeeId: "EMP008", name: "周强", type: "正式员工", linkedAt: "2026-02-15 10:30" },
      { employeeId: "EMP003", name: "王芳", type: "外包人员", linkedAt: "2026-02-20 09:00" },
    ],
    devices: [
      { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, linkedAt: "2026-02-15 10:30" },
    ],
    logs: [
      { time: "2026-02-15 10:30", operator: "周强", type: "创建", details: { "关联员工": "1 人", "关联设备": "1 台" } },
    ],
  },
  {
    id: "p13", name: "实时监控大屏",
    description: "工厂生产线实时监控可视化大屏系统，集成 IoT 数据采集、异常预警和 3D 数字孪生展示。",
    startDate: "2026-01-25", endDate: null, status: "进行中",
    createdAt: "2026-01-20 11:00", createdBy: "张伟",
    employees: [
      { employeeId: "EMP001", name: "张伟", type: "正式员工", linkedAt: "2026-01-20 11:00" },
      { employeeId: "EMP005", name: "陈静", type: "正式员工", linkedAt: "2026-01-20 11:00" },
      { employeeId: "EMP006", name: "赵磊", type: "外包人员", linkedAt: "2026-01-25 09:00" },
      { employeeId: "EMP007", name: "孙丽", type: "外包人员", linkedAt: "2026-01-25 09:00" },
    ],
    devices: [
      { deviceId: "SM002", name: "缝纫机 B", depreciationRate: 28, linkedAt: "2026-01-20 11:00" },
      { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, linkedAt: "2026-01-20 11:00" },
      { deviceId: "SM006", name: "打标机 F", depreciationRate: 31, linkedAt: "2026-01-25 09:00" },
    ],
    logs: [
      { time: "2026-01-20 11:00", operator: "张伟", type: "创建", details: { "关联员工": "2 人", "关联设备": "2 台" } },
    ],
  },
  {
    id: "p14", name: "报表自动化",
    description: "打通各业务系统数据孤岛，实现财务、运营、销售等核心报表的全自动生成与分发。",
    startDate: "2026-02-05", endDate: "2026-02-28", status: "已结束",
    createdAt: "2026-01-30 09:00", createdBy: "李娜",
    employees: [
      { employeeId: "EMP002", name: "李娜", type: "正式员工", linkedAt: "2026-01-30 09:00" },
      { employeeId: "EMP004", name: "刘洋", type: "正式员工", linkedAt: "2026-01-30 09:00" },
      { employeeId: "EMP008", name: "周强", type: "外包人员", linkedAt: "2026-02-05 09:00" },
    ],
    devices: [
      { deviceId: "SM004", name: "打包机 D", depreciationRate: 22, linkedAt: "2026-01-30 09:00" },
      { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, linkedAt: "2026-02-05 09:00" },
    ],
    logs: [
      { time: "2026-02-28 17:30", operator: "李娜", type: "结束", details: { "结束时间": "2026-02-28" } },
      { time: "2026-01-30 09:00", operator: "李娜", type: "创建", details: { "关联员工": "2 人", "关联设备": "1 台" } },
    ],
  },
  {
    id: "p15", name: "物联网平台",
    description: "工业物联网平台建设，实现设备接入、边缘计算、云端协同与远程运维的全栈覆盖。",
    startDate: "2026-03-01", endDate: null, status: "进行中",
    createdAt: "2026-02-25 15:00", createdBy: "刘洋",
    employees: [
      { employeeId: "EMP004", name: "刘洋", type: "正式员工", linkedAt: "2026-02-25 15:00" },
      { employeeId: "EMP001", name: "张伟", type: "正式员工", linkedAt: "2026-02-25 15:00" },
      { employeeId: "EMP003", name: "王芳", type: "正式员工", linkedAt: "2026-02-25 15:00" },
      { employeeId: "EMP006", name: "赵磊", type: "外包人员", linkedAt: "2026-03-01 08:00" },
      { employeeId: "EMP007", name: "孙丽", type: "外包人员", linkedAt: "2026-03-01 08:00" },
    ],
    devices: [
      { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, linkedAt: "2026-02-25 15:00" },
      { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, linkedAt: "2026-02-25 15:00" },
      { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, linkedAt: "2026-02-25 15:00" },
      { deviceId: "SM006", name: "打标机 F", depreciationRate: 31, linkedAt: "2026-03-01 08:00" },
    ],
    logs: [
      { time: "2026-02-25 15:00", operator: "刘洋", type: "创建", details: { "关联员工": "3 人", "关联设备": "3 台" } },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function projectOverlaps(p: Project, start: string, end: string): boolean {
  if (!start && !end) return true;
  const pEnd = p.endDate ?? "9999-12-31";
  if (start && end) return p.startDate <= end && pEnd >= start;
  if (start) return pEnd >= start;
  return p.startDate <= end;
}

function formatMoney(n: number): string {
  return n.toLocaleString("zh-CN") + " 元";
}

function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-[32px] h-[32px] rounded-[8px] bg-[#f4f4f4] flex items-center justify-center text-[#6f767e] hover:text-[#272b30] transition-colors">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<ProjectStatus, string> = {
  "进行中": "bg-[#e8f0fe] text-[#3b5bdb]",
  "已结束": "bg-[#fff4e0] text-[#d48806]",
  "已结算": "bg-[#e6f9f0] text-[#0d9f5f]",
};

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex items-center gap-[5px] px-[10px] h-[24px] rounded-[6px] text-[12px] font-semibold ${STATUS_STYLE[status]}`}>
      <span className={`w-[5px] h-[5px] rounded-full ${status === "进行中" ? "bg-[#3b5bdb]" : status === "已结束" ? "bg-[#d48806]" : "bg-[#0d9f5f]"}`} />
      {status}
    </span>
  );
}

// ─── Resource Popover ─────────────────────────────────────────────────────────
function ResourcePopover({ project, onClose }: { project: Project; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute left-0 top-[calc(100%+6px)] z-40 bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.14)] p-[16px] w-[240px] border border-[#f4f4f4]">
      <div className="flex flex-col gap-[12px]">
        <div>
          <p className="text-[#9a9fa5] text-[11px] font-semibold uppercase tracking-wider mb-[8px]">👥 关联员工 ({project.employees.length}人)</p>
          <div className="flex flex-wrap gap-[6px]">
            {project.employees.map((e) => (
              <span key={e.employeeId} className="px-[8px] py-[3px] rounded-[6px] bg-[#f4f4f4] text-[#272b30] text-[12px] font-medium">{e.name}</span>
            ))}
          </div>
        </div>
        <div className="border-t border-[#f4f4f4]" />
        <div>
          <p className="text-[#9a9fa5] text-[11px] font-semibold uppercase tracking-wider mb-[8px]">💻 关联设备 ({project.devices.length}台)</p>
          <div className="flex flex-wrap gap-[6px]">
            {project.devices.map((d) => (
              <span key={d.deviceId} className="px-[8px] py-[3px] rounded-[6px] bg-[#f4f4f4] text-[#272b30] text-[12px] font-medium">{d.name}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute top-[-5px] left-[20px] w-[10px] h-[10px] bg-white border-l border-t border-[#f4f4f4] rotate-45" />
    </div>
  );
}

// ─── End Project Modal ────────────────────────────────────────────────────────
function EndProjectModal({ project, onConfirm, onCancel }: { project: Project; onConfirm: (date: string) => void; onCancel: () => void }) {
  const [endDate, setEndDate] = useState(TODAY);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[420px] p-[32px]">
        <div className="flex items-start gap-[14px] mb-[24px]">
          <div className="w-[44px] h-[44px] rounded-[12px] bg-[#fff4e0] flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="4" y="4" width="14" height="14" rx="2" stroke="#d48806" strokeWidth="1.8" />
              <rect x="7" y="7" width="8" height="8" rx="1" fill="#d48806" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-[#272b30] text-[18px]">结束项目</h3>
            <p className="text-[#6f767e] text-[13px] mt-[4px]">项目：<span className="text-[#272b30] font-semibold">{project.name}</span></p>
          </div>
        </div>
        <div className="flex flex-col gap-[6px] mb-[24px]">
          <label className="text-[#6f767e] text-[13px] font-medium">结束日期</label>
          <input
            type="date"
            value={endDate}
            max={TODAY}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-[44px] px-[14px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[14px] outline-none focus:border-[#272b30] transition-colors"
          />
          <p className="text-[#9a9fa5] text-[12px]">结束日期不可晚于今天（{TODAY}）</p>
        </div>
        <div className="flex gap-[12px]">
          <button onClick={onCancel} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">取消</button>
          <button onClick={() => onConfirm(endDate)} className="flex-1 h-[44px] rounded-[10px] bg-[#d48806] text-white text-[14px] font-semibold hover:bg-[#b87700] transition-colors">确认结束</button>
        </div>
      </div>
    </div>
  );
}

// ─── Settle Confirm Modal ─────────────────────────────────────────────────────
function SettleModal({ project, onConfirm, onCancel }: { project: Project; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[420px] p-[32px]">
        <div className="flex items-start gap-[14px] mb-[20px]">
          <div className="w-[44px] h-[44px] rounded-[12px] bg-[#e6f9f0] flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#0d9f5f" strokeWidth="1.8" />
              <path d="M11 7v1.5M11 14v.5M8.5 10.5c0-1.38.9-2.5 2.5-2.5s2.5 1.12 2.5 2.5c0 1-.6 1.8-1.5 2.2V14" stroke="#0d9f5f" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-[#272b30] text-[18px]">确认发起结算</h3>
            <p className="text-[#6f767e] text-[13px] mt-[4px]">
              项目：<span className="text-[#272b30] font-semibold">{project.name}</span>
            </p>
          </div>
        </div>
        <div className="bg-[#f4f4f4] rounded-[10px] p-[14px] mb-[24px]">
          <p className="text-[#6f767e] text-[13px] leading-[20px]">
            确认后将跳转至「待结算项目」页面，完成结算金额填写与凭证上传。
          </p>
        </div>
        <div className="flex gap-[12px]">
          <button onClick={onCancel} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">取消</button>
          <button onClick={onConfirm} className="flex-1 h-[44px] rounded-[10px] bg-[#0d9f5f] text-white text-[14px] font-semibold hover:bg-[#0b8a52] transition-colors">确认，前往结算</button>
        </div>
      </div>
    </div>
  );
}

// ─── Log Icon ─────────────────────────────────────────────────────────────────
function LogIcon({ type }: { type: LogType }) {
  if (type === "创建") return <span className="text-[16px]">➕</span>;
  if (type === "结束") return <span className="text-[16px]">⏹</span>;
  return <span className="text-[16px]">💰</span>;
}

// ─── Project Detail Modal ─────────────────────────────────────────────────────
function ProjectDetailModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [tab, setTab] = useState<"员工" | "设备">("员工");

  const tabBtn = (label: "员工" | "设备") => (
    <button
      onClick={() => setTab(label)}
      className={`px-[16px] h-[34px] rounded-[8px] text-[13px] font-semibold transition-colors ${tab === label ? "bg-[#272b30] text-white" : "bg-[#f4f4f4] text-[#6f767e] hover:bg-[#efefef]"}`}
    >{label === "员工" ? "👥 员工" : "💻 设备"}</button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[24px]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] shadow-[0_16px_64px_rgba(0,0,0,0.16)] w-full max-w-[800px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-[32px] py-[24px] border-b border-[#f4f4f4] flex-shrink-0">
          <div className="flex items-center gap-[12px]">
            <span className="text-[20px]">🔍</span>
            <div>
              <h3 className="font-semibold text-[#272b30] text-[18px]">项目详情</h3>
              <p className="text-[#9a9fa5] text-[13px]">{project.name}</p>
            </div>
          </div>
          <CloseBtn onClick={onClose} />
        </div>

        <div className="overflow-y-auto flex-1 px-[32px] py-[24px] flex flex-col gap-[28px]">
          {/* 基本信息 */}
          <section>
            <p className="font-semibold text-[#272b30] text-[14px] mb-[14px] flex items-center gap-[8px]">
              <span className="w-[3px] h-[14px] rounded-full bg-[#272b30] block" />
              基本信息
            </p>
            <div className="grid grid-cols-2 gap-[12px]">
              {[
                { label: "项目名称", value: project.name },
                { label: "当前状态", value: <StatusBadge status={project.status} /> },
                { label: "开始时间", value: project.startDate },
                { label: "结束时间", value: project.endDate ?? "—" },
                { label: "创建时间", value: project.createdAt },
                { label: "创建人", value: project.createdBy },
                ...(project.status === "已结算"
                  ? [{ label: "结算金额", value: <span className="text-[#0d9f5f] font-semibold">{formatMoney(project.settlementAmount!)}</span> }]
                  : []),
              ].map((row, i) => (
                <div key={i} className="flex flex-col gap-[3px] bg-[#fafafa] rounded-[10px] p-[12px]">
                  <span className="text-[#9a9fa5] text-[12px]">{row.label}</span>
                  <span className="text-[#272b30] text-[13px] font-medium">{row.value}</span>
                </div>
              ))}
            </div>
            {/* 描述 */}
            <div className="mt-[12px] bg-[#fafafa] rounded-[10px] p-[12px]">
              <span className="text-[#9a9fa5] text-[12px] block mb-[4px]">项目描述</span>
              <p className="text-[#272b30] text-[13px] leading-[20px]">{project.description}</p>
            </div>
          </section>

          {/* 关联资源 */}
          <section>
            <div className="flex items-center justify-between mb-[14px]">
              <p className="font-semibold text-[#272b30] text-[14px] flex items-center gap-[8px]">
                <span className="w-[3px] h-[14px] rounded-full bg-[#272b30] block" />
                关联资源
              </p>
              <div className="flex gap-[6px]">{tabBtn("员工")}{tabBtn("设备")}</div>
            </div>
            <div className="overflow-x-auto rounded-[12px] border border-[#f4f4f4]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f4f4f4]">
                    {tab === "员工"
                      ? ["序号", "姓名", "工号", "员工类型", "关联时间"].map(h => (
                        <th key={h} className="text-left px-[14px] py-[10px] text-[#6f767e] text-[12px] font-semibold whitespace-nowrap">{h}</th>
                      ))
                      : ["序号", "设备名称", "设备编号", "折旧单价", "关联时间"].map(h => (
                        <th key={h} className="text-left px-[14px] py-[10px] text-[#6f767e] text-[12px] font-semibold whitespace-nowrap">{h}</th>
                      ))
                    }
                  </tr>
                </thead>
                <tbody>
                  {tab === "员工"
                    ? project.employees.map((e, i) => (
                      <tr key={e.employeeId} className="border-t border-[#f4f4f4] hover:bg-[#fafafa] transition-colors">
                        <td className="px-[14px] py-[12px] text-[#9a9fa5] text-[13px]">{i + 1}</td>
                        <td className="px-[14px] py-[12px] text-[#272b30] text-[13px] font-semibold">{e.name}</td>
                        <td className="px-[14px] py-[12px] text-[#6f767e] text-[13px] font-mono">{e.employeeId}</td>
                        <td className="px-[14px] py-[12px]">
                          <span className="px-[8px] py-[2px] rounded-[5px] bg-[#f4f4f4] text-[#6f767e] text-[12px] font-medium">{e.type}</span>
                        </td>
                        <td className="px-[14px] py-[12px] text-[#9a9fa5] text-[12px]">{e.linkedAt}</td>
                      </tr>
                    ))
                    : project.devices.map((d, i) => (
                      <tr key={d.deviceId} className="border-t border-[#f4f4f4] hover:bg-[#fafafa] transition-colors">
                        <td className="px-[14px] py-[12px] text-[#9a9fa5] text-[13px]">{i + 1}</td>
                        <td className="px-[14px] py-[12px] text-[#272b30] text-[13px] font-semibold">{d.name}</td>
                        <td className="px-[14px] py-[12px] text-[#6f767e] text-[13px] font-mono">{d.deviceId}</td>
                        <td className="px-[14px] py-[12px] text-[#272b30] text-[13px]">¥{d.depreciationRate}/h</td>
                        <td className="px-[14px] py-[12px] text-[#9a9fa5] text-[12px]">{d.linkedAt}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </section>

          {/* 操作记录 */}
          <section>
            <p className="font-semibold text-[#272b30] text-[14px] mb-[16px] flex items-center gap-[8px]">
              <span className="w-[3px] h-[14px] rounded-full bg-[#272b30] block" />
              项目操作记录
            </p>
            <div className="flex flex-col gap-0">
              {project.logs.map((log, i) => (
                <div key={i} className="flex gap-[14px]">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className="w-[32px] h-[32px] rounded-full bg-[#f4f4f4] flex items-center justify-center flex-shrink-0">
                      <LogIcon type={log.type} />
                    </div>
                    {i < project.logs.length - 1 && (
                      <div className="w-[2px] flex-1 bg-[#f4f4f4] my-[6px] min-h-[20px]" />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`flex-1 ${i < project.logs.length - 1 ? "pb-[16px]" : ""}`}>
                    <div className="flex items-center gap-[8px] mb-[8px]">
                      <span className="text-[#272b30] text-[13px] font-semibold">{log.time}</span>
                      <span className="text-[#9a9fa5] text-[12px]">·</span>
                      <div className="flex items-center gap-[5px]">
                        <div className="w-[18px] h-[18px] rounded-full bg-[#272b30] flex items-center justify-center text-white text-[10px] font-semibold">
                          {log.operator.slice(-1)}
                        </div>
                        <span className="text-[#6f767e] text-[12px] font-semibold">{log.operator}</span>
                      </div>
                    </div>
                    <div className="bg-[#fafafa] rounded-[10px] p-[12px]">
                      <p className="text-[#272b30] text-[13px] font-semibold mb-[6px]">
                        项目{log.type}
                      </p>
                      {Object.entries(log.details).map(([k, v]) => (
                        <p key={k} className="text-[#6f767e] text-[12px] leading-[20px]">
                          • {k}：<span className="text-[#272b30]">{v}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-[32px] py-[20px] border-t border-[#f4f4f4] flex-shrink-0">
          <button onClick={onClose} className="w-full h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#272b30] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">关闭</button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  const btnBase = "w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-[13px] font-semibold transition-colors";

  return (
    <div className="flex items-center justify-between px-[24px] py-[16px] border-t border-[#f4f4f4]">
      <p className="text-[#9a9fa5] text-[13px]">
        共 <span className="text-[#272b30] font-semibold">{total}</span> 个项目 · 第 {page} / {totalPages} 页
      </p>
      <div className="flex items-center gap-[4px]">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className={`${btnBase} border border-[#efefef] bg-white text-[#6f767e] hover:bg-[#f4f4f4] disabled:opacity-40 disabled:cursor-not-allowed`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 10.5L5.5 7 9 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {pages.map((p, i) =>
          p === "..." ? <span key={`d${i}`} className="w-[32px] flex justify-center text-[#9a9fa5] text-[13px]">…</span> :
          <button key={p} onClick={() => onPage(p as number)}
            className={`${btnBase} ${p === page ? "bg-[#272b30] text-white" : "border border-[#efefef] bg-white text-[#6f767e] hover:bg-[#f4f4f4]"}`}
          >{p}</button>
        )}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}
          className={`${btnBase} border border-[#efefef] bg-white text-[#6f767e] hover:bg-[#f4f4f4] disabled:opacity-40 disabled:cursor-not-allowed`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3.5L8.5 7 5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main Functional View ─────────────────────────────────────────────────────
function ProjectListMain() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"全部" | ProjectStatus>("全部");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [activeStatus, setActiveStatus] = useState<"全部" | ProjectStatus>("全部");
  const [activeDateStart, setActiveDateStart] = useState("");
  const [activeDateEnd, setActiveDateEnd] = useState("");
  const [hasQueried, setHasQueried] = useState(false);
  const [page, setPage] = useState(1);

  // Modal states
  const [resourcePopoverId, setResourcePopoverId] = useState<string | null>(null);
  const [endProjectId, setEndProjectId] = useState<string | null>(null);
  const [settleProjectId, setSettleProjectId] = useState<string | null>(null);
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);

  const handleQuery = () => {
    setActiveStatus(statusFilter);
    setActiveDateStart(dateStart);
    setActiveDateEnd(dateEnd);
    setHasQueried(true);
    setPage(1);
  };

  const handleReset = () => {
    setStatusFilter("全部");
    setDateStart("");
    setDateEnd("");
    setActiveStatus("全部");
    setActiveDateStart("");
    setActiveDateEnd("");
    setHasQueried(false);
    setPage(1);
  };

  const displayStatus = hasQueried ? activeStatus : statusFilter;

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchStatus = displayStatus === "全部" || p.status === displayStatus;
      const matchDate = projectOverlaps(p, hasQueried ? activeDateStart : "", hasQueried ? activeDateEnd : "");
      return matchStatus && matchDate;
    });
  }, [projects, displayStatus, hasQueried, activeDateStart, activeDateEnd]);

  const paged = useMemo(() => {
    const s = (page - 1) * PAGE_SIZE;
    return filtered.slice(s, s + PAGE_SIZE);
  }, [filtered, page]);

  const handleEndProject = (date: string) => {
    if (!endProjectId) return;
    setProjects(prev => prev.map(p =>
      p.id === endProjectId
        ? {
            ...p,
            status: "已结束" as ProjectStatus,
            endDate: date,
            logs: [{ time: `${date} ${new Date().toTimeString().slice(0, 5)}`, operator: "admin", type: "结束" as LogType, details: { "结束时间": date } }, ...p.logs],
          }
        : p
    ));
    setEndProjectId(null);
  };

  const handleSettle = () => {
    if (!settleProjectId) return;
    setProjects(prev => prev.map(p =>
      p.id === settleProjectId ? { ...p, status: "已结算" as ProjectStatus } : p
    ));
    setSettleProjectId(null);
    navigate("/projects/pending-settlement");
  };

  const endProject = endProjectId ? projects.find(p => p.id === endProjectId) : null;
  const settleProject = settleProjectId ? projects.find(p => p.id === settleProjectId) : null;
  const detailProject = detailProjectId ? projects.find(p => p.id === detailProjectId) : null;

  const handleExport = () => {
    const csv = ["序号,项目名称,开始时间,结束时间,状态,关联员工数,关联设备数",
      ...filtered.map((p, i) => `${i + 1},${p.name},${p.startDate},${p.endDate ?? "-"},${p.status},${p.employees.length},${p.devices.length}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "项目列表.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-[24px]">
      {/* ── 操作区 ── */}
      <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-[20px]">
        <div className="flex items-end justify-between flex-wrap gap-[12px]">
          {/* Filters */}
          <div className="flex items-end gap-[12px] flex-wrap">
            <div className="flex flex-col gap-[5px]">
              <label className="text-[#6f767e] text-[12px] font-medium">项目状态</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="h-[40px] pl-[12px] pr-[32px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] font-semibold outline-none appearance-none cursor-pointer hover:border-[#272b30] transition-colors"
                >
                  {(["全部", "进行中", "已结束", "已结算"] as const).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <svg className="absolute right-[10px] top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="#9A9FA5" strokeWidth="1.4" strokeLinecap="round" /></svg>
              </div>
            </div>

            <div className="flex flex-col gap-[5px]">
              <label className="text-[#6f767e] text-[12px] font-medium">时间范围</label>
              <div className="flex items-center gap-[8px]">
                <input type="date" value={dateStart} max={dateEnd || TODAY}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="h-[40px] px-[10px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
                />
                <span className="text-[#9a9fa5] text-[12px]">至</span>
                <input type="date" value={dateEnd} min={dateStart} max={TODAY}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="h-[40px] px-[10px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
                />
              </div>
            </div>

            <button onClick={handleQuery}
              className="h-[40px] px-[18px] rounded-[10px] bg-[#272b30] text-white text-[13px] font-semibold hover:bg-[#1a1d1f] transition-colors">查询</button>
            {(hasQueried || statusFilter !== "全部" || dateStart || dateEnd) && (
              <button onClick={handleReset}
                className="h-[40px] px-[14px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors">重置</button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-[10px]">
            <button onClick={handleExport}
              className="flex items-center gap-[7px] h-[40px] px-[14px] rounded-[10px] border border-[#efefef] bg-white text-[#272b30] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10M5.333 6.667L8 9.333l2.667-2.666M8 9.333V2" stroke="#272B30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              导出列表
            </button>
            <button onClick={() => navigate("/projects/create")}
              className="flex items-center gap-[7px] h-[40px] px-[14px] rounded-[10px] bg-[#272b30] text-white text-[13px] font-semibold hover:bg-[#1a1d1f] transition-colors">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
              创建项目
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f4f4f4]">
                {["序号", "项目名称", "开始时间", "结束时间", "状态", "关联资源", "操作"].map(h => (
                  <th key={h} className="text-left px-[20px] py-[13px] text-[#6f767e] text-[12px] font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((project, i) => {
                const globalIdx = (page - 1) * PAGE_SIZE + i + 1;
                return (
                  <tr key={project.id} className="border-b border-[#f4f4f4] last:border-b-0 hover:bg-[#fafafa] transition-colors">
                    {/* 序号 */}
                    <td className="px-[20px] py-[16px] text-[#9a9fa5] text-[13px] w-[60px]">{globalIdx}</td>

                    {/* 项目名称 */}
                    <td className="px-[20px] py-[16px]">
                      <span className="text-[#272b30] text-[13px] font-semibold">{project.name}</span>
                    </td>

                    {/* 开始时间 */}
                    <td className="px-[20px] py-[16px] text-[#6f767e] text-[13px] whitespace-nowrap">{project.startDate}</td>

                    {/* 结束时间 */}
                    <td className="px-[20px] py-[16px] text-[#6f767e] text-[13px] whitespace-nowrap">
                      {project.endDate ?? <span className="text-[#9a9fa5]">—</span>}
                    </td>

                    {/* 状态 */}
                    <td className="px-[20px] py-[16px]">
                      <StatusBadge status={project.status} />
                    </td>

                    {/* 关联资源 */}
                    <td className="px-[20px] py-[16px]">
                      <div className="relative">
                        <button
                          onClick={() => setResourcePopoverId(prev => prev === project.id ? null : project.id)}
                          className="flex items-center gap-[6px] px-[10px] h-[28px] rounded-[7px] border border-[#efefef] bg-white text-[#272b30] text-[12px] font-semibold hover:bg-[#f4f4f4] transition-colors whitespace-nowrap"
                        >
                          <span className="text-[#6f767e]">{project.employees.length}人</span>
                          <span className="text-[#efefef]">/</span>
                          <span className="text-[#6f767e]">{project.devices.length}设备</span>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="#9A9FA5" strokeWidth="1.4" strokeLinecap="round" /></svg>
                        </button>
                        {resourcePopoverId === project.id && (
                          <ResourcePopover project={project} onClose={() => setResourcePopoverId(null)} />
                        )}
                      </div>
                    </td>

                    {/* 操作 */}
                    <td className="px-[20px] py-[16px]">
                      <div className="flex items-center gap-[8px]">
                        {project.status === "进行中" && (
                          <button
                            onClick={() => setEndProjectId(project.id)}
                            className="px-[10px] h-[30px] rounded-[8px] border border-[#d48806]/30 bg-[#fff4e0] text-[#d48806] text-[12px] font-semibold hover:bg-[#ffe8a0] transition-colors whitespace-nowrap"
                          >结束</button>
                        )}
                        {project.status === "已结束" && (
                          <button
                            onClick={() => setSettleProjectId(project.id)}
                            className="px-[10px] h-[30px] rounded-[8px] border border-[#0d9f5f]/30 bg-[#e6f9f0] text-[#0d9f5f] text-[12px] font-semibold hover:bg-[#c8f0dd] transition-colors whitespace-nowrap"
                          >结算</button>
                        )}
                        <button
                          onClick={() => setDetailProjectId(project.id)}
                          className="px-[10px] h-[30px] rounded-[8px] border border-[#efefef] bg-white text-[#272b30] text-[12px] font-semibold hover:bg-[#f4f4f4] transition-colors whitespace-nowrap"
                        >详情</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr><td colSpan={7} className="text-center py-[56px] text-[#9a9fa5] text-[14px]">暂无符合条件的项目</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={filtered.length} page={page} onPage={setPage} />
      </div>

      {/* ── Modals ── */}
      {endProject && (
        <EndProjectModal project={endProject} onConfirm={handleEndProject} onCancel={() => setEndProjectId(null)} />
      )}
      {settleProject && (
        <SettleModal project={settleProject} onConfirm={handleSettle} onCancel={() => setSettleProjectId(null)} />
      )}
      {detailProject && (
        <ProjectDetailModal project={detailProject} onClose={() => setDetailProjectId(null)} />
      )}
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export function ProjectListPage() {
  return (
    <div className="px-[40px] py-[40px]">
      <div className="flex items-center justify-between mb-[28px]">
        <h1 className="font-semibold text-[32px] text-[#272b30] leading-[40px] tracking-[-0.6px]">项目列表</h1>
      </div>
      <ProjectListMain />
    </div>
  );
}
