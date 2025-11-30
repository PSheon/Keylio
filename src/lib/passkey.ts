import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { type PublicKeyCredentialCreationOptionsJSON, type PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';
import db from '@/lib/storage/db';
import type { PasskeyMetadata } from '@/lib/storage/db';

// Mock "Server" State (In a real app, this would be in a DB)
const RP_NAME = 'Keylio Wallet';

/**
 * Detect device type and generate a friendly name
 * @param authenticatorAttachment - 'platform' or 'cross-platform'
 */
export const detectDeviceName = async (authenticatorAttachment?: string): Promise<string> => {
  const ua = navigator.userAgent;

  // Get existing passkeys count for numbering
  const setting = await db.settings.get({ key: 'passkeys_metadata' });
  const passkeys = (setting?.value as PasskeyMetadata[]) || [];

  // If cross-platform (QR code from phone), use generic name
  if (authenticatorAttachment === 'cross-platform') {
    const crossPlatformCount = passkeys.filter(pk =>
      pk.name.includes('Phone') || pk.name.includes('Other Device')
    ).length;
    return `Phone/Other Device ${crossPlatformCount + 1}`;
  }

  // Platform authenticator - detect from User Agent
  let deviceType = 'Device';

  // Mac detection
  if (ua.includes('Mac')) {
    deviceType = 'Mac';
  }
  // iPhone detection
  else if (ua.includes('iPhone')) {
    deviceType = 'iPhone';
  }
  // iPad detection
  else if (ua.includes('iPad')) {
    deviceType = 'iPad';
  }
  // Windows detection
  else if (ua.includes('Windows')) {
    deviceType = 'Windows PC';
  }
  // Android detection
  else if (ua.includes('Android')) {
    deviceType = 'Android';
  }
  // Linux detection
  else if (ua.includes('Linux')) {
    deviceType = 'Linux';
  }

  // Count devices of the same type
  const sameTypeCount = passkeys.filter(pk =>
    pk.name.startsWith(`My ${deviceType}`)
  ).length;

  return `My ${deviceType} ${sameTypeCount + 1}`;
};

// Helper to generate random challenge
const generateChallenge = () => {
  if (typeof window === 'undefined') return 'mock-challenge-for-ssr';
  const random = new Uint8Array(32);
  window.crypto.getRandomValues(random);
  return btoa(String.fromCharCode(...Array.from(random))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const getRpId = () => {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.hostname;
};

// Mock: Generate Registration Options
export const generateRegistrationOptions = async (username: string, excludeCredentials: string[] = []): Promise<PublicKeyCredentialCreationOptionsJSON> => {
  return {
    challenge: generateChallenge(),
    rp: {
      name: RP_NAME,
      id: getRpId(),
    },
    user: {
      id: btoa(username).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
      name: username,
      displayName: username,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    timeout: 60000,
    attestation: 'none',
    excludeCredentials: excludeCredentials.length > 0 ? excludeCredentials.map(id => ({
      id,
      type: 'public-key' as const,
      transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
    })) : [],
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  };
};

// Mock: Generate Authentication Options
export const generateAuthenticationOptions = async (): Promise<PublicKeyCredentialRequestOptionsJSON> => {
  return {
    challenge: generateChallenge(),
    rpId: getRpId(),
    timeout: 60000,
    userVerification: 'preferred',
    allowCredentials: [], // Allow any credential for this RP
  };
};

export const registerPasskey = async (username: string) => {
  try {
    const setting = await db.settings.get({ key: 'passkeys_metadata' });
    const existingPasskeys = (setting?.value as PasskeyMetadata[]) || [];
    const excludeCredentials = existingPasskeys.map(pk => pk.credentialId);

    const options = await generateRegistrationOptions(username, excludeCredentials);
    const attResp = await startRegistration({ optionsJSON: options });

    if (excludeCredentials.includes(attResp.id)) {
      throw new Error('此設備已加入');
    }

    return {
      credentialId: attResp.id,
      rawId: attResp.rawId,
      authenticatorAttachment: attResp.authenticatorAttachment,
    };
  } catch (error) {
    console.error('Passkey Registration Failed:', error);
    throw error;
  }
};

/**
 * Authenticate with Passkey
 * @param credentialId - Optional credential ID to use a specific Passkey
 * @returns true on success, credential ID used
 */
export const authenticatePasskey = async (credentialId?: string) => {
  try {
    const options = await generateAuthenticationOptions();

    // If credentialId provided, specify it in allowCredentials
    if (credentialId) {
      options.allowCredentials = [
        {
          id: credentialId,
          type: 'public-key',
          transports: ['internal', 'hybrid', 'usb', 'nfc', 'ble'],
        },
      ];
    }

    const authResp = await startAuthentication({ optionsJSON: options });
    // In a real app, send authResp to server for verification
    return {
      success: true,
      credentialId: authResp.id,
    };
  } catch (error) {
    console.error('Passkey Authentication Failed:', error);
    throw error;
  }
};

/**
 * Get the default Passkey metadata
 * @returns Default Passkey metadata or null
 */
export const getDefaultPasskey = async (): Promise<PasskeyMetadata | null> => {
  const setting = await db.settings.get({ key: 'passkeys_metadata' });
  const passkeys = (setting?.value as PasskeyMetadata[]) || [];
  return passkeys.find(pk => pk.isDefault) || null;
};

/**
 * Get all registered Passkeys
 * @returns Array of Passkey metadata
 */
export const getAllPasskeys = async (): Promise<PasskeyMetadata[]> => {
  const setting = await db.settings.get({ key: 'passkeys_metadata' });
  return (setting?.value as PasskeyMetadata[]) || [];
};
