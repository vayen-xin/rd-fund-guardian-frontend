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
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[500px] p-[32px]">
        <h3 className="text-[18px] font-semibold text-[#272b30] mb-[24px]">新增账号</h3>
        <div className="grid grid-cols-2 gap-[16px]">
          {[
            { key: "username", label: "用户名", type: "text" },
            { key: "name", label: "姓名", type: "text" },
            { key: "password", label: "初始密码", type: "password" },
          ].map((item) => (
            <div key={item.key} className={item.key === "password" ? "col-span-2" : ""}>
              <label className="block text-[#6f767e] text-[13px] font-medium mb-[6px]">{item.label}</label>
              <input
                type={item.type}
                value={form[item.key as keyof CreateForm]}
                onChange={(event) => onChange(item.key as keyof CreateForm, event.target.value)}
                className="w-full h-[42px] px-[12px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30]"
              />
            </div>
          ))}

          <div className="col-span-2">
            <label className="block text-[#6f767e] text-[13px] font-medium mb-[6px]">角色</label>
            <div className="flex gap-[10px]">
              {[
                { label: "普通用户", value: "user" },
                { label: "公司管理员", value: "branch_admin" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => onChange("role", item.value)}
                  className={`px-[16px] h-[40px] rounded-[10px] text-[13px] font-semibold transition-colors ${
                    form.role === item.value ? "bg-[#272b30] text-white" : "bg-[#f4f4f4] text-[#6f767e]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-[12px] mt-[28px]">
          <button onClick={onCancel} disabled={saving} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold">
            取消
          </button>
          <button onClick={onConfirm} disabled={saving} className="flex-1 h-[44px] rounded-[10px] bg-[#272b30] text-white text-[14px] font-semibold">
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
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[460px] p-[32px]">
        <h3 className="text-[18px] font-semibold text-[#272b30] mb-[24px]">修改我的资料</h3>
        <div className="flex flex-col gap-[16px]">
          {[
            { key: "name", label: "姓名" },
            { key: "email", label: "邮箱" },
            { key: "phone", label: "手机号" },
          ].map((item) => (
            <div key={item.key}>
              <label className="block text-[#6f767e] text-[13px] font-medium mb-[6px]">{item.label}</label>
              <input
                value={form[item.key as keyof ProfileForm]}
                onChange={(event) => onChange(item.key as keyof ProfileForm, event.target.value)}
                className="w-full h-[42px] px-[12px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30]"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-[12px] mt-[28px]">
          <button onClick={onCancel} disabled={saving} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold">
            取消
          </button>
          <button onClick={onConfirm} disabled={saving} className="flex-1 h-[44px] rounded-[10px] bg-[#272b30] text-white text-[14px] font-semibold">
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
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[460px] p-[32px]">
        <h3 className="text-[18px] font-semibold text-[#272b30] mb-[24px]">修改密码</h3>
        <div className="flex flex-col gap-[16px]">
          <div>
            <label className="block text-[#6f767e] text-[13px] font-medium mb-[6px]">原密码</label>
            <input type="password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} className="w-full h-[42px] px-[12px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30]" />
          </div>
          <div>
            <label className="block text-[#6f767e] text-[13px] font-medium mb-[6px]">新密码</label>
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full h-[42px] px-[12px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30]" />
          </div>
        </div>
        <div className="flex gap-[12px] mt-[28px]">
          <button onClick={onCancel} disabled={saving} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold">
            取消
          </button>
          <button onClick={() => onConfirm({ oldPassword, newPassword })} disabled={saving} className="flex-1 h-[44px] rounded-[10px] bg-[#272b30] text-white text-[14px] font-semibold">
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

  const filteredAccounts = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) {
      return accounts;
    }
    return accounts.filter((item) =>
      [item.username, item.name, item.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    );
  }, [accounts, keyword]);

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
      <div className="flex items-center justify-between mb-[28px]">
        <h1 className="font-semibold text-[32px] text-[#272b30] leading-[40px] tracking-[-0.6px]">账号管理</h1>
      </div>

      <div className="flex flex-col gap-[24px]">
        {pageError && (
          <div className="rounded-[12px] border border-[#ffd8bf] bg-[#fff7e6] px-[16px] py-[12px] text-[#ad6800] text-[13px]">
            {pageError}
          </div>
        )}

        <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-[20px] flex items-center justify-between gap-[16px]">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索用户名、姓名或角色"
            className="h-[40px] w-[320px] px-[12px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30]"
          />
          <div className="flex items-center gap-[10px]">
            <button onClick={() => setShowProfile(true)} className="px-[14px] h-[40px] rounded-[10px] border border-[#efefef] bg-white text-[#272b30] text-[13px] font-semibold">
              修改资料
            </button>
            <button onClick={() => setShowPassword(true)} className="px-[14px] h-[40px] rounded-[10px] border border-[#efefef] bg-white text-[#272b30] text-[13px] font-semibold">
              修改密码
            </button>
            <button onClick={() => setShowCreate(true)} className="px-[16px] h-[40px] rounded-[10px] bg-[#272b30] text-white text-[13px] font-semibold">
              新增账号
            </button>
          </div>
        </div>

        {currentUser && (
          <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-[24px]">
            <h2 className="text-[16px] font-semibold text-[#272b30] mb-[14px]">当前登录账号</h2>
            <div className="grid grid-cols-4 gap-[16px]">
              {[
                { label: "用户名", value: currentUser.username },
                { label: "姓名", value: currentUser.name || "-" },
                { label: "角色", value: getRoleLabel(currentUser.role) },
                { label: "邮箱", value: currentUser.email || "-" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[12px] text-[#9a9fa5]">{item.label}</div>
                  <div className="text-[14px] text-[#272b30] font-semibold mt-[4px]">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f4f4]">
                  {["用户名", "姓名", "角色", "邮箱", "状态", "创建时间", "操作"].map((header) => (
                    <th key={header} className="text-left px-[20px] py-[12px] text-[#6f767e] text-[12px] font-semibold whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-[48px] text-[#9a9fa5] text-[14px]">
                      账号列表加载中...
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-[48px] text-[#9a9fa5] text-[14px]">
                      暂无账号数据
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => {
                    const isSelf = currentUser?.id === account.id;
                    return (
                      <tr key={account.id} className="border-b border-[#f4f4f4] last:border-b-0 hover:bg-[#fafafa] transition-colors">
                        <td className="px-[20px] py-[15px] text-[#272b30] text-[13px] font-semibold">{account.username}</td>
                        <td className="px-[20px] py-[15px] text-[#6f767e] text-[13px]">{account.name}</td>
                        <td className="px-[20px] py-[15px] text-[#6f767e] text-[13px]">{getRoleLabel(account.role)}</td>
                        <td className="px-[20px] py-[15px] text-[#6f767e] text-[13px]">{account.email || "-"}</td>
                        <td className="px-[20px] py-[15px]">
                          <span className={`inline-flex items-center px-[10px] h-[26px] rounded-[999px] text-[12px] font-semibold ${account.status === "enabled" ? "bg-[#e6f9f0] text-[#0d9f5f]" : "bg-[#f4f4f4] text-[#9a9fa5]"}`}>
                            {getStatusLabel(account.status)}
                          </span>
                        </td>
                        <td className="px-[20px] py-[15px] text-[#6f767e] text-[13px]">{account.createdAt || "-"}</td>
                        <td className="px-[20px] py-[15px]">
                          <button
                            onClick={() => void handleStatusToggle(account)}
                            disabled={saving || isSelf}
                            className="px-[12px] h-[30px] rounded-[8px] border border-[#efefef] bg-white text-[#272b30] text-[12px] font-semibold disabled:opacity-50"
                          >
                            {account.status === "enabled" ? "停用" : "启用"}
                          </button>
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

      {showCreate && (
        <AccountModal
          form={createForm}
          saving={saving}
          onChange={(field, value) => setCreateForm((prev) => ({ ...prev, [field]: value }))}
          onCancel={() => setShowCreate(false)}
          onConfirm={() => void handleCreate()}
        />
      )}

      {showProfile && (
        <ProfileModal
          form={profileForm}
          saving={saving}
          onChange={(field, value) => setProfileForm((prev) => ({ ...prev, [field]: value }))}
          onCancel={() => setShowProfile(false)}
          onConfirm={() => void handleProfileSave()}
        />
      )}

      {showPassword && <PasswordModal saving={saving} onCancel={() => setShowPassword(false)} onConfirm={(payload) => void handlePasswordSave(payload)} />}
    </div>
  );
}
