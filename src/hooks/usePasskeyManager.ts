"use client";

import { useState, useCallback } from 'react';
import { registerPasskey, detectDeviceName } from '@/lib/passkey';
import db, { type PasskeyMetadata } from '@/lib/storage/db';
import { showSuccess, showError } from '@/lib/toast';

// ========================================
// Constants
// ========================================

const PASSKEY_MESSAGES = {
  ALREADY_EXISTS: '此設備已加入',
  NAME_EXISTS: '名稱已存在，請使用其他名稱',
  EMPTY_NAME: '名稱不能為空',
  CANNOT_DELETE_DEFAULT: '無法刪除預設 Passkey，請先設定其他 Passkey 為預設',
  MINIMUM_ONE: '至少需要保留一個 Passkey',
  WAIT_CURRENT: '請等待當前 Passkey 註冊完成',
  CANCELLED: '已取消 Passkey 註冊',
} as const;

// ========================================
// Types
// ========================================

interface UsePasskeyManagerReturn {
  /** Whether a passkey operation is in progress */
  isProcessing: boolean;
  /** Register a new passkey */
  addPasskey: (customName?: string, existingCredentialIds?: string[]) => Promise<PasskeyMetadata | null>;
  /** Remove a passkey by ID */
  removePasskey: (id: string) => Promise<boolean>;
  /** Update a passkey's display name */
  updatePasskeyName: (id: string, newName: string, existingNames?: string[]) => Promise<boolean>;
  /** Set a passkey as the default */
  setDefaultPasskey: (id: string) => Promise<boolean>;
}

/**
 * Hook for managing passkey CRUD operations.
 *
 * Handles registration, removal, renaming, and default selection of passkeys.
 * All operations are persisted to IndexedDB and show appropriate toast messages.
 *
 * @example
 * ```tsx
 * const { isProcessing, addPasskey, removePasskey } = usePasskeyManager();
 *
 * const handleAdd = async () => {
 *   const newPasskey = await addPasskey('My Device');
 *   if (newPasskey) console.log('Added:', newPasskey.name);
 * };
 * ```
 */
export function usePasskeyManager(): UsePasskeyManagerReturn {
  const [isProcessing, setIsProcessing] = useState(false);

  /** Fetch passkeys from IndexedDB */
  const getPasskeysFromDB = useCallback(async () => {
    const setting = await db.settings.get({ key: 'passkeys_metadata' });
    return {
      passkeys: (setting?.value as PasskeyMetadata[]) || [],
      settingId: setting?.id,
    };
  }, []);

  /** Save passkeys to IndexedDB */
  const savePasskeysToDB = useCallback(async (passkeys: PasskeyMetadata[], settingId?: number) => {
    await db.settings.put({
      id: settingId,
      key: 'passkeys_metadata',
      value: passkeys,
    });
  }, []);

  const addPasskey = async (customName?: string, existingCredentialIds?: string[]) => {
    if (isProcessing) {
      showError(PASSKEY_MESSAGES.WAIT_CURRENT);
      return null;
    }

    setIsProcessing(true);
    try {
      const result = await registerPasskey(customName || 'temp-user');
      const { passkeys: existingPasskeys, settingId } = await getPasskeysFromDB();

      const allCredentialIds = [
        ...existingPasskeys.map(pk => pk.credentialId),
        ...(existingCredentialIds || []),
      ];

      if (allCredentialIds.includes(result.credentialId)) {
        showError(PASSKEY_MESSAGES.ALREADY_EXISTS);
        return null;
      }

      const deviceName = customName || await detectDeviceName(result.authenticatorAttachment);
      const isFirstPasskey = existingPasskeys.length === 0;

      const newPasskey: PasskeyMetadata = {
        id: crypto.randomUUID(),
        credentialId: result.credentialId,
        name: deviceName,
        isDefault: isFirstPasskey,
        createdAt: Date.now(),
      };

      const updatedPasskeys = [...existingPasskeys, newPasskey];
      await savePasskeysToDB(updatedPasskeys, settingId);

      showSuccess(
        "Passkey 新增成功",
        `${newPasskey.name}${isFirstPasskey ? ' 已設為預設' : ''}`
      );

      return newPasskey;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          showError(PASSKEY_MESSAGES.CANCELLED);
        } else if (error.name === 'InvalidStateError') {
          showError(PASSKEY_MESSAGES.ALREADY_EXISTS);
        } else {
          showError("Passkey 註冊失敗", error.message);
        }
      } else {
        showError("Passkey 註冊失敗");
      }
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const removePasskey = async (id: string) => {
    const { passkeys, settingId } = await getPasskeysFromDB();
    const passkeyToRemove = passkeys.find(p => p.id === id);

    if (passkeyToRemove?.isDefault) {
      showError("無法刪除預設 Passkey", "請先設定其他 Passkey 為預設");
      return false;
    }

    if (passkeys.length <= 1) {
      showError("無法刪除", PASSKEY_MESSAGES.MINIMUM_ONE);
      return false;
    }

    const updatedPasskeys = passkeys.filter(p => p.id !== id);
    await savePasskeysToDB(updatedPasskeys, settingId);

    showSuccess("Passkey 已移除", passkeyToRemove?.name);
    return true;
  };

  const updatePasskeyName = async (id: string, newName: string, existingNames?: string[]) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      showError(PASSKEY_MESSAGES.EMPTY_NAME);
      return false;
    }

    const { passkeys, settingId } = await getPasskeysFromDB();

    const allNames = [...passkeys.map(p => p.name), ...(existingNames || [])];
    if (allNames.some(name => name === trimmedName && passkeys.find(p => p.name === name)?.id !== id)) {
      showError(PASSKEY_MESSAGES.NAME_EXISTS);
      return false;
    }

    const updatedPasskeys = passkeys.map(p =>
      p.id === id ? { ...p, name: trimmedName } : p
    );

    await savePasskeysToDB(updatedPasskeys, settingId);
    showSuccess("Passkey 名稱已更新");
    return true;
  };

  const setDefaultPasskey = async (id: string) => {
    const { passkeys, settingId } = await getPasskeysFromDB();
    const updatedPasskeys = passkeys.map(p => ({
      ...p,
      isDefault: p.id === id,
    }));

    await savePasskeysToDB(updatedPasskeys, settingId);

    const passkeyName = passkeys.find(p => p.id === id)?.name;
    showSuccess("預設 Passkey 已更新", passkeyName);
    return true;
  };

  return {
    isProcessing,
    addPasskey,
    removePasskey,
    updatePasskeyName,
    setDefaultPasskey,
  };
}
