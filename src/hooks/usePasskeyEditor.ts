"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { type PasskeyMetadata } from '@/lib/storage/db';

/**
 * Hook for managing passkey editing state.
 *
 * Provides controlled editing flow with auto-focus and selection.
 *
 * @example
 * ```tsx
 * const { editingPasskeyId, editingName, startEditing, cancelEditing } = usePasskeyEditor();
 * ```
 */
export function usePasskeyEditor() {
  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and select input when editing starts
  useEffect(() => {
    if (editingPasskeyId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingPasskeyId]);

  /** Start editing a passkey's name */
  const startEditing = useCallback((passkey: PasskeyMetadata) => {
    setEditingPasskeyId(passkey.id);
    setEditingName(passkey.name);
  }, []);

  /** Cancel/reset editing state */
  const cancelEditing = useCallback(() => {
    setEditingPasskeyId(null);
    setEditingName("");
  }, []);

  return {
    /** Currently editing passkey ID, or null */
    editingPasskeyId,
    /** Current editing name value */
    editingName,
    /** Update editing name */
    setEditingName,
    /** Ref for input element auto-focus */
    editInputRef,
    /** Start editing a passkey */
    startEditing,
    /** Cancel editing and reset state */
    cancelEditing,
  };
}
