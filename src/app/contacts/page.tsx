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
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { ContactRow } from "@/components/contacts/ContactRow";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import { NFCDialog, type NFCContactData } from "@/components/contacts/NFCDialog";
import { QRScanner } from "@/components/contacts/QRScanner";
import { ShareAddressDialog } from "@/components/contacts/ShareAddressDialog";
import { SendDialog } from "@/components/transaction/SendDialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/wallet/DashboardLayout";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import db, { type Contact } from "@/lib/storage/db";
import { useWalletStore } from "@/stores/useWalletStore";

/**
 * 聯絡簿頁面 - 統一版型
 *
 * 固定版型：
 * - 上方：搜尋框 + 新增聯絡人主按鈕
 * - 中間：聯絡人列表（收藏置頂、最近使用、全部）
 * - 下方：空狀態 CTA（掃描 QR / 匯入通訊錄）
 */
function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showNFCDialog, setShowNFCDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [sendingToContact, setSendingToContact] = useState<Contact | null>(null);

  // Get active wallet for SendDialog
  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);
  const activeWallet = wallets.find(w => w.id === activeWalletId);

  // Fetch contacts from IndexedDB
  const contacts = useLiveQuery(
    () => db.contacts.orderBy('lastUsed').reverse().toArray(),
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
      // Check if contact already exists
      const existing = await db.contacts
        .where('address')
        .equalsIgnoreCase(data.address)
        .first();

      if (existing) {
        toast.info(`${data.name || '此聯絡人'} 已經在聯絡簿中`);
        setShowScanner(false);
        return;
      }

      // Add new contact
      await db.contacts.add({
        name: data.name || `聯絡人 ${data.address.slice(0, 6)}`,
        address: data.address,
        emoji: "👤",
        createdAt: Date.now(),
      });

      toast.success(`已添加聯絡人 ${data.name || data.address.slice(0, 6)}`);
      setShowScanner(false);
    } catch (error) {
      console.error("Failed to add contact:", error);
      toast.error("添加聯絡人失敗");
    }
  }, []);

  // NFC receive handler
  const handleNFCReceive = useCallback(async (data: NFCContactData) => {
    try {
      const existing = await db.contacts
        .where('address')
        .equalsIgnoreCase(data.address)
        .first();

      if (existing) {
        toast.info(`${data.name || '此聯絡人'} 已經在聯絡簿中`);
        return;
      }

      await db.contacts.add({
        name: data.name || `聯絡人 ${data.address.slice(0, 6)}`,
        address: data.address,
        emoji: "👤",
        createdAt: Date.now(),
      });

      toast.success(`已添加聯絡人 ${data.name || data.address.slice(0, 6)}`);
    } catch (error) {
      console.error("Failed to add contact:", error);
      toast.error("添加聯絡人失敗");
    }
  }, []);

  // Contact action handlers
  const handleSendToContact = useCallback((contact: Contact) => {
    setSendingToContact(contact);
  }, []);

  const handleEditContact = useCallback((contact: Contact) => {
    setEditingContact(contact);
  }, []);

  const handleDeleteContact = useCallback(async (contact: Contact) => {
    if (!contact.id) return;
    try {
      await db.contacts.delete(contact.id);
      toast.success("已刪除聯絡人");
    } catch {
      toast.error("刪除失敗");
    }
  }, []);

  const handleToggleFavorite = useCallback(async (contact: Contact) => {
    if (!contact.id) return;
    try {
      await db.contacts.update(contact.id, { isFavorite: !contact.isFavorite });
      toast.success(contact.isFavorite ? "已取消收藏" : "已加入收藏");
    } catch {
      toast.error("操作失敗");
    }
  }, []);

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* ===== 上方區域：搜尋 + 新增按鈕 ===== */}
        <motion.div variants={fadeInUp} className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-keylio-text-primary">聯絡簿</h1>
            <AddContactDialog />
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
        </motion.div>

        {/* ===== 中間區域：聯絡人列表 ===== */}
        <motion.div variants={fadeInUp} className="space-y-6">
          <AnimatePresence mode="popLayout">
            {/* Favorites Section */}
            {favorites.length > 0 && (
              <motion.div
                key="favorites"
                variants={fadeInUp}
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
                      onSend={handleSendToContact}
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
                      onSend={handleSendToContact}
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
                className="space-y-3"
              >
                <div className="text-sm text-keylio-text-muted">
                  所有聯絡人
                </div>
                <div className="space-y-2">
                  {others.map(contact => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      variant="default"
                      onSend={handleSendToContact}
                      onEdit={handleEditContact}
                      onDelete={handleDeleteContact}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* No Search Results */}
            {hasContacts && !hasFilteredResults && searchQuery ? <motion.div
                key="no-results"
                variants={fadeInUp}
                className="py-8"
              >
                <EmptyState
                  icon="🔍"
                  title="沒有找到符合的聯絡人"
                  description={`找不到「${searchQuery}」相關的聯絡人`}
                  size="md"
                />
              </motion.div> : null}
          </AnimatePresence>
        </motion.div>

        {/* ===== 下方區域：空狀態 CTA ===== */}
        {!hasContacts && (
          <motion.div variants={fadeInUp} className="space-y-4">
            {/* Empty State */}
            <div className="bg-keylio-bg-secondary rounded-2xl border border-keylio-border-primary p-8">
              <EmptyState
                icon="👥"
                title="還沒有任何聯絡人"
                description="新增聯絡人讓轉帳更方便"
                size="lg"
              />
            </div>

            {/* Quick Add Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-3 p-4 bg-keylio-bg-secondary hover:bg-keylio-bg-tertiary rounded-2xl border border-keylio-border-primary transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-keylio-teal/10 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-keylio-teal" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-keylio-text-primary">掃描 QR Code</div>
                  <div className="text-xs text-keylio-text-muted">快速添加好友</div>
                </div>
              </button>

              <button
                onClick={() => setShowNFCDialog(true)}
                className="flex items-center gap-3 p-4 bg-keylio-bg-secondary hover:bg-keylio-bg-tertiary rounded-2xl border border-keylio-border-primary transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Wifi className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-keylio-text-primary">近場通訊 NFC</div>
                  <div className="text-xs text-keylio-text-muted">碰觸即可交換</div>
                </div>
              </button>
            </div>

            {/* Import from contacts (future feature) */}
            <button
              onClick={() => toast.info("即將推出：匯入通訊錄")}
              className="w-full flex items-center justify-center gap-2 p-3 text-keylio-text-muted hover:text-keylio-text-primary hover:bg-keylio-bg-secondary rounded-xl transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">從通訊錄匯入</span>
            </button>
          </motion.div>
        )}

        {/* Quick Add Buttons - Only show when has contacts */}
        {hasContacts ? <motion.div variants={fadeInUp} className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScanner(true)}
              className="flex-1 border-keylio-border-primary hover:bg-keylio-teal/10 hover:border-keylio-teal hover:text-keylio-teal"
            >
              <QrCode className="w-4 h-4 mr-1.5" />
              掃描 QR
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNFCDialog(true)}
              className="flex-1 border-keylio-border-primary hover:bg-purple-500/10 hover:border-purple-500 hover:text-purple-400"
            >
              <Wifi className="w-4 h-4 mr-1.5" />
              NFC 交換
            </Button>
          </motion.div> : null}
      </motion.div>

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
        onOpenChange={(open) => !open && setEditingContact(null)}
      />

      {/* Send Dialog - 當選擇發送給某聯絡人時 */}
      <SendDialog
        fromAddress={activeWallet?.address || ""}
        open={!!sendingToContact}
        onOpenChange={(open) => !open && setSendingToContact(null)}
        defaultRecipient={sendingToContact?.address}
        defaultRecipientName={sendingToContact?.name}
        onSuccess={() => setSendingToContact(null)}
      />
    </DashboardLayout>
  );
}

export default memo(ContactsPage);
