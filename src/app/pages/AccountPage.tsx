import { useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, type CurrentUser } from "../api/auth";
import {
  createAccount,
  fetchAccounts,
  updateAccountStatus,
  updateMyPassword,
  updateMyProfile,
  type AccountRecord,
} from "../api/accounts";

type CreateForm = {
  username: string;
  password: string;
  name: string;
  role: string;
};

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
};

const EMPTY_CREATE_FORM: CreateForm = {
  username: "",
  password: "",
  name: "",
  role: "user",
};

function getRoleLabel(role?: string) {
  switch (role) {
    case "admin":
      return "平台管理员";
    case "branch_admin":
      return "公司管理员";
    case "user":
      return "普通用户";
    default:
      return role || "-";
  }
}

function getStatusLabel(status?: string) {
  return status === "enabled" ? "启用" : "停用";
}

function AccountModal({
  form,
  saving,
  onChange,
  onCancel,
  onConfirm,
}: {
  form: CreateForm;
  saving: boolean;
  onChange: (field: keyof CreateForm, value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative w-[500px] rounded-[16px] bg-white p-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        <h3 className="mb-[24px] text-[18px] font-semibold text-[#272b30]">新增账号</h3>
        <div className="grid grid-cols-2 gap-[16px]">
          {[
            { key: "username", label: "用户名", type: "text" },
            { key: "name", label: "姓名", type: "text" },
            { key: "password", label: "初始密码", type: "password" },
          ].map((item) => (
            <div key={item.key} className={item.key === "password" ? "col-span-2" : ""}>
              <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">{item.label}</label>
              <input
                type={item.type}
                value={form[item.key as keyof CreateForm]}
                onChange={(event) => onChange(item.key as keyof CreateForm, event.target.value)}
                className="h-[42px] w-full rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
              />
            </div>
          ))}

          <div className="col-span-2">
            <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">角色</label>
            <div className="flex gap-[10px]">
              {[
                { label: "普通用户", value: "user" },
                { label: "公司管理员", value: "branch_admin" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChange("role", item.value)}
                  className={`h-[40px] rounded-[10px] px-[16px] text-[13px] font-semibold ${
                    form.role === item.value ? "bg-[#272b30] text-white" : "bg-[#f4f4f4] text-[#6f767e]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-[28px] flex gap-[12px]">
          <button type="button" onClick={onCancel} disabled={saving} className="h-[44px] flex-1 rounded-[10px] border border-[#efefef] bg-white text-[14px] font-semibold text-[#6f767e]">
            取消
          </button>
          <button type="button" onClick={onConfirm} disabled={saving} className="h-[44px] flex-1 rounded-[10px] bg-[#272b30] text-[14px] font-semibold text-white">
            {saving ? "保存中..." : "确认创建"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileModal({
  form,
  saving,
  onChange,
  onCancel,
  onConfirm,
}: {
  form: ProfileForm;
  saving: boolean;
  onChange: (field: keyof ProfileForm, value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative w-[460px] rounded-[16px] bg-white p-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        <h3 className="mb-[24px] text-[18px] font-semibold text-[#272b30]">修改我的资料</h3>
        <div className="flex flex-col gap-[16px]">
          {[
            { key: "name", label: "姓名" },
            { key: "email", label: "邮箱" },
            { key: "phone", label: "手机号" },
          ].map((item) => (
            <div key={item.key}>
              <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">{item.label}</label>
              <input
                value={form[item.key as keyof ProfileForm]}
                onChange={(event) => onChange(item.key as keyof ProfileForm, event.target.value)}
                className="h-[42px] w-full rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
              />
            </div>
          ))}
        </div>
        <div className="mt-[28px] flex gap-[12px]">
          <button type="button" onClick={onCancel} disabled={saving} className="h-[44px] flex-1 rounded-[10px] border border-[#efefef] bg-white text-[14px] font-semibold text-[#6f767e]">
            取消
          </button>
          <button type="button" onClick={onConfirm} disabled={saving} className="h-[44px] flex-1 rounded-[10px] bg-[#272b30] text-[14px] font-semibold text-white">
            {saving ? "保存中..." : "确认保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordModal({
  saving,
  onCancel,
  onConfirm,
}: {
  saving: boolean;
  onCancel: () => void;
  onConfirm: (payload: { oldPassword: string; newPassword: string }) => void;
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative w-[460px] rounded-[16px] bg-white p-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        <h3 className="mb-[24px] text-[18px] font-semibold text-[#272b30]">修改密码</h3>
        <div className="flex flex-col gap-[16px]">
          <div>
            <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">原密码</label>
            <input type="password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} className="h-[42px] w-full rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]" />
          </div>
          <div>
            <label className="mb-[6px] block text-[13px] font-medium text-[#6f767e]">新密码</label>
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="h-[42px] w-full rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]" />
          </div>
        </div>
        <div className="mt-[28px] flex gap-[12px]">
          <button type="button" onClick={onCancel} disabled={saving} className="h-[44px] flex-1 rounded-[10px] border border-[#efefef] bg-white text-[14px] font-semibold text-[#6f767e]">
            取消
          </button>
          <button type="button" onClick={() => onConfirm({ oldPassword, newPassword })} disabled={saving} className="h-[44px] flex-1 rounded-[10px] bg-[#272b30] text-[14px] font-semibold text-white">
            {saving ? "提交中..." : "确认修改"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AccountPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE_FORM);
  const [profileForm, setProfileForm] = useState<ProfileForm>({ name: "", email: "", phone: "" });

  const canManageAccounts = currentUser?.role === "admin" || currentUser?.role === "branch_admin";

  const loadData = async () => {
    setLoading(true);
    setPageError("");
    try {
      const [me, page] = await Promise.all([
        fetchCurrentUser(),
        fetchAccounts({ page: 1, size: 100, keyword: keyword.trim() || undefined }),
      ]);
      setCurrentUser(me);
      setAccounts(page.list);
      setProfileForm({
        name: me.name || "",
        email: me.email || "",
        phone: me.phone || "",
      });
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "账号数据加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [keyword]);

  const visibleAccounts = useMemo(() => {
    const scopedAccounts = canManageAccounts ? accounts : accounts.filter((item) => item.id === currentUser?.id);
    const search = keyword.trim().toLowerCase();
    if (!search) return scopedAccounts;
    return scopedAccounts.filter((item) =>
      [item.username, item.name, item.role].filter(Boolean).some((value) => String(value).toLowerCase().includes(search)),
    );
  }, [accounts, canManageAccounts, currentUser?.id, keyword]);

  const handleCreate = async () => {
    if (!createForm.username.trim() || !createForm.password.trim() || !createForm.name.trim()) {
      setPageError("用户名、姓名和密码不能为空");
      return;
    }
    setSaving(true);
    setPageError("");
    try {
      await createAccount({
        ...createForm,
        companyId: currentUser?.companyId ?? undefined,
      });
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE_FORM);
      await loadData();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "创建账号失败");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (account: AccountRecord) => {
    setSaving(true);
    setPageError("");
    try {
      await updateAccountStatus(account.id, account.status === "enabled" ? "disabled" : "enabled");
      await loadData();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "更新账号状态失败");
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    setPageError("");
    try {
      await updateMyProfile(profileForm);
      setShowProfile(false);
      await loadData();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "保存个人资料失败");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (payload: { oldPassword: string; newPassword: string }) => {
    if (!payload.oldPassword || !payload.newPassword) {
      setPageError("原密码和新密码不能为空");
      return;
    }
    setSaving(true);
    setPageError("");
    try {
      await updateMyPassword(payload);
      setShowPassword(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "修改密码失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-[40px] py-[40px]">
      <div className="mb-[28px] flex items-center justify-between">
        <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.6px] text-[#272b30]">账号管理</h1>
      </div>

      <div className="flex flex-col gap-[24px]">
        {pageError ? (
          <div className="rounded-[12px] border border-[#ffd8bf] bg-[#fff7e6] px-[16px] py-[12px] text-[13px] text-[#ad6800]">{pageError}</div>
        ) : null}

        <div className="flex items-center justify-between gap-[16px] rounded-[16px] bg-[#fcfcfc] p-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索用户名、姓名或角色"
            className="h-[40px] w-[320px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] px-[12px] text-[13px] text-[#272b30] outline-none focus:border-[#272b30]"
          />
          <div className="flex items-center gap-[10px]">
            <button type="button" onClick={() => setShowProfile(true)} className="h-[40px] rounded-[10px] border border-[#efefef] bg-white px-[14px] text-[13px] font-semibold text-[#272b30]">
              修改资料
            </button>
            <button type="button" onClick={() => setShowPassword(true)} className="h-[40px] rounded-[10px] border border-[#efefef] bg-white px-[14px] text-[13px] font-semibold text-[#272b30]">
              修改密码
            </button>
            {canManageAccounts ? (
              <button type="button" onClick={() => setShowCreate(true)} className="h-[40px] rounded-[10px] bg-[#272b30] px-[16px] text-[13px] font-semibold text-white">
                新增账号
              </button>
            ) : null}
          </div>
        </div>

        {currentUser ? (
          <div className="rounded-[16px] bg-[#fcfcfc] p-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <h2 className="mb-[14px] text-[16px] font-semibold text-[#272b30]">当前登录账号</h2>
            <div className="grid grid-cols-4 gap-[16px]">
              {[
                { label: "用户名", value: currentUser.username },
                { label: "姓名", value: currentUser.name || "-" },
                { label: "角色", value: getRoleLabel(currentUser.role) },
                { label: "邮箱", value: currentUser.email || "-" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[12px] text-[#9a9fa5]">{item.label}</div>
                  <div className="mt-[4px] text-[14px] font-semibold text-[#272b30]">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[16px] bg-[#fcfcfc] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f4f4]">
                  {["用户名", "姓名", "角色", "邮箱", "状态", "创建时间", "操作"].map((header) => (
                    <th key={header} className="whitespace-nowrap px-[20px] py-[12px] text-left text-[12px] font-semibold text-[#6f767e]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-[48px] text-center text-[14px] text-[#9a9fa5]">
                      账号列表加载中...
                    </td>
                  </tr>
                ) : visibleAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-[48px] text-center text-[14px] text-[#9a9fa5]">
                      暂无账号数据
                    </td>
                  </tr>
                ) : (
                  visibleAccounts.map((account) => {
                    const isSelf = currentUser?.id === account.id;
                    return (
                      <tr key={account.id} className="border-b border-[#f4f4f4] last:border-b-0 transition-colors hover:bg-[#fafafa]">
                        <td className="px-[20px] py-[15px] text-[13px] font-semibold text-[#272b30]">{account.username}</td>
                        <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{account.name}</td>
                        <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{getRoleLabel(account.role)}</td>
                        <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{account.email || "-"}</td>
                        <td className="px-[20px] py-[15px]">
                          <span className={`inline-flex h-[26px] items-center rounded-[999px] px-[10px] text-[12px] font-semibold ${account.status === "enabled" ? "bg-[#e6f9f0] text-[#0d9f5f]" : "bg-[#f4f4f4] text-[#9a9fa5]"}`}>
                            {getStatusLabel(account.status)}
                          </span>
                        </td>
                        <td className="px-[20px] py-[15px] text-[13px] text-[#6f767e]">{account.createdAt || "-"}</td>
                        <td className="px-[20px] py-[15px]">
                          {canManageAccounts ? (
                            <button
                              type="button"
                              onClick={() => void handleStatusToggle(account)}
                              disabled={saving || isSelf}
                              className="h-[30px] rounded-[8px] border border-[#efefef] bg-white px-[12px] text-[12px] font-semibold text-[#272b30] disabled:opacity-50"
                            >
                              {account.status === "enabled" ? "停用" : "启用"}
                            </button>
                          ) : (
                            <span className="text-[12px] text-[#9a9fa5]">仅可修改本人资料</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreate ? (
        <AccountModal
          form={createForm}
          saving={saving}
          onChange={(field, value) => setCreateForm((prev) => ({ ...prev, [field]: value }))}
          onCancel={() => setShowCreate(false)}
          onConfirm={() => void handleCreate()}
        />
      ) : null}

      {showProfile ? (
        <ProfileModal
          form={profileForm}
          saving={saving}
          onChange={(field, value) => setProfileForm((prev) => ({ ...prev, [field]: value }))}
          onCancel={() => setShowProfile(false)}
          onConfirm={() => void handleProfileSave()}
        />
      ) : null}

      {showPassword ? <PasswordModal saving={saving} onCancel={() => setShowPassword(false)} onConfirm={(payload) => void handlePasswordSave(payload)} /> : null}
    </div>
  );
}
