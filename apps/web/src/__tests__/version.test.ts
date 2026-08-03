/**
 * Tests for version utility functions
 */

import { isValidSemver, parseVersion } from '../utils/version';

describe('Version Utilities', () => {
  describe('isValidSemver', () => {
    it('should return true for valid semantic versions', () => {
      expect(isValidSemver('1.0.0')).toBe(true);
      expect(isValidSemver('0.0.1')).toBe(true);
      expect(isValidSemver('2.3.4')).toBe(true);
      expect(isValidSemver('10.20.30')).toBe(true);
    });

    it('should return true for prerelease versions', () => {
      expect(isValidSemver('1.0.0-alpha')).toBe(true);
      expect(isValidSemver('1.0.0-beta')).toBe(true);
      expect(isValidSemver('1.0.0-beta.1')).toBe(true);
      expect(isValidSemver('1.0.0-beta.2')).toBe(true);
      expect(isValidSemver('1.0.0-rc.1')).toBe(true);
    });

    it('should return false for invalid versions', () => {
      expect(isValidSemver('1.0')).toBe(false);
      expect(isValidSemver('1')).toBe(false);
      expect(isValidSemver('1.0.0.0')).toBe(false);
      expect(isValidSemver('v1.0.0')).toBe(false);
      expect(isValidSemver('1.0.0-alpha_1')).toBe(false);
      expect(isValidSemver('1.0.-beta')).toBe(false);
      expect(isValidSemver('')).toBe(false);
      expect(isValidSemver('latest')).toBe(false);
    });
  });

  describe('parseVersion', () => {
    it('should parse simple versions', () => {
      const result = parseVersion('1.2.3');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: undefined,
      });
    });

    it('should parse prerelease versions', () => {
      const result = parseVersion('1.2.3-beta.1');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'beta.1',
      });
    });

    it('should return null for invalid versions', () => {
      expect(parseVersion('1.0')).toBeNull();
      expect(parseVersion('invalid')).toBeNull();
      expect(parseVersion('')).toBeNull();
    });

    it('should handle leading zeros in version numbers', () => {
      const result = parseVersion('01.02.03');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: undefined,
      });
    });
  });
});
