import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
  type EmployeePayload,
  type EmployeeRecord,
} from "../api/employees";
import { fetchAttendance } from "../api/attendance";
import { fetchAllProjects, fetchProjectDetail } from "../api/projects";

type FormState = EmployeePayload;

const EMPTY_FORM: FormState = {
  employeeId: "",
  name: "",
  gender: "男",
  department: "",
  position: "",
  phone: "",
  email: "",
  entryDate: "",
};

type ParticipationBucket = {
  label: string;
  value: number;
};

type ActiveEmployee = {
  name: string;
  hours: number;
};

function getRecentRange(days: number) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  const toIso = (date: Date) => date.toISOString().slice(0, 10);
  return { start: toIso(start), end: toIso(end) };
}

function EmployeeModal({
  title,
  form,
  saving,
  onChange,
  onCancel,
  onConfirm,
}: {
  title: string;
  form: FormState;
  saving: boolean;
  onChange: (field: keyof FormState, value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative w-[520px] rounded-[16px] bg-white p-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        <h3 className="mb-[24px] text-[18px] font-semibold text-[#272b30]">{title}</h3>
        <div className="grid grid-cols-2 gap-[16px]">
          {[
            { key: "employeeId", label: "工号", type: "text" },
            { key: "name", label: "姓名", type: "text" },
            { key: "department", label: "部门", type: "text" },
            { key: "position", label: "岗位", type: "text" },
            { key: "phone", label: "手机号", type: "text" },
            { key: "email", label: "邮箱", type: "text" },
            { key: "entryDate", label: "入职日期", type: "date" },
          ].map((item) => (
            <div key={item.key} className={item.key === "entryDate" ? "col-span-2" : ""}>
              <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">{item.label}</label>
              <input
                type={item.type}
                value={String(form[item.key as keyof FormState] ?? "")}
                onChange={(event) => onChange(item.key as keyof FormState, event.target.value)}
                className="h-[42px] w-full rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
              />
            </div>
          ))}

          <div className="col-span-2">
            <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">性别</label>
            <div className="flex gap-[10px]">
              {["男", "女"].map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => onChange("gender", gender)}
                  className={`h-[40px] rounded-[10px] px-[16px] text-[13px] font-semibold transition-colors ${
                    form.gender === gender ? "bg-[#272b30] text-white" : "bg-[#f4f4f4] text-[#6f767e]"
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-[28px] flex gap-[12px]">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-[44px] flex-1 rounded-[10px] border border-[#efefef] bg-white text-[14px] font-semibold text-[#6f767e]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="h-[44px] flex-1 rounded-[10px] bg-[#272b30] text-[14px] font-semibold text-white"
          >
            {saving ? "保存中..." : "确认"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  name,
  deleting,
  onCancel,
  onConfirm,
}: {
  name: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative w-[420px] rounded-[16px] bg-white p-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        <h3 className="text-[18px] font-semibold text-[#272b30]">确认删除</h3>
        <p className="mt-[10px] text-[14px] text-[#6f767e]">确定删除员工“{name}”吗？此操作不可撤销。</p>
        <div className="mt-[24px] flex gap-[12px]">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="h-[44px] flex-1 rounded-[10px] border border-[#efefef] bg-white text-[14px] font-semibold text-[#6f767e]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="h-[44px] flex-1 rounded-[10px] bg-[#ff6a55] text-[14px] font-semibold text-white"
          >
            {deleting ? "删除中..." : "删除"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PersonnelPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [participationData, setParticipationData] = useState<ParticipationBucket[]>([]);
  const [participationLoading, setParticipationLoading] = useState(false);
  const [activeEmployees, setActiveEmployees] = useState<ActiveEmployee[]>([]);
  const [activeLoading, setActiveLoading] = useState(false);

  async function loadEmployees() {
    setLoading(true);
    setPageError("");
    try {
      setEmployees(await fetchEmployees());
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "员工列表加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEmployees();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadParticipation() {
      if (!employees.length) {
        setParticipationData([]);
        return;
      }
      setParticipationLoading(true);
      try {
        const projectPage = await fetchAllProjects();
        const details = await Promise.all(projectPage.records.map((project) => fetchProjectDetail(project.id)));
        const countMap = new Map<string, number>();
        const nameMap = new Map<string, string>();

        employees.forEach((employee) => {
          if (employee.employeeId) {
            nameMap.set(employee.employeeId, employee.name);
          }
        });

        details.forEach((detail) => {
          detail.employees.forEach((emp) => {
            const key = emp.employeeId ? String(emp.employeeId) : emp.employeeName;
            if (!key) return;
            countMap.set(key, (countMap.get(key) ?? 0) + 1);
            if (!nameMap.has(key)) {
              nameMap.set(key, emp.employeeName);
            }
          });
        });

        let zero = 0;
        let one = 0;
        let two = 0;
        let threePlus = 0;
        employees.forEach((employee) => {
          const key = employee.employeeId || "";
          const count = key ? countMap.get(key) ?? 0 : 0;
          if (count <= 0) {
            zero += 1;
          } else if (count === 1) {
            one += 1;
          } else if (count === 2) {
            two += 1;
          } else {
            threePlus += 1;
          }
        });

        if (!cancelled) {
          setParticipationData([
            { label: "未参与", value: zero },
            { label: "1 个项目", value: one },
            { label: "2 个项目", value: two },
            { label: "3+ 项目", value: threePlus },
          ]);
        }
      } catch {
        if (!cancelled) {
          setParticipationData([]);
        }
      } finally {
        if (!cancelled) {
          setParticipationLoading(false);
        }
      }
    }
    void loadParticipation();
    return () => {
      cancelled = true;
    };
  }, [employees]);

  useEffect(() => {
    let cancelled = false;
    async function loadActive() {
      setActiveLoading(true);
      try {
        const range = getRecentRange(30);
        let pageIndex = 1;
        const pageSize = 2000;
        const totals = new Map<string, ActiveEmployee>();
        while (!cancelled) {
          const response = await fetchAttendance({ page: pageIndex, size: pageSize, startDate: range.start, endDate: range.end });
          response.list.forEach((record) => {
            const key = record.employeeId || record.name;
            if (!key) return;
            const current = totals.get(key) ?? { name: record.name || record.employeeId, hours: 0 };
            current.hours += Number(record.duration || 0);
            totals.set(key, current);
          });
          if (response.list.length < pageSize) break;
          pageIndex += 1;
        }

        const sorted = [...totals.values()]
          .filter((item) => item.hours > 0)
          .sort((a, b) => b.hours - a.hours)
          .slice(0, 10);
        if (!cancelled) {
          setActiveEmployees(sorted);
        }
      } catch {
        if (!cancelled) {
          setActiveEmployees([]);
        }
      } finally {
        if (!cancelled) {
          setActiveLoading(false);
        }
      }
    }
    void loadActive();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    const currentKeyword = keyword.trim().toLowerCase();
    if (!currentKeyword) {
      return employees;
    }
    return employees.filter((item) =>
      [item.employeeId, item.name, item.department, item.position]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(currentKeyword)),
    );
  }, [employees, keyword]);

  function openCreate() {
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(employee: EmployeeRecord) {
    setEditingEmployee(employee);
    setForm({
      employeeId: employee.employeeId,
      name: employee.name,
      gender: employee.gender || "男",
      department: employee.department || "",
      position: employee.position || "",
      phone: employee.phone || "",
      email: employee.email || "",
      entryDate: employee.entryDate || "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.employeeId.trim() || !form.name.trim()) {
      setPageError("工号和姓名不能为空");
      return;
    }

    setSaving(true);
    setPageError("");
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, form);
      } else {
        await createEmployee(form);
      }
      setEditingEmployee(null);
      setForm(EMPTY_FORM);
      setShowModal(false);
      await loadEmployees();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "保存员工失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingEmployee) {
      return;
    }
    setDeleting(true);
    setPageError("");
    try {
      await deleteEmployee(deletingEmployee.id);
      setDeletingEmployee(null);
      await loadEmployees();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "删除员工失败");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="px-[40px] py-[40px]">
      <div className="mb-[28px] flex items-center justify-between">
        <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.6px] text-[#272b30]">人员管理</h1>
      </div>

      <div className="flex flex-col gap-[24px]">
        {pageError ? (
          <div className="rounded-[12px] border border-[#ffd8bf] bg-[#fff7e6] px-[16px] py-[12px] text-[13px] text-[#ad6800]">{pageError}</div>
        ) : null}

        <div className="flex items-center justify-between gap-[16px] rounded-[16px] bg-[#fcfcfc] px-[24px] py-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索工号、姓名、部门或岗位"
            className="h-[40px] w-[320px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
          />
          <button type="button" onClick={openCreate} className="h-[40px] rounded-[10px] bg-[#272b30] px-[16px] text-[13px] font-semibold text-white">
            新增员工
          </button>
        </div>

        <div className="grid grid-cols-1 gap-[20px] xl:grid-cols-2">
          <div className="rounded-[16px] bg-[#fcfcfc] p-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="mb-[12px] flex items-center justify-between">
              <div>
                <div className="text-[16px] font-semibold text-[#272b30]">员工参与项目分布</div>
                <div className="mt-[2px] text-[12px] text-[#9a9fa5]">统计每位员工参与的项目数量</div>
              </div>
              <div className="text-[12px] text-[#9a9fa5]">当前员工</div>
            </div>
            <div className="h-[220px]">
              {participationLoading ? (
                <div className="flex h-full items-center justify-center rounded-[14px] border border-dashed border-[#d8dce3] text-[13px] text-[#9a9fa5]">
                  分布数据加载中...
                </div>
              ) : participationData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={participationData} margin={{ top: 6, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke="#eef1f4" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#8c8f94", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: "#8c8f94", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number) => [`${value} 人`, "员工数量"]}
                      contentStyle={{ borderRadius: 12, border: "1px solid #eef1f4", boxShadow: "0 14px 34px rgba(15,23,42,0.12)" }}
                    />
                    <Bar dataKey="value" fill="#4f6bed" radius={[8, 8, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[14px] border border-dashed border-[#d8dce3] text-[13px] text-[#9a9fa5]">
                  暂无可展示分布
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[16px] bg-[#fcfcfc] p-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="mb-[12px] flex items-center justify-between">
              <div>
                <div className="text-[16px] font-semibold text-[#272b30]">近 30 天工时 Top10</div>
                <div className="mt-[2px] text-[12px] text-[#9a9fa5]">按打卡时长汇总员工活跃度</div>
              </div>
              <div className="text-[12px] text-[#9a9fa5]">最近 30 天</div>
            </div>
            <div className="h-[220px]">
              {activeLoading ? (
                <div className="flex h-full items-center justify-center rounded-[14px] border border-dashed border-[#d8dce3] text-[13px] text-[#9a9fa5]">
                  活跃度加载中...
                </div>
              ) : activeEmployees.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeEmployees} layout="vertical" margin={{ top: 6, right: 16, left: 30, bottom: 0 }}>
                    <CartesianGrid stroke="#eef1f4" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#8c8f94", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#8c8f94", fontSize: 12 }} width={90} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number) => [`${Number(value || 0).toFixed(1)} 小时`, "工时"]}
                      contentStyle={{ borderRadius: 12, border: "1px solid #eef1f4", boxShadow: "0 14px 34px rgba(15,23,42,0.12)" }}
                    />
                    <Bar dataKey="hours" fill="#2bb673" radius={[0, 8, 8, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[14px] border border-dashed border-[#d8dce3] text-[13px] text-[#9a9fa5]">
                  暂无可展示活跃度
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[16px] bg-[#fcfcfc] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f4f4]">
                  {["工号", "姓名", "性别", "部门", "岗位", "入职日期", "联系方式", "操作"].map((header) => (
                    <th key={header} className="px-[20px] py-[12px] text-left text-[12px] font-semibold whitespace-nowrap text-[#6f767e]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-[48px] text-center text-[14px] text-[#9a9fa5]">
                      员工列表加载中...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-[48px] text-center text-[14px] text-[#9a9fa5]">
                      暂无员工数据
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b border-[#f4f4f4] last:border-b-0 transition-colors hover:bg-[#fafafa]">
                      <td className="px-[20px] py-[15px] font-mono text-[13px] text-[#6f767e]">{employee.employeeId}</td>
                      <td className="px-[20px] py-[15px] text-[13px] font-semibold text-[#272b30]">{employee.name}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{employee.gender || "-"}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{employee.department || "-"}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{employee.position || "-"}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{employee.entryDate || "-"}</td>
                      <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{employee.phone || employee.email || "-"}</td>
                      <td className="px-[20px] py-[15px]">
                        <div className="flex items-center gap-[8px]">
                          <button type="button" onClick={() => openEdit(employee)} className="h-[30px] rounded-[8px] border border-[#efefef] bg-white px-[12px] text-[12px] font-semibold text-[#272b30]">
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingEmployee(employee)}
                            className="h-[30px] rounded-[8px] border border-[#ff6a55]/20 bg-[#fff5f4] px-[12px] text-[12px] font-semibold text-[#ff6a55]"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal ? (
        <EmployeeModal
          title={editingEmployee ? "编辑员工" : "新增员工"}
          form={form}
          saving={saving}
          onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
          onCancel={() => {
            setEditingEmployee(null);
            setForm(EMPTY_FORM);
            setShowModal(false);
          }}
          onConfirm={() => void handleSave()}
        />
      ) : null}

      {deletingEmployee ? (
        <DeleteModal
          name={deletingEmployee.name}
          deleting={deleting}
          onCancel={() => setDeletingEmployee(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </div>
  );
}
