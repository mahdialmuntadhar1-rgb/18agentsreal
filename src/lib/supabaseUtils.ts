import { supabase } from './supabase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    providerInfo: any[];
  }
}

export async function handleSupabaseError(error: any, operationType: OperationType, path: string | null) {
  let user = null;
  try {
    // Try to get user info, but don't let it block if it fails (e.g. network error)
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch (e) {
    console.warn('Could not fetch user info for error reporting:', e);
  }
  
  const errInfo: SupabaseErrorInfo = {
    error: error?.message || String(error),
    authInfo: {
      userId: user?.id,
      email: user?.email,
      emailVerified: user?.email_confirmed_at ? true : false,
      isAnonymous: user?.is_anonymous,
      providerInfo: user?.app_metadata?.providers || []
    },
    operationType,
    path
  }
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
