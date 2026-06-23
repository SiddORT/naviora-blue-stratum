"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { candidateService, type CandidateProfile } from "@/services/candidate.service";
import { CandidatePortalLayout } from "./CandidatePortalLayout";
import { User, Lock, Camera, Save } from "lucide-react";

function Field({ label, value, onChange, type = "text", readOnly = false }: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; readOnly?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        style={{
          background: readOnly ? "#0B0B0F" : "#1E2430",
          border: "1px solid #2A3441",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 14,
          color: readOnly ? "#6B7280" : "#F9FAFB",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

export function CandidateProfileView() {
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<"info" | "password">("info");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [rank, setRank] = useState("");
  const [dob, setDob] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(() => {
    const token = candidateService.getToken();
    if (!token) { router.replace("/candidate/login"); return; }
    (async () => {
      try {
        const res = await candidateService.getProfile(token);
        if (res.success && res.data) {
          const p = res.data;
          setProfile(p);
          setFullName(p.full_name ?? "");
          setPhone(p.phone ?? "");
          setNationality(p.nationality ?? "");
          setRank(p.rank_or_designation ?? "");
          setDob(p.date_of_birth ?? "");
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleSave = async () => {
    const token = candidateService.getToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await candidateService.updateProfile(token, {
        full_name: fullName,
        phone,
        nationality,
        rank_or_designation: rank,
        date_of_birth: dob || undefined,
      });
      if (res.success) {
        setSuccess("Profile updated successfully");
        if (res.data) {
          setProfile(res.data);
          const stored = candidateService.getUser();
          if (stored) {
            candidateService.setSession(token, { ...stored, full_name: res.data.full_name });
          }
        }
      } else {
        setError("Failed to update profile");
      }
    } catch {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPw !== confirmPw) { setError("Passwords do not match"); return; }
    if (newPw.length < 8) { setError("Password must be at least 8 characters"); return; }
    const token = candidateService.getToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await candidateService.changePassword(token, currentPw, newPw);
      if (res.success) {
        setSuccess("Password changed successfully");
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      } else {
        setError(res.message ?? "Failed to change password");
      }
    } catch {
      setError("Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = candidateService.getToken();
    if (!token) return;
    try {
      const res = await candidateService.uploadPhoto(token, file);
      if (res.success && res.data) {
        setProfile((prev) => prev ? { ...prev, avatar_url: res.data!.avatar_url } : prev);
        setSuccess("Photo updated");
      }
    } catch {
      setError("Failed to upload photo");
    }
  };

  if (loading) {
    return <CandidatePortalLayout><div style={{ textAlign: "center", padding: "80px 0", color: "#6B7280", fontSize: 14 }}>Loading...</div></CandidatePortalLayout>;
  }

  return (
    <CandidatePortalLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB", margin: 0 }}>Profile</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Manage your personal information</p>
        </div>

        {error && <div style={{ background: "#EF444415", border: "1px solid #EF444430", borderRadius: 10, padding: 14, color: "#EF4444", fontSize: 13 }}>{error}</div>}
        {success && <div style={{ background: "#10B98115", border: "1px solid #10B98130", borderRadius: 10, padding: 14, color: "#10B981", fontSize: 13 }}>{success}</div>}

        {/* Avatar */}
        <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#1E2430", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px solid #D4A63A30" }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <User size={28} color="#4B5563" />
              )}
            </div>
            <label style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderRadius: "50%", background: "#D4A63A", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Camera size={12} color="#0B0B0F" />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
            </label>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#F9FAFB" }}>{profile?.full_name}</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{profile?.email}</div>
            {profile?.seafarer_id && <div style={{ fontSize: 12, color: "#4B5563", fontFamily: "monospace", marginTop: 2 }}>ID: {profile.seafarer_id}</div>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#0B0B0F", padding: 4, borderRadius: 10, border: "1px solid #1E2430" }}>
          {([["info", "Personal Information", User], ["password", "Change Password", Lock]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => { setTab(key); setError(null); setSuccess(null); }}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                background: tab === key ? "#141821" : "transparent",
                color: tab === key ? "#F9FAFB" : "#6B7280",
              }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Full Name" value={fullName} onChange={setFullName} />
              <Field label="Email" value={profile?.email ?? ""} readOnly />
              <Field label="Phone" value={phone} onChange={setPhone} />
              <Field label="Nationality" value={nationality} onChange={setNationality} />
              <Field label="Rank / Designation" value={rank} onChange={setRank} />
              <Field label="Date of Birth" value={dob} onChange={setDob} type="date" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Seafarer ID" value={profile?.seafarer_id ?? ""} readOnly />
              <Field label="Organization" value={String(profile?.organization_id ?? "—")} readOnly />
            </div>
            <button onClick={handleSave} disabled={saving}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 24px", borderRadius: 8, border: "none", background: "#D4A63A", color: "#0B0B0F", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1, alignSelf: "flex-start" }}>
              <Save size={14} />{saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {tab === "password" && (
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Current Password" value={currentPw} onChange={setCurrentPw} type="password" />
            <Field label="New Password" value={newPw} onChange={setNewPw} type="password" />
            <Field label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} type="password" />
            <button onClick={handlePasswordChange} disabled={saving}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 24px", borderRadius: 8, border: "none", background: "#D4A63A", color: "#0B0B0F", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1, alignSelf: "flex-start" }}>
              <Lock size={14} />{saving ? "Saving..." : "Change Password"}
            </button>
          </div>
        )}
      </div>
    </CandidatePortalLayout>
  );
}
