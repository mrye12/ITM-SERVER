import toast, { Toaster } from 'react-hot-toast';

export interface ToastContextType {
  toast: typeof toast;
}

export function useToast(): ToastContextType {
  return {
    toast
  };
}

export { Toaster, toast };
