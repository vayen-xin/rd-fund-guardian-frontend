import { useState, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const CURRENT_MONTH = "2026-03";
const WORK_HOURS = 176; // 22 working days × 8h
const WORK_DAYS = 22;

const FEE_CATS = [
  { id: "labor",      label: "人员人工费用",           hasSystem: true  },
  { id: "direct",     label: "直接投入费用",            hasSystem: false },
  { id: "deprec",     label: "折旧费用与长期待摊",      hasSystem: true  },
  { id: "intangible", label: "无形资产摊销费用",        hasSystem: false },
  { id: "design",     label: "设计费用",                hasSystem: false },
  { id: "equip",      label: "装备调试与试验费用",      hasSystem: false },
  { id: "outsource",  label: "委托外部研发费用",        hasSystem: false },
  { id: "other",      label: "其他费用",                hasSystem: false },
] as const;

// ─── Preset Items per Category ────────────────────────────────────────────────
const PRESET_ITEMS: Record<string, string[]> = {
  labor: [
    "工资薪金",
    "基本养老保险费",
    "基本医疗保险费",
    "失业保险费",
    "工伤保险费",
    "生育保险费",
    "住房公积金",
    "外聘科技人员劳务费",
  ],
  direct: [
    "材料、燃料和动力费用",
    "模具、工艺装备开发及制造费",
    "不构成固定资产的样品、样机置购费",
    "一般测试手段置购费",
    "试制产品检验费",
    "仪器设备运行维护费",
    "仪器设备调整、检验、检测费",
    "固定资产租赁费（经营租赁）",
  ],
  deprec: [
    "仪器设备折旧费",
    "在用建筑物折旧费",
    "研发设施改建、改装费用",
    "研发设施装修和修理长期待摊费用",
  ],
  intangible: [
    "用于研发活动的软件摊销费",
    "知识产权摊销费",
    "非专利技术摊销费（专有技术）",
    "许可证摊销费",
    "设计和计算方法摊销费",
  ],
  design: [
    "新产品构思、开发和制造设计费",
    "新工艺设计费",
    "工序规范、规程制定费",
    "操作特性方面设计费",
    "技术规范制定费",
  ],
  equip: [
    "研制特殊、专用生产机器费用",
    "改变生产和质量控制程序费用",
    "制定新方法及标准活动费用",
    "新药研制临床试验费",
    "勘探开发技术现场试验费",
    "田间试验费",
  ],
  outsource: [
    "委托境内机构研发费用（按80%计入）",
    "委托境外机构研发费用（按80%计入）",
    "委托个人研发费用（按80%计入）",
  ],
  other: [
    "技术图书资料费",
    "资料翻译费",
    "专家咨询费",
    "高新科技研发保险费",
    "研发成果检索费",
    "研发成果论证、评审、鉴定、验收费",
    "知识产权申请费",
    "知识产权注册费",
    "知识产权代理费",
    "会议费",
    "差旅费",
    "通讯费",
  ],
};

// ─── Types ────────────────────────────────────────────────────────────────────
type EmpType = "正式员工" | "兼职员工";
type MonthlyStatus = "编辑中" | "待结算" | "已结算";

type EmpRec = {
  employeeId: string;
  name: string;
  department: string;
  employeeType: EmpType;
  coefficient: number;
  hourlyRate: number;
};

type DevRec = {
  deviceId: string;
  name: string;
  depreciationRate: number;
  category: string;
  isUsed: boolean;
};

// presetFees: { catId -> { presetLabel -> { amount, vouchers } } }
type PresetFeeEntry = { amount: string; vouchers: string[] };
type PresetFees = Record<string, Record<string, PresetFeeEntry>>;
type SysVouchers = Record<string, string[]>;

type MonthlyRec = {
  yearMonth: string;
  employees: EmpRec[];
  devices: DevRec[];
  presetFees: PresetFees;
  sysVouchers: SysVouchers;
  status: MonthlyStatus;
  settledAt?: string;
};

type ProjectDef = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  createdBy: string;
  allEmployees: Omit<EmpRec, "employeeType" | "coefficient">[];
  allDevices: Omit<DevRec, "isUsed">[];
  monthlyRecords: Record<string, MonthlyRec>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function prevMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}
function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}
function fmtYM(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${Number(m)}月`;
}
function fmtMoney(n: number): string { return n.toLocaleString("zh-CN") + " 元"; }
function genCoeff(t: EmpType): number {
  const [lo, hi] = t === "正式员工" ? [0.60, 0.80] : [0.40, 0.60];
  return Math.round((Math.random() * (hi - lo) + lo) * 100) / 100;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockProjects: ProjectDef[] = [
  {
    id: "p2", name: "数据平台 V2",
    description: "企业级大数据分析平台升级，支持实时流处理与离线批处理双模式，提升数据吞吐量。",
    startDate: "2026-02-01", createdBy: "刘洋",
    allEmployees: [
      { employeeId: "EMP001", name: "张伟", department: "研发部", hourlyRate: 72 },
      { employeeId: "EMP004", name: "刘洋", department: "研发部", hourlyRate: 75 },
      { employeeId: "EMP005", name: "陈静", department: "算法部", hourlyRate: 80 },
      { employeeId: "EMP007", name: "孙丽", department: "外包团队", hourlyRate: 38 },
      { employeeId: "EMP008", name: "周强", department: "运维部", hourlyRate: 65 },
    ],
    allDevices: [
      { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备" },
      { deviceId: "SM004", name: "打包机 D", depreciationRate: 22, category: "包装设备" },
      { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, category: "焊接设备" },
    ],
    monthlyRecords: {
      "2026-02": {
        yearMonth: "2026-02",
        employees: [
          { employeeId: "EMP001", name: "张伟", department: "研发部", employeeType: "正式员工", coefficient: 0.75, hourlyRate: 72 },
          { employeeId: "EMP004", name: "刘洋", department: "研发部", employeeType: "正式员工", coefficient: 0.78, hourlyRate: 75 },
          { employeeId: "EMP005", name: "陈静", department: "算法部", employeeType: "正式员工", coefficient: 0.70, hourlyRate: 80 },
          { employeeId: "EMP007", name: "孙丽", department: "外包团队", employeeType: "兼职员工", coefficient: 0.46, hourlyRate: 38 },
        ],
        devices: [
          { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备", isUsed: true },
          { deviceId: "SM004", name: "打包机 D", depreciationRate: 22, category: "包装设备", isUsed: true },
          { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, category: "焊接设备", isUsed: false },
        ],
        presetFees: {}, sysVouchers: {},
        status: "已结算", settledAt: "2026-03-05 10:30",
      },
      "2026-03": {
        yearMonth: "2026-03",
        employees: [
          { employeeId: "EMP001", name: "张伟", department: "研发部", employeeType: "正式员工", coefficient: 0.75, hourlyRate: 72 },
          { employeeId: "EMP004", name: "刘洋", department: "研发部", employeeType: "正式员工", coefficient: 0.78, hourlyRate: 75 },
          { employeeId: "EMP005", name: "陈静", department: "算法部", employeeType: "兼职员工", coefficient: 0.55, hourlyRate: 80 },
          { employeeId: "EMP007", name: "孙丽", department: "外包团队", employeeType: "兼职员工", coefficient: 0.48, hourlyRate: 38 },
          { employeeId: "EMP008", name: "周强", department: "运维部", employeeType: "正式员工", coefficient: 0.70, hourlyRate: 65 },
        ],
        devices: [
          { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备", isUsed: true },
          { deviceId: "SM004", name: "打包机 D", depreciationRate: 22, category: "包装设备", isUsed: false },
          { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, category: "焊接设备", isUsed: true },
        ],
        presetFees: {}, sysVouchers: {}, status: "编辑中",
      },
    },
  },
  {
    id: "p5", name: "供应链优化",
    description: "利用运筹学与机器学习方法对供应链库存、物流路径及供应商管理进行全面优化。",
    startDate: "2026-01-15", createdBy: "刘洋",
    allEmployees: [
      { employeeId: "EMP004", name: "刘洋", department: "研发部", hourlyRate: 75 },
      { employeeId: "EMP001", name: "张伟", department: "研发部", hourlyRate: 72 },
      { employeeId: "EMP007", name: "孙丽", department: "外包团队", hourlyRate: 38 },
      { employeeId: "EMP008", name: "周强", department: "运维部", hourlyRate: 65 },
    ],
    allDevices: [
      { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备" },
      { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, category: "焊接设备" },
    ],
    monthlyRecords: {
      "2026-02": {
        yearMonth: "2026-02",
        employees: [
          { employeeId: "EMP004", name: "刘洋", department: "研发部", employeeType: "正式员工", coefficient: 0.78, hourlyRate: 75 },
          { employeeId: "EMP001", name: "张伟", department: "研发部", employeeType: "正式员工", coefficient: 0.72, hourlyRate: 72 },
          { employeeId: "EMP007", name: "孙丽", department: "外包团队", employeeType: "兼职员工", coefficient: 0.44, hourlyRate: 38 },
        ],
        devices: [
          { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备", isUsed: true },
          { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, category: "焊接设备", isUsed: true },
        ],
        presetFees: {}, sysVouchers: {},
        status: "已结算", settledAt: "2026-03-03 14:15",
      },
      "2026-03": {
        yearMonth: "2026-03",
        employees: [
          { employeeId: "EMP004", name: "刘洋", department: "研发部", employeeType: "正式员工", coefficient: 0.76, hourlyRate: 75 },
          { employeeId: "EMP001", name: "张伟", department: "研发部", employeeType: "正式员工", coefficient: 0.70, hourlyRate: 72 },
          { employeeId: "EMP007", name: "孙丽", department: "外包团队", employeeType: "兼职员工", coefficient: 0.46, hourlyRate: 38 },
          { employeeId: "EMP008", name: "周强", department: "运维部", employeeType: "正式员工", coefficient: 0.68, hourlyRate: 65 },
        ],
        devices: [
          { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备", isUsed: true },
          { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, category: "焊接设备", isUsed: true },
        ],
        presetFees: { "outsource": { "委托境内机构研发费用（按80%计入）": { amount: "8000", vouchers: ["合同扫描件.pdf"] } } },
        sysVouchers: {}, status: "待结算",
      },
    },
  },
  {
    id: "p9", name: "产品推荐引擎",
    description: "基于协同过滤与深度学习的个性化推荐系统，支持实时排序与 A/B 实验框架。",
    startDate: "2026-02-15", createdBy: "王芳",
    allEmployees: [
      { employeeId: "EMP003", name: "王芳", department: "测试部", hourlyRate: 55 },
      { employeeId: "EMP004", name: "刘洋", department: "研发部", hourlyRate: 75 },
      { employeeId: "EMP006", name: "赵磊", department: "测试部", hourlyRate: 52 },
    ],
    allDevices: [
      { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, category: "成型设备" },
      { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备" },
    ],
    monthlyRecords: {
      "2026-02": {
        yearMonth: "2026-02",
        employees: [
          { employeeId: "EMP003", name: "王芳", department: "测试部", employeeType: "正式员工", coefficient: 0.65, hourlyRate: 55 },
          { employeeId: "EMP004", name: "刘洋", department: "研发部", employeeType: "正式员工", coefficient: 0.74, hourlyRate: 75 },
        ],
        devices: [
          { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, category: "成型设备", isUsed: true },
          { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备", isUsed: false },
        ],
        presetFees: {}, sysVouchers: {}, status: "待结算",
      },
      "2026-03": {
        yearMonth: "2026-03",
        employees: [
          { employeeId: "EMP003", name: "王芳", department: "测试部", employeeType: "正式员工", coefficient: 0.65, hourlyRate: 55 },
          { employeeId: "EMP004", name: "刘洋", department: "研发部", employeeType: "正式员工", coefficient: 0.74, hourlyRate: 75 },
          { employeeId: "EMP006", name: "赵磊", department: "测试部", employeeType: "兼职员工", coefficient: 0.48, hourlyRate: 52 },
        ],
        devices: [
          { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, category: "成型设备", isUsed: true },
          { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备", isUsed: true },
        ],
        presetFees: {}, sysVouchers: {}, status: "编辑中",
      },
    },
  },
  {
    id: "p12", name: "智能排班系统",
    description: "基于约束规划与员工偏好的智能排班引擎，支持多班制、多岗位、弹性工时等复杂场景。",
    startDate: "2026-02-20", createdBy: "周强",
    allEmployees: [
      { employeeId: "EMP008", name: "周强", department: "运维部", hourlyRate: 65 },
      { employeeId: "EMP003", name: "王芳", department: "测试部", hourlyRate: 55 },
    ],
    allDevices: [
      { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, category: "成型设备" },
    ],
    monthlyRecords: {
      "2026-02": {
        yearMonth: "2026-02",
        employees: [
          { employeeId: "EMP008", name: "周强", department: "运维部", employeeType: "正式员工", coefficient: 0.68, hourlyRate: 65 },
          { employeeId: "EMP003", name: "王芳", department: "测试部", employeeType: "兼职员工", coefficient: 0.50, hourlyRate: 55 },
        ],
        devices: [
          { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, category: "成型设备", isUsed: true },
        ],
        presetFees: {}, sysVouchers: {}, status: "已结算", settledAt: "2026-03-08 09:45",
      },
      "2026-03": {
        yearMonth: "2026-03",
        employees: [
          { employeeId: "EMP008", name: "周强", department: "运维部", employeeType: "正式员工", coefficient: 0.68, hourlyRate: 65 },
          { employeeId: "EMP003", name: "王芳", department: "测试部", employeeType: "兼职员工", coefficient: 0.52, hourlyRate: 55 },
        ],
        devices: [
          { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, category: "成型设备", isUsed: true },
        ],
        presetFees: {}, sysVouchers: {}, status: "编辑中",
      },
    },
  },
  {
    id: "p13", name: "实时监控大屏",
    description: "工厂生产线实时监控可视化大屏系统，集成 IoT 数据采集、异常预警和 3D 数字孪生展示。",
    startDate: "2026-01-25", createdBy: "张伟",
    allEmployees: [
      { employeeId: "EMP001", name: "张伟", department: "研发部", hourlyRate: 72 },
      { employeeId: "EMP005", name: "陈静", department: "算法部", hourlyRate: 80 },
      { employeeId: "EMP006", name: "赵磊", department: "测试部", hourlyRate: 52 },
      { employeeId: "EMP007", name: "孙丽", department: "外包团队", hourlyRate: 38 },
    ],
    allDevices: [
      { deviceId: "SM002", name: "缝纫机 B", depreciationRate: 28, category: "缝制设备" },
      { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备" },
      { deviceId: "SM006", name: "打标机 F", depreciationRate: 31, category: "标记设备" },
    ],
    monthlyRecords: {
      "2026-02": {
        yearMonth: "2026-02",
        employees: [
          { employeeId: "EMP001", name: "张伟", department: "研发部", employeeType: "正式员工", coefficient: 0.72, hourlyRate: 72 },
          { employeeId: "EMP005", name: "陈静", department: "算法部", employeeType: "正式员工", coefficient: 0.75, hourlyRate: 80 },
          { employeeId: "EMP006", name: "赵磊", department: "测试部", employeeType: "兼职员工", coefficient: 0.50, hourlyRate: 52 },
          { employeeId: "EMP007", name: "孙丽", department: "外包团队", employeeType: "兼职员工", coefficient: 0.44, hourlyRate: 38 },
        ],
        devices: [
          { deviceId: "SM002", name: "缝纫机 B", depreciationRate: 28, category: "缝制设备", isUsed: true },
          { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备", isUsed: true },
          { deviceId: "SM006", name: "打标机 F", depreciationRate: 31, category: "标记设备", isUsed: false },
        ],
        presetFees: {}, sysVouchers: {},
        status: "已结算", settledAt: "2026-03-06 11:20",
      },
      "2026-03": {
        yearMonth: "2026-03",
        employees: [
          { employeeId: "EMP001", name: "张伟", department: "研发部", employeeType: "正式员工", coefficient: 0.72, hourlyRate: 72 },
          { employeeId: "EMP005", name: "陈静", department: "算法部", employeeType: "正式员工", coefficient: 0.75, hourlyRate: 80 },
          { employeeId: "EMP006", name: "赵磊", department: "测试部", employeeType: "兼职员工", coefficient: 0.50, hourlyRate: 52 },
          { employeeId: "EMP007", name: "孙丽", department: "外包团队", employeeType: "兼职员工", coefficient: 0.44, hourlyRate: 38 },
        ],
        devices: [
          { deviceId: "SM002", name: "缝纫机 B", depreciationRate: 28, category: "缝制设备", isUsed: true },
          { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备", isUsed: true },
          { deviceId: "SM006", name: "打标机 F", depreciationRate: 31, category: "标记设备", isUsed: true },
        ],
        presetFees: {}, sysVouchers: {}, status: "编辑中",
      },
    },
  },
  {
    id: "p15", name: "物联网平台",
    description: "工业物联网平台建设，实现设备接入、边缘计算、云端协同与远程运维的全栈覆盖。",
    startDate: "2026-03-01", createdBy: "刘洋",
    allEmployees: [
      { employeeId: "EMP004", name: "刘洋", department: "研发部", hourlyRate: 75 },
      { employeeId: "EMP001", name: "张伟", department: "研发部", hourlyRate: 72 },
      { employeeId: "EMP003", name: "王芳", department: "测试部", hourlyRate: 55 },
      { employeeId: "EMP006", name: "赵磊", department: "测试部", hourlyRate: 52 },
      { employeeId: "EMP007", name: "孙丽", department: "外包团队", hourlyRate: 38 },
    ],
    allDevices: [
      { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, category: "成型设备" },
      { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备" },
      { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, category: "焊接设备" },
      { deviceId: "SM006", name: "打标机 F", depreciationRate: 31, category: "标记设备" },
    ],
    monthlyRecords: {
      "2026-03": {
        yearMonth: "2026-03",
        employees: [
          { employeeId: "EMP004", name: "刘洋", department: "研发部", employeeType: "正式员工", coefficient: 0.76, hourlyRate: 75 },
          { employeeId: "EMP001", name: "张伟", department: "研发部", employeeType: "正式员工", coefficient: 0.70, hourlyRate: 72 },
          { employeeId: "EMP003", name: "王芳", department: "测试部", employeeType: "正式员工", coefficient: 0.64, hourlyRate: 55 },
          { employeeId: "EMP006", name: "赵磊", department: "测试部", employeeType: "兼职员工", coefficient: 0.50, hourlyRate: 52 },
          { employeeId: "EMP007", name: "孙丽", department: "外包团队", employeeType: "兼职员工", coefficient: 0.44, hourlyRate: 38 },
        ],
        devices: [
          { deviceId: "SM001", name: "冲压机 A", depreciationRate: 45, category: "成型设备", isUsed: true },
          { deviceId: "SM003", name: "裁断机 C", depreciationRate: 36, category: "裁剪设备", isUsed: true },
          { deviceId: "SM005", name: "焊接机 E", depreciationRate: 58, category: "焊接设备", isUsed: false },
          { deviceId: "SM006", name: "打标机 F", depreciationRate: 31, category: "标记设备", isUsed: true },
        ],
        presetFees: {}, sysVouchers: {}, status: "编辑中",
      },
    },
  },
];

// ─── Calculation helpers ───────────────────────────────────────────────────────
function calcLaborTotal(emps: EmpRec[]): number {
  return emps.reduce((s, e) => s + Math.round(WORK_HOURS * e.hourlyRate * e.coefficient), 0);
}
function calcDeprecTotal(devs: DevRec[]): number {
  return devs.filter((d) => d.isUsed).reduce((s, d) => s + Math.round(WORK_DAYS * 8 * d.depreciationRate), 0);
}
function calcPresetTotal(presetFees: PresetFees): number {
  return Object.values(presetFees)
    .flatMap((cat) => Object.values(cat))
    .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
}
function calcGrandTotal(emps: EmpRec[], devs: DevRec[], presetFees: PresetFees): number {
  return calcLaborTotal(emps) + calcDeprecTotal(devs) + calcPresetTotal(presetFees);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<MonthlyStatus, string> = {
  "编辑中": "bg-[#e8f4ff] text-[#1677ff]",
  "待结算": "bg-[#fff4e0] text-[#d48806]",
  "已结算": "bg-[#e6f9f0] text-[#0d9f5f]",
};
function StatusBadge({ status }: { status: MonthlyStatus }) {
  return (
    <span className={`inline-flex items-center gap-[4px] px-[8px] h-[22px] rounded-[6px] text-[11px] font-semibold ${STATUS_STYLE[status]}`}>
      <span className={`w-[4px] h-[4px] rounded-full ${status === "编辑中" ? "bg-[#1677ff]" : status === "待结算" ? "bg-[#d48806]" : "bg-[#0d9f5f]"}`} />
      {status}
    </span>
  );
}

// ─── Voucher Upload Button ────────────────────────────────────────────────────
function VoucherBtn({ vouchers, onAdd }: { vouchers: string[]; onAdd: (names: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" multiple className="hidden"
        onChange={(e) => { const ns = Array.from(e.target.files ?? []).map((f) => f.name); if (ns.length) onAdd(ns); e.target.value = ""; }} />
      <button onClick={() => ref.current?.click()}
        className={`flex items-center gap-[4px] px-[8px] h-[24px] rounded-[5px] text-[11px] font-semibold whitespace-nowrap transition-colors ${vouchers.length > 0 ? "bg-[#e6f9f0] text-[#0d9f5f]" : "bg-[#f4f4f4] text-[#6f767e] hover:bg-[#efefef]"}`}>
        📎 {vouchers.length === 0 ? "上传凭证" : `已上传 ${vouchers.length} 个`}
      </button>
    </>
  );
}

// ─── Submit Confirm Modal ─────────────────────────────────────────────────────
function SubmitConfirmModal({
  projectName, yearMonth, empCount, devCount, total, onConfirm, onCancel,
}: {
  projectName: string; yearMonth: string; empCount: number; devCount: number; total: number;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.16)] w-[420px] p-[32px]">
        <div className="flex items-start gap-[14px] mb-[20px]">
          <div className="w-[44px] h-[44px] rounded-[12px] bg-[#fff4e0] flex items-center justify-center flex-shrink-0">
            <span className="text-[22px]">📊</span>
          </div>
          <div>
            <h3 className="font-semibold text-[#272b30] text-[18px]">确认提交月度结算？</h3>
            <p className="text-[#6f767e] text-[13px] mt-[2px]">{projectName} · {fmtYM(yearMonth)}</p>
          </div>
        </div>
        <div className="bg-[#fafafa] rounded-[10px] p-[14px] mb-[16px] flex flex-col gap-[8px]">
          {[
            { k: "统计月份", v: fmtYM(yearMonth) },
            { k: "本月员工数", v: `${empCount} 人` },
            { k: "使用设备数", v: `${devCount} 台` },
            { k: "预估结算金额", v: <span className="text-[#0d9f5f] font-semibold text-[14px]">¥{total.toLocaleString("zh-CN")}</span> },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between">
              <span className="text-[#9a9fa5] text-[13px]">{r.k}</span>
              <span className="text-[#272b30] text-[13px] font-semibold">{r.v}</span>
            </div>
          ))}
        </div>
        <div className="bg-[#fff4e0] rounded-[10px] px-[12px] py-[9px] mb-[20px]">
          <p className="text-[#d48806] text-[12px]">⚠️ 提交后月度数据进入待结算队列，可在「待结算项目」中查看和最终结算。</p>
        </div>
        <div className="flex gap-[12px]">
          <button onClick={onCancel} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">取消</button>
          <button onClick={onConfirm} className="flex-1 h-[44px] rounded-[10px] bg-[#0d9f5f] text-white text-[14px] font-semibold hover:bg-[#0b8a52] transition-colors">确认提交</button>
        </div>
      </div>
    </div>
  );
}

// ─── Management Modal ─────────────────────────────────────────────────────────
function ManageModal({
  project, yearMonth, rec, isAdmin,
  onClose, onSave, onSubmit,
}: {
  project: ProjectDef; yearMonth: string; rec: MonthlyRec; isAdmin: boolean;
  onClose: () => void;
  onSave: (updated: MonthlyRec) => void;
  onSubmit: (updated: MonthlyRec) => void;
}) {
  const [tab, setTab] = useState<"员工" | "设备" | "费用">("员工");
  const [employees, setEmployees] = useState<EmpRec[]>(() => JSON.parse(JSON.stringify(rec.employees)));
  const [devices, setDevices] = useState<DevRec[]>(() => JSON.parse(JSON.stringify(rec.devices)));
  const [presetFees, setPresetFees] = useState<PresetFees>(() => {
    const saved: PresetFees = JSON.parse(JSON.stringify(rec.presetFees ?? {}));
    const result: PresetFees = {};
    for (const cat of FEE_CATS) {
      result[cat.id] = {};
      for (const label of (PRESET_ITEMS[cat.id] ?? [])) {
        result[cat.id][label] = saved[cat.id]?.[label] ?? { amount: "", vouchers: [] };
      }
    }
    return result;
  });
  const [sysVouchers, setSysVouchers] = useState<SysVouchers>(() => JSON.parse(JSON.stringify(rec.sysVouchers)));
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showAddEmp, setShowAddEmp] = useState(false);

  const isReadOnly = rec.status === "已结算" && !isAdmin;
  const canEdit = rec.status !== "已结算" || isAdmin;

  const usedDevs = devices.filter((d) => d.isUsed);
  const grandTotal = calcGrandTotal(employees, devices, presetFees);

  function toggleEmpType(eid: string) {
    setEmployees((prev) => prev.map((e) => {
      if (e.employeeId !== eid) return e;
      const newType: EmpType = e.employeeType === "正式员工" ? "兼职员工" : "正式员工";
      return { ...e, employeeType: newType, coefficient: genCoeff(newType) };
    }));
  }
  function setCoeff(eid: string, val: string) {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0 || n > 1) return;
    setEmployees((prev) => prev.map((e) => e.employeeId === eid ? { ...e, coefficient: Math.round(n * 100) / 100 } : e));
  }

  function toggleDevice(did: string) {
    setDevices((prev) => prev.map((d) => d.deviceId === did ? { ...d, isUsed: !d.isUsed } : d));
  }
  const allDevIds = new Set(devices.map((d) => d.deviceId));
  const missingDevs = project.allDevices.filter((d) => !allDevIds.has(d.deviceId));

  const allEmpIds = new Set(employees.map((e) => e.employeeId));
  const availableEmps = project.allEmployees.filter((e) => !allEmpIds.has(e.employeeId));

  function addEmployee(empBase: Omit<EmpRec, "employeeType" | "coefficient">) {
    const newEmp: EmpRec = { ...empBase, employeeType: "正式员工", coefficient: genCoeff("正式员工") };
    setEmployees((prev) => [...prev, newEmp]);
    setShowAddEmp(false);
  }
  function removeEmployee(eid: string) {
    setEmployees((prev) => prev.filter((e) => e.employeeId !== eid));
  }

  function updatePresetAmount(catId: string, label: string, val: string) {
    setPresetFees((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], [label]: { ...prev[catId][label], amount: val } },
    }));
  }
  function addPresetVoucher(catId: string, label: string, names: string[]) {
    setPresetFees((prev) => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        [label]: { ...prev[catId][label], vouchers: [...(prev[catId][label]?.vouchers ?? []), ...names] },
      },
    }));
  }
  function addSysVoucher(itemId: string, names: string[]) {
    setSysVouchers((prev) => ({ ...prev, [itemId]: [...(prev[itemId] ?? []), ...names] }));
  }

  function laborItems() {
    return employees.map((e) => ({
      id: e.employeeId,
      label: `${e.name}（${e.employeeId}）- ${e.employeeType}`,
      formula: `${WORK_HOURS}h × ¥${e.hourlyRate}/h × ${e.coefficient.toFixed(2)}`,
      amount: Math.round(WORK_HOURS * e.hourlyRate * e.coefficient),
    }));
  }
  function deprecItems() {
    return devices.filter((d) => d.isUsed).map((d) => ({
      id: d.deviceId,
      label: `${d.name}（${d.deviceId}）`,
      formula: `${WORK_DAYS}天 × 8h × ¥${d.depreciationRate}/h`,
      amount: Math.round(WORK_DAYS * 8 * d.depreciationRate),
    }));
  }

  function buildRec(): MonthlyRec {
    return { ...rec, employees, devices, presetFees, sysVouchers };
  }

  const tabStyle = (t: "员工" | "设备" | "费用") =>
    `px-[16px] h-[34px] rounded-[8px] text-[13px] font-semibold transition-colors ${tab === t ? "bg-[#272b30] text-white" : "bg-[#f4f4f4] text-[#6f767e] hover:bg-[#efefef]"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[24px]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] shadow-[0_16px_64px_rgba(0,0,0,0.16)] w-full max-w-[880px] max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-[32px] py-[22px] border-b border-[#f4f4f4] flex-shrink-0">
          <div>
            <div className="flex items-center gap-[10px] mb-[4px]">
              <h3 className="font-semibold text-[#272b30] text-[18px]">{project.name}</h3>
              <StatusBadge status={rec.status} />
              {rec.status === "已结算" && isAdmin && (
                <span className="px-[8px] py-[2px] rounded-[5px] bg-[#fff4e0] text-[#d48806] text-[11px] font-semibold">管理员编辑模式</span>
              )}
            </div>
            <p className="text-[#9a9fa5] text-[13px]">{fmtYM(yearMonth)}月度数据管理 · 项目负责人：{project.createdBy}</p>
          </div>
          <button onClick={onClose} className="w-[32px] h-[32px] rounded-[8px] bg-[#f4f4f4] flex items-center justify-center text-[#6f767e] hover:text-[#272b30] transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-[6px] px-[32px] py-[14px] border-b border-[#f4f4f4] flex-shrink-0">
          <button onClick={() => setTab("员工")} className={tabStyle("员工")}>👥 员工配置</button>
          <button onClick={() => setTab("设备")} className={tabStyle("设备")}>💻 设备配置</button>
          <button onClick={() => setTab("费用")} className={tabStyle("费用")}>💰 费用录入</button>
          <div className="ml-auto text-right">
            <span className="text-[#9a9fa5] text-[12px]">预估结算总额</span>
            <span className="text-[#0d9f5f] text-[18px] font-semibold ml-[8px]">¥{grandTotal.toLocaleString("zh-CN")}</span>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-[32px] py-[20px]">

          {/* ── 员工配置 ── */}
          {tab === "员工" && (
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between">
                <p className="text-[#272b30] text-[14px] font-semibold">本月参与员工配置</p>
                <p className="text-[#9a9fa5] text-[12px]">员工类型 &amp; 系数每月可独立调整 · 正式 0.60~0.80 / 兼职 0.40~0.60</p>
              </div>
              <div className="rounded-[12px] border border-[#f4f4f4] overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#f4f4f4]">
                      {["工号", "姓名", "部门", "员工类型", "关联系数", "月薪基数(¥/h)", "预估人工费", ...(canEdit ? ["操作"] : [])].map((h) => (
                        <th key={h} className="text-left px-[14px] py-[10px] text-[#6f767e] text-[12px] font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => {
                      const labor = Math.round(WORK_HOURS * emp.hourlyRate * emp.coefficient);
                      return (
                        <tr key={emp.employeeId} className="border-t border-[#f4f4f4] hover:bg-[#fafafa]">
                          <td className="px-[14px] py-[11px] text-[#6f767e] text-[12px] font-mono">{emp.employeeId}</td>
                          <td className="px-[14px] py-[11px]">
                            <div className="flex items-center gap-[7px]">
                              <div className="w-[24px] h-[24px] rounded-full bg-[#272b30] flex items-center justify-center text-white text-[10px] font-semibold">{emp.name.slice(-1)}</div>
                              <span className="text-[#272b30] text-[13px] font-semibold">{emp.name}</span>
                            </div>
                          </td>
                          <td className="px-[14px] py-[11px] text-[#6f767e] text-[12px]">{emp.department}</td>
                          <td className="px-[14px] py-[11px]">
                            {canEdit ? (
                              <button
                                onClick={() => toggleEmpType(emp.employeeId)}
                                className={`flex items-center gap-[5px] px-[8px] h-[26px] rounded-[6px] text-[11px] font-semibold transition-colors cursor-pointer ${emp.employeeType === "正式员工" ? "bg-[#e6f9f0] text-[#0d9f5f] hover:bg-[#d0f5e6]" : "bg-[#fff8e6] text-[#d48806] hover:bg-[#ffefc9]"}`}
                              >
                                {emp.employeeType}
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 5h4M6 3l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              </button>
                            ) : (
                              <span className={`px-[8px] py-[2px] rounded-[6px] text-[11px] font-semibold ${emp.employeeType === "正式员工" ? "bg-[#e6f9f0] text-[#0d9f5f]" : "bg-[#fff8e6] text-[#d48806]"}`}>{emp.employeeType}</span>
                            )}
                          </td>
                          <td className="px-[14px] py-[11px]">
                            {canEdit ? (
                              <input
                                type="number" value={emp.coefficient} step="0.01" min="0" max="1"
                                onChange={(e) => setCoeff(emp.employeeId, e.target.value)}
                                className="w-[72px] h-[28px] px-[8px] rounded-[6px] border border-[#efefef] bg-[#f4f4f4] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
                              />
                            ) : (
                              <span className="text-[#272b30] text-[13px] font-semibold">{emp.coefficient.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-[14px] py-[11px] text-[#0d9f5f] text-[13px] font-semibold">¥{emp.hourlyRate}</td>
                          <td className="px-[14px] py-[11px] text-[#272b30] text-[13px] font-semibold">{fmtMoney(labor)}</td>
                          {canEdit && (
                            <td className="px-[14px] py-[11px]">
                              <button
                                onClick={() => removeEmployee(emp.employeeId)}
                                className="w-[26px] h-[26px] rounded-[6px] bg-[#fff0f0] text-[#d4380d] text-[14px] flex items-center justify-center hover:bg-[#ffd8d0] transition-colors"
                                title="移除员工"
                              >×</button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 添加员工 */}
              {canEdit && (
                <div className="rounded-[12px] border border-dashed border-[#d9d9d9] overflow-hidden">
                  <button
                    onClick={() => setShowAddEmp((v) => !v)}
                    disabled={availableEmps.length === 0}
                    className="w-full flex items-center gap-[8px] px-[14px] py-[10px] text-[#6f767e] text-[13px] font-semibold hover:bg-[#fafafa] transition-colors disabled:cursor-default"
                  >
                    <span className="w-[20px] h-[20px] rounded-full bg-[#272b30] text-white text-[14px] flex items-center justify-center flex-shrink-0">+</span>
                    {availableEmps.length > 0 ? `添加员工（${availableEmps.length} 人可选）` : "所有可用员工均已添加"}
                    {availableEmps.length > 0 && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`ml-auto transition-transform duration-150 ${showAddEmp ? "rotate-90" : ""}`}>
                        <path d="M4 2l4 4-4 4" stroke="#9A9FA5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  {showAddEmp && availableEmps.length > 0 && (
                    <div className="border-t border-[#efefef]">
                      {availableEmps.map((emp) => (
                        <div key={emp.employeeId} className="flex items-center gap-[12px] px-[14px] py-[10px] border-b last:border-b-0 border-[#f4f4f4] hover:bg-[#fafafa] transition-colors">
                          <div className="w-[28px] h-[28px] rounded-full bg-[#f4f4f4] flex items-center justify-center text-[#272b30] text-[11px] font-semibold flex-shrink-0">{emp.name.slice(-1)}</div>
                          <div className="flex-1">
                            <p className="text-[#272b30] text-[13px] font-semibold">{emp.name}</p>
                            <p className="text-[#9a9fa5] text-[11px]">{emp.employeeId} · {emp.department} · ¥{emp.hourlyRate}/h</p>
                          </div>
                          <button
                            onClick={() => addEmployee(emp)}
                            className="px-[12px] h-[28px] rounded-[7px] bg-[#272b30] text-white text-[12px] font-semibold hover:bg-[#1a1d1f] transition-colors flex-shrink-0"
                          >+ 添加</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-[#f4f4f4] rounded-[10px] px-[14px] py-[10px]">
                <p className="text-[#6f767e] text-[12px]">💡 点击员工类型标签可快速切换，切换后系数自动重新随机生成；也可直接修改系数（0~1 之间）。</p>
                <p className="text-[#0d9f5f] text-[12px] mt-[4px]">📊 本月人工费合计：<span className="font-semibold">¥{calcLaborTotal(employees).toLocaleString("zh-CN")}</span></p>
              </div>
            </div>
          )}

          {/* ── 设备配置 ── */}
          {tab === "设备" && (
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between">
                <p className="text-[#272b30] text-[14px] font-semibold">本月设备使用情况</p>
                <p className="text-[#9a9fa5] text-[12px]">勾选表示本月实际使用，折旧费用将自动计入结算</p>
              </div>
              <div className="flex flex-col gap-[8px]">
                {[...devices, ...missingDevs.map((d) => ({ ...d, isUsed: false }))].map((dev) => {
                  const inList = devices.some((d) => d.deviceId === dev.deviceId);
                  const monthFee = Math.round(WORK_DAYS * 8 * dev.depreciationRate);
                  return (
                    <div key={dev.deviceId} className={`flex items-center gap-[14px] p-[14px] rounded-[12px] border transition-colors ${dev.isUsed ? "border-[#0d9f5f]/20 bg-[#f0faf5]" : "border-[#f4f4f4] bg-[#fafafa]"}`}>
                      {canEdit ? (
                        <button
                          onClick={() => {
                            if (!inList) {
                              setDevices((prev) => [...prev, { ...dev, isUsed: true }]);
                            } else {
                              toggleDevice(dev.deviceId);
                            }
                          }}
                          className={`w-[40px] h-[22px] rounded-full transition-colors flex-shrink-0 relative ${dev.isUsed ? "bg-[#0d9f5f]" : "bg-[#d9d9d9]"}`}
                        >
                          <span className={`absolute top-[3px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-all ${dev.isUsed ? "left-[21px]" : "left-[3px]"}`} />
                        </button>
                      ) : (
                        <div className={`w-[40px] h-[22px] rounded-full flex-shrink-0 relative ${dev.isUsed ? "bg-[#0d9f5f]" : "bg-[#d9d9d9]"}`}>
                          <span className={`absolute top-[3px] w-[16px] h-[16px] rounded-full bg-white shadow-sm ${dev.isUsed ? "left-[21px]" : "left-[3px]"}`} />
                        </div>
                      )}
                      <div className="w-[32px] h-[32px] rounded-[8px] bg-[#f4f4f4] flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke={dev.isUsed ? "#0d9f5f" : "#9A9FA5"} strokeWidth="1.3" /><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke={dev.isUsed ? "#0d9f5f" : "#9A9FA5"} strokeWidth="1.3" /></svg>
                      </div>
                      <div className="flex-1">
                        <p className={`text-[13px] font-semibold ${dev.isUsed ? "text-[#272b30]" : "text-[#6f767e]"}`}>{dev.name}</p>
                        <p className="text-[#9a9fa5] text-[11px]">{dev.deviceId} · {dev.category} · ¥{dev.depreciationRate}/h</p>
                      </div>
                      {dev.isUsed ? (
                        <span className="text-[#0d9f5f] text-[13px] font-semibold">{fmtMoney(monthFee)}</span>
                      ) : (
                        <span className="text-[#d0d0d0] text-[12px]">本月未使用</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="bg-[#f4f4f4] rounded-[10px] px-[14px] py-[10px]">
                <p className="text-[#6f767e] text-[12px]">💡 开关控制本月是否使用该设备；使用的设备将按 {WORK_DAYS} 工作日 × 8h 计算折旧费。</p>
                <p className="text-[#0d9f5f] text-[12px] mt-[4px]">🔧 本月折旧费合计：<span className="font-semibold">¥{calcDeprecTotal(devices).toLocaleString("zh-CN")}</span>（{usedDevs.length} 台设备使用）</p>
              </div>
            </div>
          )}

          {/* ── 费用录入 ── */}
          {tab === "费用" && (
            <div className="flex flex-col gap-[8px]">
              <div className="flex items-start gap-[8px] bg-[#f0f5ff] rounded-[10px] px-[14px] py-[10px] mb-[2px]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-[1px]"><circle cx="7" cy="7" r="6" stroke="#3b5bdb" strokeWidth="1.2"/><path d="M7 6v4M7 4.5v.5" stroke="#3b5bdb" strokeWidth="1.4" strokeLinecap="round"/></svg>
                <p className="text-[#3b5bdb] text-[12px]">各费用子项已按国家研发费用归集规范预设，直接在对应格子填写金额（不填则计为 0）；系统自动计算项已标注，无需手动录入。</p>
              </div>
              {FEE_CATS.map((cat) => {
                const sysItems = cat.id === "labor" ? laborItems() : cat.id === "deprec" ? deprecItems() : [];
                const catPresets = presetFees[cat.id] ?? {};
                const presetSum = Object.values(catPresets).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
                const catTotal = sysItems.reduce((s, i) => s + i.amount, 0) + presetSum;
                const filledCount = Object.values(catPresets).filter((e) => parseFloat(e.amount) > 0).length;
                const expanded = expandedCats[cat.id] ?? false;
                return (
                  <div key={cat.id} className={`border rounded-[12px] overflow-hidden transition-colors ${catTotal > 0 ? "border-[#3b5bdb]/20" : "border-[#efefef]"}`}>
                    <button
                      onClick={() => setExpandedCats((p) => ({ ...p, [cat.id]: !p[cat.id] }))}
                      className={`w-full flex items-center justify-between px-[16px] py-[13px] transition-colors ${catTotal > 0 ? "bg-[#f5f7ff] hover:bg-[#eef1ff]" : "bg-[#fafafa] hover:bg-[#f4f4f4]"}`}
                    >
                      <div className="flex items-center gap-[8px]">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform duration-150 flex-shrink-0 ${expanded ? "rotate-90" : ""}`}>
                          <path d="M5 3l4 4-4 4" stroke="#9A9FA5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className={`text-[13px] font-semibold ${catTotal > 0 ? "text-[#272b30]" : "text-[#6f767e]"}`}>{cat.label}</span>
                        {cat.hasSystem && (
                          <span className="px-[5px] py-[1px] rounded-[4px] bg-[#e8f0fe] text-[#3b5bdb] text-[10px] font-semibold">含系统计算项</span>
                        )}
                        {filledCount > 0 && (
                          <span className="px-[5px] py-[1px] rounded-[4px] bg-[#e6f9f0] text-[#0d9f5f] text-[10px] font-semibold">{filledCount} 项已填</span>
                        )}
                      </div>
                      <div className="flex items-center gap-[10px]">
                        <span className={`text-[13px] font-semibold ${catTotal > 0 ? "text-[#272b30]" : "text-[#c0c0c0]"}`}>
                          小计：{catTotal > 0 ? `¥${catTotal.toLocaleString("zh-CN")}` : "—"}
                        </span>
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-[#efefef]">
                        {sysItems.length > 0 && (
                          <div className="px-[16px] pt-[12px] pb-[8px] flex flex-col gap-[6px]">
                            <p className="text-[#9a9fa5] text-[11px] font-semibold uppercase tracking-wide mb-[2px]">系统自动计算</p>
                            {sysItems.map((item) => (
                              <div key={item.id} className="flex items-center gap-[10px] bg-[#f9fafb] rounded-[8px] px-[12px] py-[10px]">
                                <span className="w-[32px] text-center text-[#3b5bdb] text-[10px] font-semibold bg-[#e8f0fe] px-[4px] py-[1px] rounded-[4px] flex-shrink-0">自动</span>
                                <span className="text-[#272b30] text-[12px] font-semibold flex-1 min-w-0 truncate">{item.label}</span>
                                <span className="text-[#6f767e] text-[11px] flex-shrink-0">{item.formula}</span>
                                <span className="text-[#272b30] text-[13px] font-semibold flex-shrink-0 min-w-[80px] text-right">¥{item.amount.toLocaleString("zh-CN")}</span>
                                <VoucherBtn vouchers={sysVouchers[item.id] ?? []} onAdd={(ns) => addSysVoucher(item.id, ns)} />
                              </div>
                            ))}
                            <div className="flex items-center gap-[8px] mt-[4px] mb-[2px]">
                              <div className="flex-1 h-[1px] bg-[#efefef]" />
                              <span className="text-[#9a9fa5] text-[11px]">手动录入费用项</span>
                              <div className="flex-1 h-[1px] bg-[#efefef]" />
                            </div>
                          </div>
                        )}

                        <div className={`${sysItems.length > 0 ? "px-[16px] pb-[12px]" : "px-[16px] py-[12px]"} flex flex-col gap-[4px]`}>
                          {sysItems.length === 0 && (
                            <p className="text-[#9a9fa5] text-[11px] font-semibold uppercase tracking-wide mb-[6px]">费用明细录入</p>
                          )}
                          {(PRESET_ITEMS[cat.id] ?? []).map((label, idx) => {
                            const entry = catPresets[label] ?? { amount: "", vouchers: [] };
                            const hasValue = parseFloat(entry.amount) > 0;
                            return (
                              <div key={label} className={`flex items-center gap-[10px] rounded-[8px] px-[12px] py-[9px] transition-colors ${hasValue ? "bg-[#f5f9ff]" : idx % 2 === 0 ? "bg-[#fafafa]" : "bg-white"}`}>
                                <span className="w-[18px] text-[11px] text-[#c0c0c0] text-right flex-shrink-0">{idx + 1}</span>
                                <span className={`flex-1 text-[12px] ${hasValue ? "text-[#272b30] font-semibold" : "text-[#6f767e]"}`}>{label}</span>
                                <div className={`flex items-center gap-[4px] flex-shrink-0 rounded-[6px] border px-[8px] h-[30px] transition-colors ${
                                  !canEdit
                                    ? "bg-[#f4f4f4] border-transparent"
                                    : hasValue
                                      ? "bg-white border-[#3b5bdb]/30 focus-within:border-[#3b5bdb]"
                                      : "bg-white border-[#efefef] focus-within:border-[#3b5bdb]"
                                }`}>
                                  <span className="text-[#9a9fa5] text-[12px]">¥</span>
                                  {canEdit ? (
                                    <input
                                      type="number"
                                      min="0"
                                      value={entry.amount}
                                      onChange={(e) => updatePresetAmount(cat.id, label, e.target.value)}
                                      placeholder="0"
                                      className="w-[90px] text-[12px] text-[#272b30] bg-transparent outline-none text-right placeholder-[#d0d0d0]"
                                    />
                                  ) : (
                                    <span className={`w-[90px] text-[12px] text-right ${hasValue ? "text-[#272b30] font-semibold" : "text-[#c0c0c0]"}`}>
                                      {hasValue ? Number(entry.amount).toLocaleString("zh-CN") : "0"}
                                    </span>
                                  )}
                                </div>
                                <VoucherBtn
                                  vouchers={entry.vouchers}
                                  onAdd={(ns) => addPresetVoucher(cat.id, label, ns)}
                                />
                              </div>
                            );
                          })}
                          {presetSum > 0 && (
                            <div className="flex items-center justify-end gap-[8px] mt-[4px] px-[12px] py-[6px] border-t border-[#efefef]">
                              <span className="text-[#9a9fa5] text-[12px]">手动录入小计</span>
                              <span className="text-[#272b30] text-[13px] font-semibold">¥{presetSum.toLocaleString("zh-CN")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-[32px] py-[20px] border-t border-[#f4f4f4] flex-shrink-0">
          <div className="text-[#9a9fa5] text-[12px]">
            {rec.status === "已结算" && rec.settledAt && `已于 ${rec.settledAt} 完成结算`}
            {rec.status === "待结算" && "已提交待结算，等待最终结算处理"}
            {rec.status === "编辑中" && "数据编辑中，保存后可继续修改或提交待结算"}
          </div>
          <div className="flex gap-[10px]">
            {isReadOnly ? (
              <button onClick={onClose} className="px-[20px] h-[40px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors">关闭</button>
            ) : (
              <>
                <button onClick={() => onSave(buildRec())}
                  className="px-[20px] h-[40px] rounded-[10px] border border-[#efefef] bg-white text-[#272b30] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors">
                  💾 保存草稿
                </button>
                {rec.status !== "已结算" && (
                  <button onClick={() => setShowSubmitConfirm(true)}
                    className="px-[20px] h-[40px] rounded-[10px] bg-[#0d9f5f] text-white text-[13px] font-semibold hover:bg-[#0b8a52] transition-colors">
                    📊 提交待结算
                  </button>
                )}
                {rec.status === "已结算" && isAdmin && (
                  <button onClick={() => setShowSubmitConfirm(true)}
                    className="px-[20px] h-[40px] rounded-[10px] bg-[#d48806] text-white text-[13px] font-semibold hover:bg-[#b87700] transition-colors">
                    🔄 重新发起结算
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showSubmitConfirm && (
        <SubmitConfirmModal
          projectName={project.name} yearMonth={yearMonth}
          empCount={employees.length}
          devCount={usedDevs.length}
          total={grandTotal}
          onConfirm={() => { setShowSubmitConfirm(false); onSubmit({ ...buildRec(), status: "待结算" }); }}
          onCancel={() => setShowSubmitConfirm(false)}
        />
      )}
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({
  project, yearMonth, onManage,
}: {
  project: ProjectDef; yearMonth: string; onManage: () => void;
}) {
  const rec = project.monthlyRecords[yearMonth];
  if (!rec) {
    return (
      <div className="bg-[#fcfcfc] rounded-[16px] border border-dashed border-[#d9d9d9] p-[24px] flex flex-col gap-[12px]">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-[#272b30] text-[15px]">{project.name}</h3>
        </div>
        <p className="text-[#9a9fa5] text-[12px] flex-1">{project.description.slice(0, 48)}…</p>
        <div className="text-center py-[8px]">
          <p className="text-[#9a9fa5] text-[12px] mb-[10px]">{fmtYM(yearMonth)}暂无月度数据</p>
          <button onClick={onManage}
            className="px-[14px] h-[32px] rounded-[8px] bg-[#272b30] text-white text-[12px] font-semibold hover:bg-[#1a1d1f] transition-colors">
            创建月度记录
          </button>
        </div>
      </div>
    );
  }

  const laborTotal = calcLaborTotal(rec.employees);
  const deprecTotal = calcDeprecTotal(rec.devices);
  const presetTotal = calcPresetTotal(rec.presetFees ?? {});
  const cardTotal = laborTotal + deprecTotal + presetTotal;
  const usedDevCount = rec.devices.filter((d) => d.isUsed).length;

  return (
    <div className={`bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-[22px] flex flex-col gap-[14px] border transition-all ${rec.status === "已结算" ? "border-[#0d9f5f]/20" : rec.status === "待结算" ? "border-[#d48806]/20" : "border-transparent"}`}>
      <div className="flex items-start justify-between gap-[8px]">
        <h3 className="font-semibold text-[#272b30] text-[15px] leading-[20px]">{project.name}</h3>
        <StatusBadge status={rec.status} />
      </div>

      <div className="grid grid-cols-3 gap-[8px]">
        {[
          { label: "员工", value: `${rec.employees.length} 人`, icon: "👥" },
          { label: "设备", value: `${usedDevCount} 台使用`, icon: "💻" },
          { label: "预估金额", value: `¥${Math.round(cardTotal / 1000)}K`, icon: "💰" },
        ].map((s) => (
          <div key={s.label} className="bg-[#f4f4f4] rounded-[10px] px-[10px] py-[8px] text-center">
            <p className="text-[14px]">{s.icon}</p>
            <p className="text-[#272b30] text-[13px] font-semibold">{s.value}</p>
            <p className="text-[#9a9fa5] text-[10px]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-[4px]">
        <div className="flex justify-between text-[12px]">
          <span className="text-[#9a9fa5]">人工费</span>
          <span className="text-[#272b30] font-semibold">¥{laborTotal.toLocaleString("zh-CN")}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-[#9a9fa5]">折旧费</span>
          <span className="text-[#272b30] font-semibold">¥{deprecTotal.toLocaleString("zh-CN")}</span>
        </div>
        {presetTotal > 0 && (
          <div className="flex justify-between text-[12px]">
            <span className="text-[#9a9fa5]">其他费用</span>
            <span className="text-[#272b30] font-semibold">¥{presetTotal.toLocaleString("zh-CN")}</span>
          </div>
        )}
        {rec.status === "已结算" && rec.settledAt && (
          <p className="text-[#0d9f5f] text-[11px] mt-[2px]">✓ 已于 {rec.settledAt} 结算</p>
        )}
      </div>

      <button onClick={onManage}
        className="w-full h-[36px] rounded-[10px] border border-[#efefef] bg-white text-[#272b30] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors">
        管理月度数据 →
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function MonthlyProjectMain({ isAdmin }: { isAdmin: boolean }) {
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [projects, setProjects] = useState<ProjectDef[]>(mockProjects);
  const [managingId, setManagingId] = useState<string | null>(null);

  const managingProject = projects.find((p) => p.id === managingId);
  const managingRec = managingProject?.monthlyRecords[selectedMonth];

  const visibleProjects = projects.filter((p) => {
    const [py, pm] = p.startDate.split("-").map(Number);
    const [sy, sm] = selectedMonth.split("-").map(Number);
    return py < sy || (py === sy && pm <= sm);
  });

  function updateRec(projectId: string, updated: MonthlyRec) {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      return { ...p, monthlyRecords: { ...p.monthlyRecords, [selectedMonth]: updated } };
    }));
  }

  const recStats = visibleProjects.reduce((acc, p) => {
    const r = p.monthlyRecords[selectedMonth];
    if (!r) { acc.noRecord++; return acc; }
    if (r.status === "编辑中") acc.editing++;
    else if (r.status === "待结算") acc.pending++;
    else acc.settled++;
    return acc;
  }, { editing: 0, pending: 0, settled: 0, noRecord: 0 });

  return (
    <div className="flex flex-col gap-[24px]">
      {/* Month Navigator */}
      <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-[24px] py-[18px]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#272b30] text-[16px]">月度数据管理</h2>
            <p className="text-[#9a9fa5] text-[12px] mt-[2px]">选择月份查看和管理进行中项目的月度数据</p>
          </div>
          <div className="flex items-center gap-[8px]">
            <button onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
              className="w-[32px] h-[32px] rounded-[8px] border border-[#efefef] bg-white flex items-center justify-center text-[#6f767e] hover:bg-[#f4f4f4] transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 10.5L5.5 7 9 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div className="px-[20px] h-[40px] rounded-[10px] bg-[#272b30] text-white text-[15px] font-semibold flex items-center gap-[8px]">
              <span>📅</span>
              <span>{fmtYM(selectedMonth)}</span>
              {selectedMonth === CURRENT_MONTH && (
                <span className="px-[6px] py-[1px] rounded-[4px] bg-white/20 text-white text-[10px] font-semibold">当前月</span>
              )}
            </div>
            <button
              onClick={() => setSelectedMonth(nextMonth(selectedMonth))}
              disabled={selectedMonth >= CURRENT_MONTH}
              className="w-[32px] h-[32px] rounded-[8px] border border-[#efefef] bg-white flex items-center justify-center text-[#6f767e] hover:bg-[#f4f4f4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3.5L8.5 7 5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-[12px] mt-[16px]">
          {[
            { label: "项目总数", value: visibleProjects.length, color: "text-[#272b30]", bg: "bg-[#f4f4f4]" },
            { label: "编辑中", value: recStats.editing, color: "text-[#1677ff]", bg: "bg-[#e8f4ff]" },
            { label: "待结算", value: recStats.pending, color: "text-[#d48806]", bg: "bg-[#fff4e0]" },
            { label: "已结算", value: recStats.settled, color: "text-[#0d9f5f]", bg: "bg-[#e6f9f0]" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-[10px] px-[16px] py-[12px] flex items-center justify-between`}>
              <span className="text-[#6f767e] text-[13px]">{s.label}</span>
              <span className={`${s.color} text-[22px] font-semibold`}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Project Cards Grid */}
      {visibleProjects.length === 0 ? (
        <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] py-[60px] flex flex-col items-center gap-[12px]">
          <span className="text-[48px]">📊</span>
          <p className="text-[#272b30] text-[15px] font-semibold">该月份暂无进行中的项目</p>
          <p className="text-[#9a9fa5] text-[13px]">请切换至其他月份查看</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[16px]">
          {visibleProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              yearMonth={selectedMonth}
              onManage={() => setManagingId(p.id)}
            />
          ))}
        </div>
      )}

      {managingProject && (
        <ManageModal
          project={managingProject}
          yearMonth={selectedMonth}
          rec={managingRec ?? {
            yearMonth: selectedMonth,
            employees: managingProject.allEmployees.map((e) => ({
              ...e, employeeType: "正式员工" as EmpType,
              coefficient: genCoeff("正式员工"),
            })),
            devices: managingProject.allDevices.map((d) => ({ ...d, isUsed: true })),
            presetFees: {}, sysVouchers: {}, status: "编辑中",
          }}
          isAdmin={isAdmin}
          onClose={() => setManagingId(null)}
          onSave={(updated) => { updateRec(managingProject.id, updated); setManagingId(null); }}
          onSubmit={(updated) => { updateRec(managingProject.id, updated); setManagingId(null); }}
        />
      )}
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export function MonthlyProjectPage() {
  const isAdmin = true;

  return (
    <div className="px-[40px] py-[40px]">
      <div className="flex items-center justify-between mb-[28px]">
        <div>
          <h1 className="font-semibold text-[32px] text-[#272b30] leading-[40px] tracking-[-0.6px]">月度总结</h1>
          <p className="text-[#9a9fa5] text-[13px] mt-[4px]">按月统计项目人员、设备及费用数据，提交待结算队列</p>
        </div>
      </div>
      <MonthlyProjectMain isAdmin={isAdmin} />
    </div>
  );
}
