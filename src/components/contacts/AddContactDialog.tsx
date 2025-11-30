"use client";

import { useState, memo } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fadeInUp, stepTransition } from "@/lib/animations";
import db from "@/lib/storage/db";
import { showSuccess, showError } from "@/lib/toast";

interface AddContactDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  // Pre-fill from QR scan or NFC
  initialAddress?: string;
  initialName?: string;
}

type AddContactStep = 'input' | 'success';

// Common emojis for contacts
const CONTACT_EMOJIS = ['👤', '👩', '👨', '🧑', '👧', '👦', '🤵', '👩‍💼', '👨‍💼', '🦸', '🦹', '🧙'];

/**
 * 新增聯絡人對話框
 * Spec: 手動新增或從 QR/NFC 導入
 */
function AddContactDialogComponent({
  trigger,
  onSuccess,
  initialAddress = "",
  initialName = "",
}: AddContactDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<AddContactStep>('input');
  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const [emoji, setEmoji] = useState('👤');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressError, setAddressError] = useState('');

  // Validate address
  const validateAddress = (addr: string): boolean => {
    if (!addr) return false;
    try {
      ethers.getAddress(addr); // Will throw if invalid
      return true;
    } catch {
      return false;
    }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    if (value && !validateAddress(value)) {
      setAddressError('請輸入有效的錢包地址');
    } else {
      setAddressError('');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      showError("請輸入聯絡人名稱");
      return;
    }
    if (!validateAddress(address)) {
      showError("請輸入有效的錢包地址");
      return;
    }

    setIsSubmitting(true);

    try {
      // Normalize address to checksum format for consistent comparison
      const checksumAddress = ethers.getAddress(address);

      // Check if contact already exists (using normalized address)
      const existing = await db.contacts.where('address').equals(checksumAddress).first();
      if (existing) {
        showError("地址重複", "此地址已存在於聯絡簿中");
        setIsSubmitting(false);
        return;
      }

      // Add to IndexedDB
      await db.contacts.add({
        name: name.trim(),
        address: checksumAddress,
        emoji,
        notes: notes.trim() || undefined,
        createdAt: Date.now(),
      });

      setStep('success');
      showSuccess("已新增聯絡人", `${emoji} ${name} 已加入聯絡簿`);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to add contact:', error);
      showError("新增失敗", "請稍後重試");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setStep('input');
      setName(initialName);
      setAddress(initialAddress);
      setEmoji('👤');
      setNotes('');
      setAddressError('');
    }, 300);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Reset to initial values when opening
      setName(initialName);
      setAddress(initialAddress);
    } else {
      setTimeout(() => {
        setStep('input');
        setName(initialName);
        setAddress(initialAddress);
        setEmoji('👤');
        setNotes('');
        setAddressError('');
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-keylio-teal hover:bg-keylio-teal/90">
            <Plus className="w-4 h-4 mr-2" />
            新增
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="bg-keylio-bg-secondary border-keylio-border-primary max-w-md">
        <DialogHeader>
          <DialogTitle className="text-keylio-text-primary">
            {step === 'success' ? '新增成功' : '新增聯絡人'}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Input Step */}
          {step === 'input' && (
            <motion.div
              key="input"
              variants={stepTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              {/* Emoji Selector */}
              <div className="space-y-2">
                <Label className="text-keylio-text-secondary">圖示</Label>
                <div className="flex flex-wrap gap-2">
                  {CONTACT_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        emoji === e
                          ? 'bg-keylio-teal/20 border-2 border-keylio-teal'
                          : 'bg-keylio-bg-tertiary border border-keylio-border-primary hover:border-keylio-teal/50'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-keylio-text-secondary">
                  名稱 <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="例如：Alice"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-keylio-bg-tertiary border-keylio-border-primary"
                />
              </div>

              {/* Address Input */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-keylio-text-secondary">
                  錢包地址 <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="0x..."
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  className={`bg-keylio-bg-tertiary border-keylio-border-primary font-mono text-sm ${
                    addressError ? 'border-red-500' : ''
                  }`}
                />
                {addressError ? <p className="text-xs text-red-400">{addressError}</p> : null}
              </div>

              {/* Notes Input */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-keylio-text-secondary">
                  備註 <span className="text-keylio-text-muted">(選填)</span>
                </Label>
                <Input
                  id="notes"
                  placeholder="例如：同事、咖啡錢"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-keylio-bg-tertiary border-keylio-border-primary"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !name.trim() || !address || !!addressError}
                className="w-full h-12 bg-keylio-teal hover:bg-keylio-teal/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    新增中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    新增聯絡人
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <motion.div
              key="success"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="py-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-xl font-semibold text-keylio-text-primary mb-2">
                已新增聯絡人
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-2xl">{emoji}</span>
                <span className="text-lg text-keylio-text-primary">{name}</span>
              </div>
              <p className="text-xs text-keylio-text-muted font-mono mb-6">
                {address.slice(0, 10)}...{address.slice(-8)}
              </p>
              <Button
                onClick={handleClose}
                className="w-full h-12 bg-keylio-teal hover:bg-keylio-teal/90 text-white"
              >
                完成
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export const AddContactDialog = memo(AddContactDialogComponent);
export default AddContactDialog;
