/**
 * A simple password utility for hashing and comparing passwords
 * This is a browser-compatible alternative to bcrypt
 */

// Hash a password (for demo purposes - in production use a stronger method)
export async function hashPassword(password: string): Promise<string> {
  // Convert the password to an array buffer
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Hash the password using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert the hash to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Compare a password with a hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}