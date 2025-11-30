/**
 * 發送流程的步驟狀態
 * @description
 * - `recipient`: 選擇收款人
 * - `amount`: 輸入金額與選擇幣種
 * - `confirm`: 確認交易摘要
 * - `sending`: 發送中（顯示動畫）
 * - `success`: 交易完成
 */
export type SendStep =
  | 'recipient'
  | 'amount'
  | 'confirm'
  | 'sending'
  | 'success';

/**
 * 發送表單資料
 * @description 儲存發送流程中使用者輸入的所有資料
 */
export interface SendFormData {
  /** 收款人錢包地址 (0x...) */
  recipient: string;
  /** 收款人名稱（來自聯絡人或手動輸入） */
  recipientName: string;
  /** 選擇的代幣符號 (如 USDT, ETH) */
  token: string;
  /** 發送金額（字串格式以保留精度） */
  amount: string;
  /** 交易備註（可選） */
  note: string;
}

/**
 * 發送交易結果
 * @description 交易成功後回傳的資訊
 */
export interface SendResult {
  /** 交易 hash */
  hash: string;
  /** 交易時間戳（毫秒） */
  timestamp: number;
}
