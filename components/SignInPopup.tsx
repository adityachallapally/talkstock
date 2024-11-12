import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SignInPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInPopup({ isOpen, onClose }: SignInPopupProps) {
  const handleSignIn = (provider: string) => {
    signIn(provider);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={() => handleSignIn('google')}>
            Sign in with Google
          </Button>
          <Button onClick={() => handleSignIn('github')}>
            Sign in with GitHub
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}