import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';

// Mock "Server" State (In a real app, this would be in a DB)
const RP_NAME = 'Keylio Wallet';

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
export const generateRegistrationOptions = async (username: string): Promise<PublicKeyCredentialCreationOptionsJSON> => {
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
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      // authenticatorAttachment: 'platform', // Allow cross-platform (e.g. phone via QR)
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
    const options = await generateRegistrationOptions(username);
    const attResp = await startRegistration({ optionsJSON: options });
    console.log('Passkey Registered:', attResp);
    // In a real app, send attResp to server for verification
    return true;
  } catch (error) {
    console.error('Passkey Registration Failed:', error);
    throw error;
  }
};

export const authenticatePasskey = async () => {
  try {
    const options = await generateAuthenticationOptions();
    const authResp = await startAuthentication({ optionsJSON: options });
    console.log('Passkey Authenticated:', authResp);
    // In a real app, send authResp to server for verification
    return true;
  } catch (error) {
    console.error('Passkey Authentication Failed:', error);
    throw error;
  }
};
