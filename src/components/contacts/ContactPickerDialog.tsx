"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, QrCode, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogBody,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import db, { type Contact } from "@/lib/storage/db";
import { AddContactDialog } from "./AddContactDialog";
import { ContactRow } from "./ContactRow";

interface ContactPickerDialogProps {
  /** 觸發器元素 */
  trigger: React.ReactNode;
  /** 選擇聯絡人後的回調 */
  onSelect: (address: string, name?: string) => void;
  /** Dialog 標題 */
  title?: string;
  /** 是否顯示「新增聯絡人」按鈕 */
  showAddButton?: boolean;
}

/**
 * 統一選擇聯絡人 Dialog
 * 與聯絡簿主頁樣式一致，縮版用於選人場景
 */
function ContactPickerDialogComponent({
  trigger,
  onSelect,
  title = "選擇聯絡人",
  showAddButton = true,
}: ContactPickerDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch contacts from IndexedDB
  const contacts = useLiveQuery(
    () => db.contacts.orderBy("lastUsed").reverse().toArray(),
    []
  );

  // Filter and sort contacts
  const { favorites, recentlyUsed, others } = useMemo(() => {
    if (!contacts) return { favorites: [], recentlyUsed: [], others: [] };

    const filtered = contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Separate by category
    const favorites = filtered.filter((c) => c.isFavorite);
    const recentlyUsed = filtered.filter((c) => c.lastUsed && !c.isFavorite);
    const others = filtered.filter((c) => !c.lastUsed && !c.isFavorite);

    return { favorites, recentlyUsed, others };
  }, [contacts, searchQuery]);

  const hasContacts = contacts && contacts.length > 0;
  const hasFilteredResults =
    favorites.length > 0 || recentlyUsed.length > 0 || others.length > 0;

  const handleSelectContact = useCallback(
    async (contact: Contact) => {
      // Update last used timestamp
      if (contact.id) {
        await db.contacts.update(contact.id, { lastUsed: Date.now() });
      }
      onSelect(contact.address, contact.name);
      setOpen(false);
      setSearchQuery("");
    },
    [onSelect]
  );

  const handleAddSuccess = useCallback(() => {
    // 新增成功後不關閉 dialog，讓用戶可以繼續選擇
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Search Bar + Add Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-keylio-text-muted" />
              <Input
                placeholder="搜尋聯絡人..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-keylio-bg-primary border-keylio-border-primary"
              />
            </div>
            {showAddButton ? <AddContactDialog
                trigger={
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 border-keylio-border-primary hover:bg-keylio-teal/10 hover:border-keylio-teal hover:text-keylio-teal"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                }
                onSuccess={handleAddSuccess}
              /> : null}
          </div>

          {/* Contact List */}
          <motion.div
            className="space-y-4 max-h-[400px] overflow-y-auto pr-1"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <AnimatePresence mode="popLayout">
              {/* Empty State - No Contacts */}
              {!hasContacts && (
                <motion.div variants={fadeInUp} className="py-6">
                  <EmptyState
                    icon={<User className="w-8 h-8" />}
                    title="還沒有聯絡人"
                    description="新增聯絡人或掃描 QR Code 開始"
                    size="sm"
                    action={
                      <div className="flex gap-2">
                        <AddContactDialog
                          trigger={
                            <Button
                              size="sm"
                              className="bg-keylio-teal hover:bg-keylio-teal/90"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              新增聯絡人
                            </Button>
                          }
                          onSuccess={handleAddSuccess}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-keylio-border-primary"
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          掃描 QR
                        </Button>
                      </div>
                    }
                  />
                </motion.div>
              )}

              {/* No Search Results */}
              {hasContacts && !hasFilteredResults && searchQuery ? <motion.div variants={fadeInUp} className="py-6">
                  <EmptyState
                    icon="🔍"
                    title="沒有找到符合的聯絡人"
                    description={`找不到「${searchQuery}」相關的聯絡人`}
                    size="sm"
                  />
                </motion.div> : null}

              {/* Favorites Section */}
              {favorites.length > 0 && (
                <motion.div variants={fadeInUp} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-keylio-text-muted px-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>收藏</span>
                  </div>
                  <div className="space-y-1.5">
                    {favorites.map((contact) => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        variant="picker"
                        isFavorite
                        onClick={() => handleSelectContact(contact)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recently Used Section */}
              {recentlyUsed.length > 0 && (
                <motion.div variants={fadeInUp} className="space-y-2">
                  <div className="text-xs text-keylio-text-muted px-1">
                    最近使用
                  </div>
                  <div className="space-y-1.5">
                    {recentlyUsed.map((contact) => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        variant="picker"
                        onClick={() => handleSelectContact(contact)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* All Others Section */}
              {others.length > 0 && (
                <motion.div variants={fadeInUp} className="space-y-2">
                  <div className="text-xs text-keylio-text-muted px-1">
                    所有聯絡人
                  </div>
                  <div className="space-y-1.5">
                    {others.map((contact) => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        variant="picker"
                        onClick={() => handleSelectContact(contact)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export const ContactPickerDialog = memo(ContactPickerDialogComponent);
