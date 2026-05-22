import PaystackPop from '@paystack/inline-js'

export function openPaystackPayment({ key, email, amount, reference, metadata, onSuccess, onClose }) {
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
