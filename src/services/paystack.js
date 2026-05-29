import PaystackPop from '@paystack/inline-js'

export function openPaystackPayment({ key, email, amount, reference, metadata, onSuccess, onClose }) {
  if (!key) {
    console.error('Paystack public key is missing in environment variables')
    return
  }
  const paystack = new PaystackPop()
  paystack.newTransaction({
    key,
    email,
    amount,
    reference,
    metadata,
    onSuccess,
    onCancel: onClose,
  })
}
