"use client";

import { useState, useEffect, memo } from "react";
import { ethers } from "ethers";
import { Edit, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import db, { type Contact } from "@/lib/storage/db";
import { showSuccess, showError } from "@/lib/toast";

// 常用 Emoji 列表
const EMOJI_LIST = ["👤", "😀", "😎", "🤝", "💼", "🏠", "❤️", "⭐", "🎯", "🚀", "💰", "🔥"];

interface EditContactDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
}

/**
 * 編輯聯絡人對話框
 * Spec: 編輯現有聯絡人的名稱、emoji 和地址
 */
function EditContactDialogComponent({
  contact,
  open,
  onOpenChange,
  onDelete,
}: EditContactDialogProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [emoji, setEmoji] = useState("👤");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 錯誤狀態
  const [nameError, setNameError] = useState("");
  const [addressError, setAddressError] = useState("");

  // 當 contact 改變時重置表單
  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setAddress(contact.address);
      setEmoji(contact.emoji || "👤");
    }
  }, [contact]);

  // 重置表單
  const resetForm = () => {
    if (contact) {
      setName(contact.name);
      setAddress(contact.address);
      setEmoji(contact.emoji || "👤");
    }
    setNameError("");
    setAddressError("");
    setShowDeleteConfirm(false);
  };

  // 驗證表單
  const validateForm = (): boolean => {
    let isValid = true;

    // 驗證名稱
    if (!name.trim()) {
      setNameError("請輸入名稱");
      isValid = false;
    } else if (name.trim().length > 50) {
      setNameError("名稱不能超過 50 個字元");
      isValid = false;
    } else {
      setNameError("");
    }

    // 驗證地址
    try {
      ethers.getAddress(address.trim());
      setAddressError("");
    } catch {
      setAddressError("無效的錢包地址");
      isValid = false;
    }

    return isValid;
  };

  // 提交更新
  const handleSubmit = async () => {
    if (!contact?.id || !validateForm()) return;

    setIsSubmitting(true);

    try {
      // Normalize the new address
      const normalizedNewAddress = ethers.getAddress(address.trim());

      // 檢查新地址是否與其他聯絡人重複
      if (normalizedNewAddress.toLowerCase() !== contact.address.toLowerCase()) {
        const existing = await db.contacts
          .where('address')
          .equals(normalizedNewAddress)
          .first();

        if (existing && existing.id !== contact.id) {
          setAddressError("此地址已存在於聯絡簿中");
          setIsSubmitting(false);
          return;
        }
      }

      // 更新聯絡人
      await db.contacts.update(contact.id, {
        name: name.trim(),
        address: normalizedNewAddress,
        emoji,
      });

      showSuccess("聯絡人已更新", `${emoji} ${name.trim()}`);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update contact:", error);
      showError("更新失敗", "請稍後重試");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 刪除聯絡人
  const handleDelete = async () => {
    if (!contact?.id) return;

    setIsSubmitting(true);

    try {
      await db.contacts.delete(contact.id);
      showSuccess("聯絡人已刪除", contact.name);
      onOpenChange(false);
      onDelete?.();
    } catch (error) {
      console.error("Failed to delete contact:", error);
      showError("刪除失敗");
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!contact) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="bg-keylio-bg-secondary border-keylio-border-primary sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-keylio-text-primary flex items-center gap-2">
            <Edit className="w-5 h-5" />
            編輯聯絡人
          </DialogTitle>
          <DialogDescription className="text-keylio-text-muted">
            修改聯絡人的資訊
          </DialogDescription>
        </DialogHeader>

        {/* 刪除確認 */}
        {showDeleteConfirm ? (
          <div className="py-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-keylio-text-primary font-medium mb-2">
              確定要刪除嗎？
            </p>
            <p className="text-sm text-keylio-text-muted mb-6">
              此操作無法復原
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-keylio-border-primary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "確定刪除"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Emoji 選擇 */}
              <div className="space-y-2">
                <Label className="text-keylio-text-secondary">頭像</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_LIST.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        emoji === e
                          ? "bg-keylio-teal/20 ring-2 ring-keylio-teal"
                          : "bg-keylio-bg-tertiary hover:bg-keylio-bg-tertiary/80"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* 名稱輸入 */}
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-keylio-text-secondary">
                  名稱 *
                </Label>
                <Input
                  id="edit-name"
                  placeholder="輸入聯絡人名稱"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError("");
                  }}
                  className={`bg-keylio-bg-tertiary border-keylio-border-primary ${
                    nameError ? "border-red-500" : ""
                  }`}
                />
                {nameError ? <p className="text-xs text-red-400">{nameError}</p> : null}
              </div>

              {/* 地址輸入 */}
              <div className="space-y-2">
                <Label htmlFor="edit-address" className="text-keylio-text-secondary">
                  錢包地址 *
                </Label>
                <Input
                  id="edit-address"
                  placeholder="0x..."
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setAddressError("");
                  }}
                  className={`bg-keylio-bg-tertiary border-keylio-border-primary font-mono text-sm ${
                    addressError ? "border-red-500" : ""
                  }`}
                />
                {addressError ? <p className="text-xs text-red-400">{addressError}</p> : null}
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 sm:mr-auto"
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                刪除
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-keylio-border-primary"
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-keylio-teal hover:bg-keylio-teal/90"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                儲存變更
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const EditContactDialog = memo(EditContactDialogComponent);
export default EditContactDialog;
