const PAYSTACK_PUBLIC_KEY = import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY || ''

export function getPaystackKey() {
  return PAYSTACK_PUBLIC_KEY
}

export { PAYSTACK_PUBLIC_KEY }
