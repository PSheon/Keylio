import { useState, useEffect, useRef } from 'react';
import { type PasskeyMetadata } from '@/lib/storage/db';

export function usePasskeyEditor() {
  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingPasskeyId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingPasskeyId]);

  const startEditing = (passkey: PasskeyMetadata) => {
    setEditingPasskeyId(passkey.id);
    setEditingName(passkey.name);
  };

  const cancelEditing = () => {
    setEditingPasskeyId(null);
    setEditingName("");
  };

  const resetEditing = () => {
    setEditingPasskeyId(null);
    setEditingName("");
  };

  return {
    editingPasskeyId,
    editingName,
    setEditingName,
    editInputRef,
    startEditing,
    cancelEditing,
    resetEditing,
  };
}
