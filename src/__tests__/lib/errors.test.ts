/**
 * Error Handling Tests
 */

import { describe, it, expect } from 'vitest';
import {
  KeylioError,
  ErrorCode,
  ERROR_MESSAGES,
  isKeylioError,
  wrapError,
  getErrorMessage,
} from '@/lib/errors';

describe('KeylioError', () => {
  describe('constructor', () => {
    it('should create error with correct code and message', () => {
      const error = new KeylioError(ErrorCode.AUTH_PASSWORD_WRONG);

      expect(error.code).toBe(ErrorCode.AUTH_PASSWORD_WRONG);
      expect(error.message).toBe(ERROR_MESSAGES[ErrorCode.AUTH_PASSWORD_WRONG]);
      expect(error.name).toBe('KeylioError');
    });

    it('should include context when provided', () => {
      const context = { attempt: 1, userId: 'test' };
      const error = new KeylioError(ErrorCode.TX_SIGNING_FAILED, context);

      expect(error.context).toEqual(context);
    });

    it('should include original error when provided', () => {
      const originalError = new Error('Original error');
      const error = new KeylioError(
        ErrorCode.NETWORK_CONNECTION_FAILED,
        undefined,
        originalError
      );

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const context = { test: 'value' };
      const error = new KeylioError(ErrorCode.WALLET_NOT_FOUND, context);
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'KeylioError',
        code: ErrorCode.WALLET_NOT_FOUND,
        message: ERROR_MESSAGES[ErrorCode.WALLET_NOT_FOUND],
        context,
      });
    });
  });
});

describe('isKeylioError', () => {
  it('should return true for KeylioError instances', () => {
    const error = new KeylioError(ErrorCode.UNKNOWN);
    expect(isKeylioError(error)).toBe(true);
  });

  it('should return false for regular Error instances', () => {
    const error = new Error('Regular error');
    expect(isKeylioError(error)).toBe(false);
  });

  it('should return false for non-error values', () => {
    expect(isKeylioError(null)).toBe(false);
    expect(isKeylioError(undefined)).toBe(false);
    expect(isKeylioError('error')).toBe(false);
    expect(isKeylioError({ code: 1000 })).toBe(false);
  });
});

describe('wrapError', () => {
  it('should return KeylioError unchanged', () => {
    const keylioError = new KeylioError(ErrorCode.TX_REJECTED);
    const wrapped = wrapError(keylioError);

    expect(wrapped).toBe(keylioError);
  });

  it('should wrap regular Error into KeylioError', () => {
    const error = new Error('Something went wrong');
    const wrapped = wrapError(error, ErrorCode.UNKNOWN);

    expect(isKeylioError(wrapped)).toBe(true);
    expect(wrapped.code).toBe(ErrorCode.UNKNOWN);
    expect(wrapped.originalError).toBe(error);
  });

  it('should wrap string error', () => {
    const wrapped = wrapError('String error', ErrorCode.UNKNOWN);

    expect(isKeylioError(wrapped)).toBe(true);
  });

  it('should infer error code from error message', () => {
    const insufficientFundsError = new Error('insufficient funds for transaction');
    const wrapped = wrapError(insufficientFundsError);

    expect(wrapped.code).toBe(ErrorCode.TX_INSUFFICIENT_BALANCE);
  });

  it('should add context to wrapped error', () => {
    const error = new Error('Test');
    const context = { operation: 'test' };
    const wrapped = wrapError(error, ErrorCode.UNKNOWN, context);

    expect(wrapped.context).toEqual(context);
  });
});

describe('getErrorMessage', () => {
  it('should return message for KeylioError', () => {
    const error = new KeylioError(ErrorCode.AUTH_SESSION_EXPIRED);
    const message = getErrorMessage(error);

    expect(message).toBe(ERROR_MESSAGES[ErrorCode.AUTH_SESSION_EXPIRED]);
  });

  it('should return wrapped message for regular Error', () => {
    const error = new Error('Network timeout occurred');
    const message = getErrorMessage(error);

    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  });

  it('should return unknown message for non-error values', () => {
    const message = getErrorMessage('string error');

    expect(message).toBe(ERROR_MESSAGES[ErrorCode.UNKNOWN]);
  });
});

describe('ERROR_MESSAGES', () => {
  it('should have messages for all error codes', () => {
    const errorCodes = Object.values(ErrorCode).filter(
      (v) => typeof v === 'number'
    );

    errorCodes.forEach((code) => {
      expect(ERROR_MESSAGES[code as ErrorCode]).toBeDefined();
      expect(typeof ERROR_MESSAGES[code as ErrorCode]).toBe('string');
    });
  });

  it('should have messages in Traditional Chinese', () => {
    // Check a few messages contain Chinese characters
    const chineseRegex = /[\u4e00-\u9fa5]/;

    expect(chineseRegex.test(ERROR_MESSAGES[ErrorCode.AUTH_PASSWORD_WRONG])).toBe(true);
    expect(chineseRegex.test(ERROR_MESSAGES[ErrorCode.TX_INSUFFICIENT_BALANCE])).toBe(true);
  });
});
