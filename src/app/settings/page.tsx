"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Shield,
  Palette,
  Wallet,
  ChevronRight,
  Fingerprint,
  HelpCircle,
  FileText,
  LogOut,
  MoreHorizontal,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useRouterContext } from "@/components/providers/RouterProvider";
import { AutoLockSettings } from "@/components/settings/AutoLockSettings";
import { BackupMnemonicDialog } from "@/components/settings/BackupMnemonicDialog";
import { CurrencySettings } from "@/components/settings/CurrencySettings";
import { HideBalanceSettings } from "@/components/settings/HideBalanceSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { LargeTransferSettings } from "@/components/settings/LargeTransferSettings";
import { PasskeyDialog } from "@/components/settings/PasskeyDialog";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { Card, CardContent } from "@/components/ui/card";
import { PageTransition, PageSection, PageHeader } from "@/components/ui/page-transition";
import { DashboardLayout } from "@/components/wallet/DashboardLayout";
import db, { type PasskeyMetadata } from "@/lib/storage/db";
import { showInfo } from "@/lib/toast";
import { useWalletStore } from "@/stores/useWalletStore";

export default function SettingsPage() {
  const [passkeyDialogOpen, setPasskeyDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const { navigateTo } = useRouterContext();
  const setUnlocked = useWalletStore((state) => state.setUnlocked);
  const destroySession = useWalletStore((state) => state.destroySession);

  const passkeys = useLiveQuery(async () => {
    const setting = await db.settings.get({ key: "passkeys_metadata" });
    return (setting?.value as PasskeyMetadata[]) || [];
  });

  const passkeyCount = passkeys?.length || 0;

  const handleLogout = () => {
    destroySession();
    setUnlocked(false);
    navigateTo("/");
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <PageTransition className="max-w-2xl mx-auto">
        {/* 頁面標題 */}
        <PageHeader title="設定" />

        {/* ===== 1. 偏好設定 ===== */}
        <PageSection>
          <SettingsSection
            title="偏好設定"
            icon={<Palette className="w-4 h-4" />}
            description="自訂應用程式的外觀和顯示偏好"
          >
            <Card className="bg-keylio-bg-secondary border-keylio-border-primary">
              <CardContent className="pt-5 divide-y divide-keylio-border-primary">
                {/* 深色模式 */}
                <div className="pb-4">
                  <ThemeSettings />
                </div>
                {/* 語言 */}
                <div className="py-4">
                  <LanguageSettings />
                </div>
                {/* 貨幣單位 */}
                <div className="pt-4">
                  <CurrencySettings />
                </div>
              </CardContent>
            </Card>
          </SettingsSection>
        </PageSection>

        {/* ===== 2. 安全 ===== */}
        <PageSection>
          <SettingsSection
            title="安全"
            icon={<Shield className="w-4 h-4" />}
            description="保護您的錢包和資產安全"
          >
            <Card className="bg-keylio-bg-secondary border-keylio-border-primary">
              <CardContent className="pt-5 divide-y divide-keylio-border-primary">
                {/* 隱藏餘額 */}
                <div className="pb-4">
                  <HideBalanceSettings />
                </div>
                {/* 自動鎖定 */}
                <div className="py-4">
                  <AutoLockSettings />
                </div>
                {/* 大額轉帳警告 */}
                <div className="pt-4">
                  <LargeTransferSettings />
                </div>
              </CardContent>
            </Card>
          </SettingsSection>
        </PageSection>

        {/* ===== 3. 進階 ===== */}
        <PageSection>
          <SettingsSection
            title="進階"
            icon={<Wallet className="w-4 h-4" />}
            description="備份與安全管理"
          >
          <Card className="bg-keylio-bg-secondary border-keylio-border-primary">
            <CardContent className="pt-5 divide-y divide-keylio-border-primary">
              {/* 生物辨識 */}
              <div className="pb-4">
                <button
                  onClick={() => setPasskeyDialogOpen(true)}
                  className="w-full flex items-center justify-between py-3 rounded-lg hover:bg-keylio-bg-tertiary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                      <Fingerprint className="w-5 h-5 text-teal-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-medium text-keylio-text-primary">生物辨識</p>
                      <p className="text-[13px] text-keylio-text-muted/70">
                        {passkeyCount > 0
                          ? `已設定 ${passkeyCount} 組裝置`
                          : "指紋或臉部辨識解鎖"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-keylio-text-muted" />
                </button>
              </div>
              {/* 備份助記詞 */}
              <div className="pt-4">
                <button
                  onClick={() => setBackupDialogOpen(true)}
                  className="w-full flex items-center justify-between py-3 rounded-lg hover:bg-keylio-bg-tertiary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-medium text-keylio-text-primary">備份助記詞</p>
                      <p className="text-[13px] text-keylio-text-muted/70">
                        檢視並備份恢復短語
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-keylio-text-muted" />
                </button>
              </div>
              </CardContent>
            </Card>
          </SettingsSection>
        </PageSection>

        {/* Dialogs */}
        <PasskeyDialog open={passkeyDialogOpen} onOpenChange={setPasskeyDialogOpen} />
        <BackupMnemonicDialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen} />

        {/* ===== 4. 更多 ===== */}
        <PageSection>
          <SettingsSection
            title="更多"
            icon={<MoreHorizontal className="w-4 h-4" />}
          >
            <Card className="bg-keylio-bg-secondary border-keylio-border-primary">
              <CardContent className="pt-5 divide-y divide-keylio-border-primary">
                {/* 幫助中心 */}
                <div className="pb-4">
                  <button
                    onClick={() => showInfo("即將推出", "幫助中心")}
                    className="w-full flex items-center justify-between py-3 rounded-lg hover:bg-keylio-bg-tertiary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-base font-medium text-keylio-text-primary">幫助中心</p>
                        <p className="text-[13px] text-keylio-text-muted/70">常見問題與支援</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-keylio-text-muted" />
                  </button>
                </div>
                {/* 隱私權條款 */}
                <div className="py-4">
                  <button
                    onClick={() => showInfo("即將推出", "隱私權條款")}
                    className="w-full flex items-center justify-between py-3 rounded-lg hover:bg-keylio-bg-tertiary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-base font-medium text-keylio-text-primary">隱私權條款</p>
                        <p className="text-[13px] text-keylio-text-muted/70">服務條款與隱私政策</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-keylio-text-muted" />
                  </button>
                </div>
                {/* 登出 */}
                <div className="pt-4">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between py-3 rounded-lg hover:bg-red-500/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                        <LogOut className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-base font-medium text-red-400">鎖定錢包</p>
                        <p className="text-[13px] text-keylio-text-muted/70">登出並鎖定錢包</p>
                      </div>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </SettingsSection>
        </PageSection>

        {/* 版本資訊 */}
        <PageSection>
          <div className="text-center text-xs text-keylio-text-muted pb-8">
            Keylio Wallet v0.1.0 (Beta)
          </div>
        </PageSection>
      </PageTransition>
    </DashboardLayout>
    </AuthGuard>
  );
}
