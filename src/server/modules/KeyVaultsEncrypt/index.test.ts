// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';

import { KeyVaultsGateKeeper } from './index';

describe('KeyVaultsGateKeeper', () => {
  let gateKeeper: KeyVaultsGateKeeper;

  beforeEach(async () => {
    process.env.KEY_VAULTS_SECRET = 'Q10pwdq00KXUu9R+c8A8p4PSlIRWi7KwgUophBtkHVk=';
    gateKeeper = await KeyVaultsGateKeeper.initWithEnvKey();
  });

  it('should encrypt and decrypt data correctly', async () => {
    const originalData = 'sensitive user data';

    const encryptedData = await gateKeeper.encrypt(originalData);

    const decryptionResult = await gateKeeper.decrypt(encryptedData);

    expect(decryptionResult.plaintext).toBe(originalData);
    expect(decryptionResult.wasAuthentic).toBe(true);
  });

  it('should return empty plaintext and false authenticity for invalid encrypted data', async () => {
    const invalidEncryptedData = 'invalid:encrypted:data';

    const decryptionResult = await gateKeeper.decrypt(invalidEncryptedData);

    expect(decryptionResult.plaintext).toBe('');
    expect(decryptionResult.wasAuthentic).toBe(false);
  });

  it('should throw an error if KEY_VAULTS_SECRET is not set', async () => {
    const originalSecretKey = process.env.KEY_VAULTS_SECRET;
    process.env.KEY_VAULTS_SECRET = '';

    try {
      await KeyVaultsGateKeeper.initWithEnvKey();
    } catch (e) {
      expect(e).toEqual(
        Error(` \`KEY_VAULTS_SECRET\` is not set, please set it in your environment variables.

If you don't have it, please run \`openssl rand -base64 32\` to create one.
`),
      );
    }

    process.env.KEY_VAULTS_SECRET = originalSecretKey;
  });
});
