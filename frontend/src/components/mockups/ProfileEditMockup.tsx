import { useState } from "react";

type ProfileEditMockupProps = {
  description?: string;
};

type ProfileForm = {
  displayName: string;
  jobTitle: string;
  bio: string;
  location: string;
};

const initialForm: ProfileForm = {
  displayName: "Yamada Taro",
  jobTitle: "Product Manager",
  bio: "B2B SaaSのPMとして、要件定義と改善施策を担当しています。",
  location: "Tokyo, Japan",
};

export function ProfileEditMockup({ description }: ProfileEditMockupProps) {
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [saved, setSaved] = useState(false);
  const [avatarName, setAvatarName] = useState("profile.png");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onChange =
    (key: keyof ProfileForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSaved(false);
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.displayName.trim()) nextErrors.displayName = "表示名を入力してください";
    if (form.displayName.length > 50) nextErrors.displayName = "表示名は50文字以内で入力してください";
    if (form.bio.length > 160) nextErrors.bio = "自己紹介は160文字以内で入力してください";
    return nextErrors;
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setSaved(true);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900">プロフィール編集</h2>
      {description ? <p className="mt-2 text-sm text-gray-500">{description}</p> : null}

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div className="rounded-md border border-gray-200 p-3">
          <p className="text-xs font-medium text-gray-600">プロフィール画像</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-sm text-gray-700">{avatarName}</p>
            <label className="cursor-pointer rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50">
              変更
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setAvatarName(file.name);
                  setSaved(false);
                }}
              />
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="profile-display-name" className="mb-1 block text-sm font-medium text-gray-700">
            表示名
          </label>
          <input
            id="profile-display-name"
            type="text"
            value={form.displayName}
            onChange={onChange("displayName")}
            className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.displayName ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.displayName ? <p className="mt-1 text-xs text-red-500">{errors.displayName}</p> : null}
        </div>

        <div>
          <label htmlFor="profile-job-title" className="mb-1 block text-sm font-medium text-gray-700">
            役職
          </label>
          <input
            id="profile-job-title"
            type="text"
            value={form.jobTitle}
            onChange={onChange("jobTitle")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="profile-location" className="mb-1 block text-sm font-medium text-gray-700">
            所在地
          </label>
          <input
            id="profile-location"
            type="text"
            value={form.location}
            onChange={onChange("location")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="profile-bio" className="mb-1 block text-sm font-medium text-gray-700">
            自己紹介
          </label>
          <textarea
            id="profile-bio"
            rows={3}
            value={form.bio}
            onChange={onChange("bio")}
            className={`w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.bio ? "border-red-500" : "border-gray-300"
            }`}
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            {errors.bio ? <span className="text-red-500">{errors.bio}</span> : <span>最大160文字</span>}
            <span>{form.bio.length}/160</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          保存する
        </button>
      </form>

      {saved ? <p className="mt-2 text-xs text-green-600">プロフィールを更新しました。</p> : null}

      <div className="mt-4 rounded-md bg-gray-50 p-3 text-xs text-gray-500">
        <p className="mb-1 font-medium">仕様情報:</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>表示名: 必須、最大50文字</li>
          <li>自己紹介: 任意、最大160文字</li>
          <li>画像: PNG/JPEG/WEBP、最大5MB</li>
          <li>同時編集時は最新更新を確認して保存</li>
        </ul>
      </div>
    </div>
  );
}
