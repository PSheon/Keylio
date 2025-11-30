/**
 * Keylio Wallet - Transaction Service
 *
 * Handles transaction building, signing, and broadcasting
 */

import { ethers } from 'ethers';
import { getProvider, withRetry, ACTIVE_CHAIN } from './chain';
import { deriveSigningWallet, decryptData, type EncryptedData } from './crypto';
import { KeylioError, ErrorCode, logError } from './errors';
import { hasActiveSession, getDecryptedPassword } from './session';
import db from './storage/db';
import { ERC20_ABI } from './tokens';

// ========================================
// Types
// ========================================

export interface TransactionRequest {
  to: string;
  amount: string;
  tokenAddress?: string; // If undefined, send native token
  note?: string;
  label?: string;
}

export interface TransactionResult {
  hash: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  gasUsed?: bigint;
  gasPrice?: bigint;
  blockNumber?: number;
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: bigint;
  estimatedCostFormatted: string;
}

// ========================================
// Gas Estimation
// ========================================

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
  from: string,
  to: string,
  amount: string,
  tokenAddress?: string
): Promise<GasEstimate> {
  return withRetry(async (provider) => {
    try {
      let gasLimit: bigint;

      if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
        // Native token transfer
        gasLimit = await provider.estimateGas({
          from,
          to,
          value: ethers.parseEther(amount),
        });
      } else {
        // ERC-20 transfer
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const decimals = await contract.decimals();
        const parsedAmount = ethers.parseUnits(amount, decimals);

        gasLimit = await contract.transfer.estimateGas(to, parsedAmount, { from });
      }

      // Add 20% buffer for safety
      gasLimit = (gasLimit * BigInt(120)) / BigInt(100);

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      const estimatedCost = gasLimit * gasPrice;

      return {
        gasLimit,
        gasPrice,
        maxFeePerGas: feeData.maxFeePerGas || undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
        estimatedCost,
        estimatedCostFormatted: ethers.formatEther(estimatedCost),
      };
    } catch (error) {
      throw new KeylioError(
        ErrorCode.TX_GAS_ESTIMATION_FAILED,
        { from, to, amount, tokenAddress },
        error instanceof Error ? error : undefined
      );
    }
  });
}

// ========================================
// Transaction Validation
// ========================================

/**
 * Validate a transaction before signing
 */
export async function validateTransaction(
  from: string,
  request: TransactionRequest
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Validate address format
    if (!ethers.isAddress(request.to)) {
      return { isValid: false, error: '無效的錢包地址' };
    }

    // Validate amount
    const amount = parseFloat(request.amount);
    if (isNaN(amount) || amount <= 0) {
      return { isValid: false, error: '請輸入有效的金額' };
    }

    // Check balance
    const provider = await getProvider();

    if (!request.tokenAddress || request.tokenAddress === ethers.ZeroAddress) {
      // Native token
      const balance = await provider.getBalance(from);
      const requiredAmount = ethers.parseEther(request.amount);

      // Estimate gas to include in balance check
      const gasEstimate = await estimateGas(from, request.to, request.amount);
      const totalRequired = requiredAmount + gasEstimate.estimatedCost;

      if (balance < totalRequired) {
        return { isValid: false, error: '餘額不足（含 Gas 費用）' };
      }
    } else {
      // ERC-20 token
      const contract = new ethers.Contract(request.tokenAddress, ERC20_ABI, provider);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(from),
        contract.decimals(),
      ]);

      const requiredAmount = ethers.parseUnits(request.amount, decimals);

      if (balance < requiredAmount) {
        return { isValid: false, error: '餘額不足' };
      }

      // Check native token for gas
      const nativeBalance = await provider.getBalance(from);
      const gasEstimate = await estimateGas(from, request.to, request.amount, request.tokenAddress);

      if (nativeBalance < gasEstimate.estimatedCost) {
        return { isValid: false, error: `${ACTIVE_CHAIN.symbol} 餘額不足以支付 Gas 費用` };
      }
    }

    return { isValid: true };
  } catch (error) {
    logError(error, { operation: 'validateTransaction', from, to: request.to });
    return { isValid: false, error: '驗證交易時發生錯誤' };
  }
}

// ========================================
// Transaction Signing & Broadcasting
// ========================================

/**
 * Sign and send a transaction
 */
export async function sendTransaction(
  walletIndex: number,
  password: string,
  request: TransactionRequest
): Promise<TransactionResult> {
  // 1. Get encrypted mnemonic from DB
  const mnemonicSetting = await db.settings.get({ key: 'encrypted_mnemonic' });
  if (!mnemonicSetting) {
    throw new KeylioError(ErrorCode.WALLET_NOT_FOUND);
  }

  // 2. Decrypt mnemonic
  let mnemonic: string;
  try {
    mnemonic = await decryptData(mnemonicSetting.value as EncryptedData, password);
  } catch {
    throw new KeylioError(ErrorCode.AUTH_PASSWORD_WRONG);
  }

  try {
    // 3. Derive signing wallet
    const provider = await getProvider();
    const wallet = deriveSigningWallet(mnemonic, walletIndex, provider);

    // 4. Build and sign transaction
    let tx: ethers.TransactionResponse;
    let tokenSymbol: string;

    if (!request.tokenAddress || request.tokenAddress === ethers.ZeroAddress) {
      // Native token transfer
      tokenSymbol = ACTIVE_CHAIN.symbol;

      const gasEstimate = await estimateGas(wallet.address, request.to, request.amount);

      tx = await wallet.sendTransaction({
        to: request.to,
        value: ethers.parseEther(request.amount),
        gasLimit: gasEstimate.gasLimit,
        ...(gasEstimate.maxFeePerGas ? {
          maxFeePerGas: gasEstimate.maxFeePerGas,
          maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
        } : {
          gasPrice: gasEstimate.gasPrice,
        }),
      });
    } else {
      // ERC-20 transfer
      const contract = new ethers.Contract(request.tokenAddress, ERC20_ABI, wallet);
      const decimals = await contract.decimals();
      tokenSymbol = await contract.symbol();

      const parsedAmount = ethers.parseUnits(request.amount, decimals);
      const gasEstimate = await estimateGas(wallet.address, request.to, request.amount, request.tokenAddress);

      tx = await contract.transfer(request.to, parsedAmount, {
        gasLimit: gasEstimate.gasLimit,
        ...(gasEstimate.maxFeePerGas ? {
          maxFeePerGas: gasEstimate.maxFeePerGas,
          maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
        } : {
          gasPrice: gasEstimate.gasPrice,
        }),
      });
    }

    // 5. Save transaction to local DB
    const subWallet = await db.sub_wallets.where('index').equals(walletIndex).first();

    await db.transactions.add({
      hash: tx.hash,
      from: wallet.address,
      to: request.to,
      amount: request.amount,
      token: tokenSymbol,
      status: 'pending',
      timestamp: Date.now(),
      note: request.note,
      label: request.label,
      subWalletId: subWallet?.id,
    });

    // 6. Wait for confirmation (optional, can be done in background)
    // We return immediately with pending status

    return {
      hash: tx.hash,
      from: wallet.address,
      to: request.to,
      amount: request.amount,
      token: tokenSymbol,
    };
  } finally {
    // Clear mnemonic from memory
    mnemonic = '';
  }
}

/**
 * Watch a transaction for confirmation and update status
 */
export async function watchTransaction(hash: string): Promise<void> {
  try {
    const provider = await getProvider();
    const receipt = await provider.waitForTransaction(hash, 1, 120000); // 1 confirmation, 2 min timeout

    if (receipt) {
      const status = receipt.status === 1 ? 'confirmed' : 'failed';

      await db.transactions
        .where('hash')
        .equals(hash)
        .modify({
          status,
          // Add receipt details
        });
    }
  } catch (error) {
    logError(error, { operation: 'watchTransaction', hash });

    // Mark as failed if we can't confirm
    await db.transactions
      .where('hash')
      .equals(hash)
      .modify({ status: 'failed' });
  }
}

/**
 * Get transaction status from chain
 */
export async function getTransactionStatus(hash: string): Promise<'pending' | 'confirmed' | 'failed'> {
  return withRetry(async (provider) => {
    const receipt = await provider.getTransactionReceipt(hash);

    if (!receipt) {
      return 'pending';
    }

    return receipt.status === 1 ? 'confirmed' : 'failed';
  });
}

// ========================================
// Session-Based Transaction Signing
// ========================================

/**
 * Sign and send a transaction using the active session.
 * Requires an active session with valid decryption key.
 */
export async function sendTransactionWithSession(
  walletIndex: number,
  request: TransactionRequest
): Promise<TransactionResult> {
  // 1. Verify active session
  if (!hasActiveSession()) {
    throw new KeylioError(ErrorCode.AUTH_SESSION_EXPIRED);
  }

  // 2. Get encrypted mnemonic from DB
  const mnemonicSetting = await db.settings.get({ key: 'encrypted_mnemonic' });
  if (!mnemonicSetting) {
    throw new KeylioError(ErrorCode.WALLET_NOT_FOUND);
  }

  // 3. Get password from session and decrypt mnemonic
  const password = await getDecryptedPassword();
  if (!password) {
    throw new KeylioError(ErrorCode.AUTH_SESSION_EXPIRED);
  }

  let mnemonic: string;
  try {
    mnemonic = await decryptData(mnemonicSetting.value as EncryptedData, password);
  } catch {
    throw new KeylioError(ErrorCode.WALLET_DECRYPTION_FAILED);
  }

  try {
    // 4. Derive signing wallet
    const provider = await getProvider();
    const wallet = deriveSigningWallet(mnemonic, walletIndex, provider);

    // 5. Build and sign transaction
    let tx: ethers.TransactionResponse;
    let tokenSymbol: string;

    if (!request.tokenAddress || request.tokenAddress === ethers.ZeroAddress) {
      // Native token transfer
      tokenSymbol = ACTIVE_CHAIN.symbol;

      const gasEstimate = await estimateGas(wallet.address, request.to, request.amount);

      tx = await wallet.sendTransaction({
        to: request.to,
        value: ethers.parseEther(request.amount),
        gasLimit: gasEstimate.gasLimit,
        ...(gasEstimate.maxFeePerGas ? {
          maxFeePerGas: gasEstimate.maxFeePerGas,
          maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
        } : {
          gasPrice: gasEstimate.gasPrice,
        }),
      });
    } else {
      // ERC-20 transfer
      const contract = new ethers.Contract(request.tokenAddress, ERC20_ABI, wallet);
      const decimals = await contract.decimals();
      tokenSymbol = await contract.symbol();

      const parsedAmount = ethers.parseUnits(request.amount, decimals);
      const gasEstimate = await estimateGas(wallet.address, request.to, request.amount, request.tokenAddress);

      tx = await contract.transfer(request.to, parsedAmount, {
        gasLimit: gasEstimate.gasLimit,
        ...(gasEstimate.maxFeePerGas ? {
          maxFeePerGas: gasEstimate.maxFeePerGas,
          maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
        } : {
          gasPrice: gasEstimate.gasPrice,
        }),
      });
    }

    // 6. Save transaction to local DB
    const subWallet = await db.sub_wallets.where('index').equals(walletIndex).first();

    await db.transactions.add({
      hash: tx.hash,
      from: wallet.address,
      to: request.to,
      amount: request.amount,
      token: tokenSymbol,
      status: 'pending',
      timestamp: Date.now(),
      note: request.note,
      label: request.label,
      subWalletId: subWallet?.id,
    });

    // 7. Start watching transaction in background
    watchTransaction(tx.hash).catch(error => {
      logError(error, { operation: 'watchTransaction', hash: tx.hash });
    });

    return {
      hash: tx.hash,
      from: wallet.address,
      to: request.to,
      amount: request.amount,
      token: tokenSymbol,
    };
  } finally {
    // Clear mnemonic from memory
    mnemonic = '';
  }
}
