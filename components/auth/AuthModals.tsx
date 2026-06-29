'use client';

import { useAuth } from '@/contexts/AuthContext';
import SignInModal from './SignInModal';
import SignUpModal from './SignUpModal';
import { AuthModalStyles } from './AuthModalShared';

export default function AuthModals() {
  const { showAuthModal } = useAuth();

  return (
    <>
      <AuthModalStyles />
      {/* Mount only while open so each modal starts with fresh form state. */}
      {showAuthModal === 'signin' && <SignInModal />}
      {showAuthModal === 'signup' && <SignUpModal />}
    </>
  );
}
