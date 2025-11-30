"use client";

import { useState, memo, useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  QrCode,
  Wifi,
  Star,
  Clock,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { ContactRow } from "@/components/contacts/ContactRow";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import { NFCDialog, type NFCContactData } from "@/components/contacts/NFCDialog";
import { QRScanner } from "@/components/contacts/QRScanner";
import { ShareAddressDialog } from "@/components/contacts/ShareAddressDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageTransition, PageSection } from "@/components/ui/page-transition";
import { DashboardLayout } from "@/components/wallet/DashboardLayout";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { fadeInUp } from "@/lib/animations";
import db, { type Contact } from "@/lib/storage/db";
import { showSuccess, showError, showInfo } from "@/lib/toast";

/**
 * 聯絡簿內容元件 - Client Component
 *
 * 固定版型：
 * - 上方：搜尋框 + 新增聯絡人主按鈕
 * - 中間：聯絡人列表（收藏置頂、最近使用、全部）
 * - 下方：空狀態 CTA（掃描 QR / 匯入通訊錄）
 */
function ContactsContentComponent() {
  // 防止意外重整頁面
  useBeforeUnload();

  const [searchQuery, setSearchQuery] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showNFCDialog, setShowNFCDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Fetch contacts from IndexedDB (sort by name for consistent ordering)
  const contacts = useLiveQuery(
    () => db.contacts.orderBy('name').toArray(),
    []
  );

  // Filter and categorize contacts
  const { favorites, recentlyUsed, others, hasContacts, hasFilteredResults } = useMemo(() => {
    if (!contacts) return { favorites: [], recentlyUsed: [], others: [], hasContacts: false, hasFilteredResults: false };

    const filtered = contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Separate by category
    const favorites = filtered.filter(c => c.isFavorite);
    const recentlyUsed = filtered.filter(c => c.lastUsed && !c.isFavorite);
    const others = filtered.filter(c => !c.lastUsed && !c.isFavorite);

    return {
      favorites,
      recentlyUsed,
      others,
      hasContacts: contacts.length > 0,
      hasFilteredResults: filtered.length > 0
    };
  }, [contacts, searchQuery]);

  // QR Code scan result handler
  const handleScan = useCallback(async (data: { type: string; address: string; name?: string }) => {
    try {
      // Normalize address to checksum format
      const { getAddress } = await import('ethers');
      let checksumAddress: string;
      try {
        checksumAddress = getAddress(data.address);
      } catch {
        showError("無效的錢包地址");
        setShowScanner(false);
        return;
      }

      // Check if contact already exists
      const existing = await db.contacts
        .where('address')
        .equals(checksumAddress)
        .first();

      if (existing) {
        showInfo("已在聯絡簿中", data.name || '此聯絡人');
        setShowScanner(false);
        return;
      }

      // Add new contact
      await db.contacts.add({
        name: data.name || `聯絡人 ${data.address.slice(0, 6)}`,
        address: checksumAddress,
        emoji: "👤",
        createdAt: Date.now(),
      });

      showSuccess("已添加聯絡人", data.name || data.address.slice(0, 6));
      setShowScanner(false);
    } catch (error) {
      console.error("Failed to add contact:", error);
      showError("添加聯絡人失敗");
    }
  }, []);

  // NFC receive handler
  const handleNFCReceive = useCallback(async (data: NFCContactData) => {
    try {
      // Normalize address to checksum format
      const { getAddress } = await import('ethers');
      let checksumAddress: string;
      try {
        checksumAddress = getAddress(data.address);
      } catch {
        showError("無效的錢包地址");
        return;
      }

      const existing = await db.contacts
        .where('address')
        .equals(checksumAddress)
        .first();

      if (existing) {
        showInfo("已在聯絡簿中", data.name || '此聯絡人');
        return;
      }

      await db.contacts.add({
        name: data.name || `聯絡人 ${data.address.slice(0, 6)}`,
        address: checksumAddress,
        emoji: "👤",
        createdAt: Date.now(),
      });

      showSuccess("已添加聯絡人", data.name || data.address.slice(0, 6));
    } catch (error) {
      console.error("Failed to add contact:", error);
      showError("添加聯絡人失敗");
    }
  }, []);

  // Contact action handlers
  const handleEditContact = useCallback((contact: Contact) => {
    setEditingContact(contact);
  }, []);

  const handleDeleteContact = useCallback(async (contact: Contact) => {
    if (!contact.id) return;
    try {
      await db.contacts.delete(contact.id);
      showSuccess("已刪除聯絡人", contact.name);
    } catch {
      showError("刪除失敗");
    }
  }, []);

  const handleToggleFavorite = useCallback(async (contact: Contact) => {
    if (!contact.id) return;
    try {
      await db.contacts.update(contact.id, { isFavorite: !contact.isFavorite });
      showSuccess(contact.isFavorite ? "已取消收藏" : "已加入收藏", contact.name);
    } catch {
      showError("操作失敗");
    }
  }, []);

  return (
    <AuthGuard>
      <DashboardLayout>
        <PageTransition>
        {/* ===== 上方區域：標題 + 新增按鈕 ===== */}
        <PageSection className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-keylio-text-primary">聯絡簿</h1>
            <AddContactDialog />
          </div>

          {/* Quick Add Actions - QR/NFC 放在上方 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-3 p-4 bg-keylio-bg-secondary hover:bg-keylio-bg-tertiary rounded-2xl border border-keylio-border-primary transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-keylio-teal/10 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-keylio-teal" />
              </div>
              <div className="text-left">
                <div className="font-medium text-keylio-text-primary text-sm">掃描 QR Code</div>
                <div className="text-xs text-keylio-text-muted">快速添加好友</div>
              </div>
            </button>

            <button
              onClick={() => setShowNFCDialog(true)}
              className="flex items-center gap-3 p-4 bg-keylio-bg-secondary hover:bg-keylio-bg-tertiary rounded-2xl border border-keylio-border-primary transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-keylio-text-primary text-sm">近場通訊 NFC</div>
                <div className="text-xs text-keylio-text-muted">碰觸即可交換</div>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-keylio-text-muted" />
            <Input
              placeholder="搜尋聯絡人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-keylio-bg-secondary border-keylio-border-primary"
            />
          </div>
        </PageSection>

        {/* ===== 中間區域：聯絡人列表 ===== */}
        <PageSection className="space-y-6">
          {/* 空狀態 */}
          {!hasContacts && (
            <div className="bg-keylio-bg-secondary rounded-2xl border border-keylio-border-primary p-8">
              <EmptyState
                icon="👥"
                title="還沒有任何聯絡人"
                description="點擊上方按鈕新增聯絡人"
                size="lg"
              />
            </div>
          )}

          {/* 聯絡人列表 */}
          <AnimatePresence mode="popLayout">
            {/* Favorites Section */}
            {favorites.length > 0 && (
              <motion.div
                key="favorites"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-sm text-keylio-text-muted">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>收藏</span>
                  <span className="text-xs bg-keylio-bg-tertiary px-1.5 py-0.5 rounded">
                    {favorites.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {favorites.map(contact => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      variant="default"
                      isFavorite
                      onEdit={handleEditContact}
                      onDelete={handleDeleteContact}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recently Used Section */}
            {recentlyUsed.length > 0 && (
              <motion.div
                key="recent"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-sm text-keylio-text-muted">
                  <Clock className="w-4 h-4" />
                  <span>最近使用</span>
                </div>
                <div className="space-y-2">
                  {recentlyUsed.map(contact => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      variant="default"
                      onEdit={handleEditContact}
                      onDelete={handleDeleteContact}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* All Others Section */}
            {others.length > 0 && (
              <motion.div
                key="others"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-3"
              >
                <div className="text-sm text-keylio-text-muted">
                  所有聯絡人 ({others.length})
                </div>
                <div className="space-y-2">
                  {others.map(contact => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      variant="default"
                      onEdit={handleEditContact}
                      onDelete={handleDeleteContact}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* No Search Results */}
            {hasContacts && !hasFilteredResults && searchQuery ? (
              <motion.div
                key="no-results"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                className="py-8"
              >
                <EmptyState
                  icon="🔍"
                  title="沒有找到符合的聯絡人"
                  description={`找不到「${searchQuery}」相關的聯絡人`}
                  size="md"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </PageSection>
      </PageTransition>

      {/* ===== Dialogs ===== */}

      {/* QR Scanner Dialog */}
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />

      {/* Share Address Dialog */}
      <ShareAddressDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />

      {/* NFC Dialog */}
      <NFCDialog
        isOpen={showNFCDialog}
        onClose={() => setShowNFCDialog(false)}
        onReceive={handleNFCReceive}
        mode="receive"
      />

      {/* Edit Contact Dialog */}
      <EditContactDialog
        contact={editingContact}
        open={!!editingContact}
        onOpenChange={(open: boolean) => !open && setEditingContact(null)}
      />
    </DashboardLayout>
    </AuthGuard>
  );
}

export const ContactsContent = memo(ContactsContentComponent);
