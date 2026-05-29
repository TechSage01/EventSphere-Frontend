import PaystackPop from '@paystack/inline-js'

export function getPaystackPublicKey(explicitKey) {
  const viteKey = import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY
  const nextKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY : undefined
  const craKey = typeof process !== 'undefined' ? process.env.REACT_APP_PAYSTACK_PUBLIC_KEY : undefined

  return explicitKey || viteKey || nextKey || craKey || ''
}

export function openPaystackPayment({ key, email, amount, reference, metadata, onSuccess, onClose }) {
  const resolvedKey = getPaystackPublicKey(key)
  if (!resolvedKey) {
    console.error('Paystack public key is missing in environment variables')
    return { ok: false, error: 'Payment system not configured. Please contact support.' }
  }

  const paystack = new PaystackPop()
  paystack.newTransaction({
    key: resolvedKey,
    email,
    amount,
    reference,
    metadata,
    onSuccess,
    onCancel: onClose,
  })

  return { ok: true }
}
