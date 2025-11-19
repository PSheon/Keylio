"use client";

import { DashboardLayout } from "@/components/wallet/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { PasskeyDialog } from "@/components/settings/PasskeyDialog";
import { BackupDialog } from "@/components/settings/BackupDialog";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-keylio-text-primary">設定</h2>

        {/* Appearance */}
        <AppearanceSettings />

        {/* Security */}
        <Card className="bg-keylio-bg-secondary border-keylio-border-primary text-keylio-text-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-400" />
              安全性
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PasskeyDialog />
            <BackupDialog />
          </CardContent>
        </Card>

        <div className="text-center text-xs text-keylio-text-muted pt-8">
          Keylio Wallet v0.1.0 (Beta)
        </div>
      </div>
    </DashboardLayout>
  );
}
