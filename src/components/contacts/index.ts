/**
 * Contacts 相關組件匯出
 *
 * 主要元件：
 * - ContactsContent: 聯絡簿頁面主要內容（Client Component）
 * - ContactPickerDialog: 統一選擇聯絡人對話框（推薦使用）
 * - ContactRow: 統一聯絡人列表行元件
 * - AddContactDialog / EditContactDialog: 新增/編輯聯絡人
 *
 * 輔助元件：
 * - ContactQRCode: 聯絡人 QR Code 顯示
 * - QRScanner / NFCDialog: 掃描/NFC 交換聯絡人
 * - ShareAddressDialog: 分享錢包地址
 */

// 頁面內容元件
export { ContactsContent } from './ContactsContent';

// 主要選擇器（推薦）
export { ContactPickerDialog } from './ContactPickerDialog';
export { ContactRow, type ContactRowVariant } from './ContactRow';

// 新增/編輯對話框
export { AddContactDialog } from './AddContactDialog';
export { EditContactDialog } from './EditContactDialog';

// QR Code / NFC 相關
export { ContactQRCode } from './ContactQRCode';
export { QRScanner, type QRContactData } from './QRScanner';
export { NFCDialog, type NFCContactData } from './NFCDialog';

// 分享地址
export { ShareAddressDialog } from './ShareAddressDialog';
