import { useState } from 'react';
import { toast } from 'sonner';
import db, { PasskeyMetadata } from '@/lib/storage/db';
import { registerPasskey, detectDeviceName } from '@/lib/passkey';

const PASSKEY_MESSAGES = {
  ALREADY_EXISTS: '此設備已加入',
  NAME_EXISTS: '名稱已存在，請使用其他名稱',
  EMPTY_NAME: '名稱不能為空',
  CANNOT_DELETE_DEFAULT: '無法刪除預設 Passkey，請先設定其他 Passkey 為預設',
  MINIMUM_ONE: '至少需要保留一個 Passkey',
  WAIT_CURRENT: '請等待當前 Passkey 註冊完成',
  CANCELLED: '已取消 Passkey 註冊',
} as const;

export function usePasskeyManager() {
  const [isProcessing, setIsProcessing] = useState(false);

  const getPasskeysFromDB = async () => {
    const setting = await db.settings.get({ key: 'passkeys_metadata' });
    return {
      passkeys: (setting?.value as PasskeyMetadata[]) || [],
      settingId: setting?.id,
    };
  };

  const savePasskeysToDB = async (passkeys: PasskeyMetadata[], settingId?: number) => {
    await db.settings.put({
      id: settingId,
      key: 'passkeys_metadata',
      value: passkeys,
    });
  };

  const addPasskey = async (customName?: string, existingCredentialIds?: string[]) => {
    if (isProcessing) {
      toast.error(PASSKEY_MESSAGES.WAIT_CURRENT);
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
        toast.error(PASSKEY_MESSAGES.ALREADY_EXISTS);
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
      
      toast.success(`Passkey "${newPasskey.name}" 新增成功${isFirstPasskey ? ' (已設為預設)' : ''}`);
      
      return newPasskey;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error(PASSKEY_MESSAGES.CANCELLED);
        } else if (error.name === 'InvalidStateError') {
          toast.error(PASSKEY_MESSAGES.ALREADY_EXISTS);
        } else {
          toast.error(`Passkey 註冊失敗: ${error.message}`);
        }
      } else {
        toast.error('Passkey 註冊失敗');
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
      toast.error(PASSKEY_MESSAGES.CANNOT_DELETE_DEFAULT);
      return false;
    }
    
    if (passkeys.length <= 1) {
      toast.error(PASSKEY_MESSAGES.MINIMUM_ONE);
      return false;
    }

    const updatedPasskeys = passkeys.filter(p => p.id !== id);
    await savePasskeysToDB(updatedPasskeys, settingId);
    
    toast.success(`Passkey "${passkeyToRemove?.name}" 已移除`);
    return true;
  };

  const updatePasskeyName = async (id: string, newName: string, existingNames?: string[]) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      toast.error(PASSKEY_MESSAGES.EMPTY_NAME);
      return false;
    }

    const { passkeys, settingId } = await getPasskeysFromDB();
    
    const allNames = [...passkeys.map(p => p.name), ...(existingNames || [])];
    if (allNames.some(name => name === trimmedName && passkeys.find(p => p.name === name)?.id !== id)) {
      toast.error(PASSKEY_MESSAGES.NAME_EXISTS);
      return false;
    }
    
    const updatedPasskeys = passkeys.map(p =>
      p.id === id ? { ...p, name: trimmedName } : p
    );
    
    await savePasskeysToDB(updatedPasskeys, settingId);
    toast.success("Passkey 名稱已更新");
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
    toast.success(`已將 "${passkeyName}" 設為預設 Passkey`);
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
