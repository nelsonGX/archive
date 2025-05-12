'use server';

import { signOut as nextAuthSignOut } from '@/app/auth';

export async function signOutAction() {
  await nextAuthSignOut();
}