/**
 * Simple version utility functions
 */

/**
 * Validate if a string is a valid semantic version
 * Matches x.y.z or x.y.z-prerelease[.n]
 */
export function isValidSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*)?$/.test(version);
}

/**
 * Parse a version string into its components
 * Note: Leading zeros in version numbers are valid in semver strings but normalize to integers
 * (e.g., "01.02.03" becomes { major: 1, minor: 2, patch: 3 })
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number; prerelease?: string } | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*))?$/);
  if (!match) return null;
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || undefined,
  };
}
