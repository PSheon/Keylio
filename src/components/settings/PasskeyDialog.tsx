"use client";

import { memo, useState, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Fingerprint,
  Plus,
  Trash2,
  Star,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { AuthVerification } from "@/components/auth/AuthVerification";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePasskeyEditor } from "@/hooks/usePasskeyEditor";
import { usePasskeyManager } from "@/hooks/usePasskeyManager";
import db, { type PasskeyMetadata } from "@/lib/storage/db";
import { showError } from "@/lib/toast";

interface PasskeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Passkey 管理 Dialog
 * 包含驗證流程和裝置管理功能
 */
function PasskeyDialogComponent({ open, onOpenChange }: PasskeyDialogProps) {
  const [newPasskeyName, setNewPasskeyName] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  const passkeyManager = usePasskeyManager();
  const passkeyEditor = usePasskeyEditor();

  const passkeys = useLiveQuery(async () => {
    const setting = await db.settings.get({ key: "passkeys_metadata" });
    return (setting?.value as PasskeyMetadata[]) || [];
  });

  const resetDialog = useCallback(() => {
    setIsUnlocked(false);
    setNewPasskeyName("");
    passkeyEditor.cancelEditing();
  }, [passkeyEditor]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) resetDialog();
      onOpenChange(open);
    },
    [onOpenChange, resetDialog]
  );

  const handleAuthSuccess = useCallback(() => {
    setIsUnlocked(true);
  }, []);

  const handleAddPasskey = async () => {
    if (!newPasskeyName.trim()) {
      showError("請輸入 Passkey 名稱");
      return;
    }

    const newPasskey = await passkeyManager.addPasskey(newPasskeyName);
    if (newPasskey) {
      setNewPasskeyName("");
    }
  };

  const handleRemovePasskey = async (id: string) => {
    await passkeyManager.removePasskey(id);
  };

  const handleSetDefault = async (id: string) => {
    await passkeyManager.setDefaultPasskey(id);
  };

  const savePasskeyName = useCallback(
    async (id: string) => {
      const success = await passkeyManager.updatePasskeyName(
        id,
        passkeyEditor.editingName
      );
      if (success) {
        passkeyEditor.cancelEditing();
      }
    },
    [passkeyManager, passkeyEditor]
  );

  const passkeyCount = passkeys?.length || 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>生物辨識管理</DialogTitle>
          <DialogDescription>
            使用指紋或臉部辨識快速解鎖錢包
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          // 驗證畫面
          <DialogBody>
            <AuthVerification
              onSuccess={handleAuthSuccess}
              requirePassword={false}
              title="安全驗證"
              description={
                passkeyCount > 0
                  ? `已設定 ${passkeyCount} 組裝置`
                  : "尚未設定任何裝置"
              }
            />
          </DialogBody>
        ) : (
          // 管理畫面
          <>
            <DialogBody className="space-y-3">
              {passkeys?.map((pk) => (
                <div
                  key={pk.id}
                  className="flex items-center justify-between bg-keylio-bg-primary p-3 rounded-lg border border-keylio-border-primary"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Fingerprint className="w-4 h-4 text-teal-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {passkeyEditor.editingPasskeyId === pk.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            ref={passkeyEditor.editInputRef}
                            value={passkeyEditor.editingName}
                            onChange={(e) =>
                              passkeyEditor.setEditingName(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") savePasskeyName(pk.id);
                              if (e.key === "Escape")
                                passkeyEditor.cancelEditing();
                            }}
                            className="h-8 text-sm bg-keylio-bg-secondary border-keylio-border-primary"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => savePasskeyName(pk.id)}
                            className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10 shrink-0"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={passkeyEditor.cancelEditing}
                            className="h-8 w-8 text-keylio-text-muted hover:text-keylio-text-primary hover:bg-keylio-bg-tertiary shrink-0"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-medium flex items-center gap-2">
                            <span className="truncate">{pk.name}</span>
                            {pk.isDefault ? <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                <Star className="w-3 h-3 fill-current" />
                                預設
                              </span> : null}
                          </div>
                          <div className="text-xs text-keylio-text-muted">
                            {new Date(pk.createdAt).toLocaleDateString()}
                            {pk.lastUsed ? ` • 上次: ${new Date(pk.lastUsed).toLocaleDateString()}` : null}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {passkeyEditor.editingPasskeyId !== pk.id && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => passkeyEditor.startEditing(pk)}
                        className="h-8 w-8 text-keylio-text-muted hover:text-blue-500 hover:bg-blue-500/10"
                        title="編輯名稱"
                      >
                        <Edit2 size={16} />
                      </Button>
                      {!pk.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetDefault(pk.id)}
                          className="h-8 w-8 text-keylio-text-muted hover:text-teal-500 hover:bg-teal-500/10"
                          title="設為預設"
                        >
                          <Star size={16} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePasskey(pk.id)}
                        disabled={pk.isDefault}
                        className="h-8 w-8 text-keylio-text-muted hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={
                          pk.isDefault
                            ? "預設 Passkey 無法刪除"
                            : "刪除此 Passkey"
                        }
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {(!passkeys || passkeys.length === 0) && (
                <div className="text-center py-8 text-keylio-text-muted">
                  <Fingerprint className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>尚未設定任何 Passkey</p>
                  <p className="text-xs mt-1">
                    新增 Passkey 以啟用生物辨識登入
                  </p>
                </div>
              )}
            </DialogBody>

            <DialogFooter className="border-t border-keylio-border-primary pt-4">
              <div className="flex gap-2 w-full">
                <Input
                  placeholder="新 Passkey 名稱 (例如: iPad)"
                  value={newPasskeyName}
                  onChange={(e) => setNewPasskeyName(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      newPasskeyName.trim() &&
                      !passkeyManager.isProcessing
                    ) {
                      handleAddPasskey();
                    }
                  }}
                  disabled={passkeyManager.isProcessing}
                  className="bg-keylio-bg-primary border-keylio-border-primary focus:border-keylio-teal"
                />
                <Button
                  onClick={handleAddPasskey}
                  disabled={passkeyManager.isProcessing || !newPasskeyName.trim()}
                  className="bg-keylio-teal hover:bg-keylio-teal/90 shrink-0 disabled:opacity-50"
                >
                  {passkeyManager.isProcessing ? (
                    "儲存中..."
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const PasskeyDialog = memo(PasskeyDialogComponent);
