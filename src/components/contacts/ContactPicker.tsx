"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, User, Clock, Plus, TrendingUp, UserPlus } from "lucide-react";
import db, { type Contact } from "@/lib/storage/db";
import { useLiveQuery } from "dexie-react-hooks";
import { ethers } from "ethers";
import { useWalletStore } from "@/stores/useWalletStore";

interface ContactPickerProps {
  onSelect: (address: string, name?: string) => void;
  currentAddress?: string;
}

export function ContactPicker({ onSelect, currentAddress }: ContactPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactAddress, setNewContactAddress] = useState("");
  const [newContactEmoji, setNewContactEmoji] = useState("👤");

  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);
  const activeWallet = wallets.find(w => w.id === activeWalletId);

  // Fetch all contacts
  const contacts = useLiveQuery(
    () => db.contacts.orderBy("lastUsed").reverse().toArray(),
    []
  );

  // Fetch recent transactions to suggest frequent addresses
  const recentTransactions = useLiveQuery(
    () => {
      if (!activeWallet?.id) return [];
      return db.transactions
        .where('subWalletId')
        .equals(activeWallet.id)
        .reverse()
        .limit(50)
        .toArray();
    },
    [activeWallet?.id]
  );

  // Calculate frequent addresses from transactions (not in contacts)
  const suggestedAddresses = useMemo(() => {
    if (!recentTransactions || !contacts || !activeWallet) return [];
    
    const addressCount = new Map<string, number>();
    const contactAddresses = new Set(contacts.map(c => c.address.toLowerCase()));
    
    recentTransactions.forEach(tx => {
      const otherAddress = tx.to.toLowerCase() === activeWallet.address.toLowerCase() 
        ? tx.from.toLowerCase()
        : tx.to.toLowerCase();
      
      if (!contactAddresses.has(otherAddress) && otherAddress !== activeWallet.address.toLowerCase()) {
        addressCount.set(otherAddress, (addressCount.get(otherAddress) || 0) + 1);
      }
    });
    
    return Array.from(addressCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([address, count]) => ({ address, count }));
  }, [recentTransactions, contacts, activeWallet]);

  // Filter contacts by search term
  const filteredContacts = contacts?.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Recent contacts (top 3)
  const recentContacts = filteredContacts?.slice(0, 3);

  const handleSelectContact = async (contact: Contact) => {
    // Update last used timestamp
    await db.contacts.update(contact.id!, { lastUsed: Date.now() });
    onSelect(contact.address, contact.name);
  };

  const handleAddContact = async () => {
    if (!newContactName || !newContactAddress) {
      return;
    }

    if (!ethers.isAddress(newContactAddress)) {
      alert("無效的錢包地址");
      return;
    }

    try {
      await db.contacts.add({
        address: newContactAddress.toLowerCase(),
        name: newContactName,
        emoji: newContactEmoji,
        createdAt: Date.now(),
        lastUsed: Date.now(),
      });

      // Select the newly added contact
      onSelect(newContactAddress, newContactName);
      
      // Reset form
      setNewContactName("");
      setNewContactAddress("");
      setNewContactEmoji("👤");
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding contact:", error);
      alert("添加聯絡人失敗，可能地址已存在");
    }
  };

  const emojiOptions = ["👤", "👨", "👩", "🧑", "👶", "🏢", "🏪", "💼", "🎯"];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-keylio-text-muted" />
        <Input
          placeholder="搜尋聯絡人或輸入地址..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-keylio-bg-primary border-keylio-border-primary"
        />
      </div>

      {/* Recent Contacts */}
      {!searchTerm && recentContacts && recentContacts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-keylio-text-secondary">
            <Clock className="w-3 h-3" />
            <span>最近使用</span>
          </div>
          <div className="space-y-1">
            {recentContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleSelectContact(contact)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-keylio-bg-primary border border-keylio-border-primary hover:border-keylio-teal transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-keylio-teal/20 flex items-center justify-center text-lg">
                  {contact.emoji || "👤"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-keylio-text-primary">{contact.name}</div>
                  <div className="text-xs text-keylio-text-muted font-mono truncate">
                    {contact.address}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Addresses (Frequent but not in contacts) */}
      {!searchTerm && suggestedAddresses.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-keylio-text-secondary">
            <TrendingUp className="w-3 h-3" />
            <span>常用地址（建議加入聯絡人）</span>
          </div>
          <div className="space-y-1">
            {suggestedAddresses.map(({ address, count }) => (
              <div
                key={address}
                className="flex items-center gap-2 p-3 rounded-lg bg-keylio-bg-primary border border-keylio-border-primary"
              >
                <button
                  onClick={() => onSelect(address)}
                  className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-lg">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-keylio-text-muted font-mono truncate">
                      {address}
                    </div>
                    <div className="text-xs text-orange-400">
                      {count} 筆交易
                    </div>
                  </div>
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewContactAddress(address);
                    setShowAddForm(true);
                  }}
                  className="shrink-0 h-7 px-2 border-keylio-border-primary hover:bg-keylio-teal/10 hover:border-keylio-teal"
                >
                  <UserPlus className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchTerm && filteredContacts && filteredContacts.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-keylio-text-secondary">
            找到 {filteredContacts.length} 個聯絡人
          </div>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleSelectContact(contact)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-keylio-bg-primary border border-keylio-border-primary hover:border-keylio-teal transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-keylio-teal/20 flex items-center justify-center text-lg">
                  {contact.emoji || "👤"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-keylio-text-primary">{contact.name}</div>
                  <div className="text-xs text-keylio-text-muted font-mono truncate">
                    {contact.address}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchTerm && filteredContacts && filteredContacts.length === 0 && (
        <div className="text-center py-8 text-keylio-text-secondary">
          <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">找不到聯絡人</p>
        </div>
      )}

      {/* Add New Contact */}
      {!showAddForm ? (
        <Button
          variant="outline"
          onClick={() => setShowAddForm(true)}
          className="w-full border-keylio-border-primary hover:bg-keylio-bg-tertiary"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增聯絡人
        </Button>
      ) : (
        <div className="p-4 rounded-lg bg-keylio-bg-primary border border-keylio-border-primary space-y-3">
          <div className="text-sm font-medium text-keylio-text-primary">新增聯絡人</div>
          
          <div className="space-y-2">
            <Label className="text-xs">名稱</Label>
            <Input
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="例如: Alice"
              className="bg-keylio-bg-secondary border-keylio-border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">錢包地址</Label>
            <Input
              value={newContactAddress}
              onChange={(e) => setNewContactAddress(e.target.value)}
              placeholder="0x..."
              className="bg-keylio-bg-secondary border-keylio-border-primary font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">圖示</Label>
            <div className="flex gap-2 flex-wrap">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setNewContactEmoji(emoji)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${
                    newContactEmoji === emoji
                      ? "bg-keylio-teal/20 border-2 border-keylio-teal"
                      : "bg-keylio-bg-secondary border border-keylio-border-primary hover:bg-keylio-bg-tertiary"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setNewContactName("");
                setNewContactAddress("");
                setNewContactEmoji("👤");
              }}
              className="flex-1 border-keylio-border-primary hover:bg-keylio-bg-tertiary"
            >
              取消
            </Button>
            <Button
              onClick={handleAddContact}
              disabled={!newContactName || !newContactAddress}
              className="flex-1 bg-keylio-teal hover:bg-keylio-teal/80"
            >
              新增
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
