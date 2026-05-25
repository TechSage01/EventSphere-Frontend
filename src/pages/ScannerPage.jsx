import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

const API_BASE = ''

export default function ScannerPage({ user }) {
  const { eventId } = useParams()
  const videoRef = useRef(null)
  const [status, setStatus] = useState('')
  const [scanning, setScanning] = useState(false)
  const [stats, setStats] = useState(null)
  const [manual, setManual] = useState('')

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line
  }, [eventId])

  async function fetchStats() {
    try {
      const token = localStorage.getItem('es_token')
      const res = await fetch(`/api/tickets/events/${eventId}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load stats')
      setStats(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    let stream = null
    let detector = null
    let rafId = null

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) videoRef.current.srcObject = stream
        // prefer native BarcodeDetector when available
        if (window.BarcodeDetector && BarcodeDetector.getSupportedFormats) {
          const formats = await BarcodeDetector.getSupportedFormats()
          if (formats.includes('qr_code')) {
            detector = new BarcodeDetector({ formats: ['qr_code'] })
            setScanning(true)
            detectLoop()
            return
          }
        }
        // fallback: show manual input
        setStatus('Camera available but no BarcodeDetector support. Use manual input.')
      } catch (err) {
        console.error('Camera start failed', err)
        setStatus('Camera access denied or unavailable. Use manual input.')
      }
    }

    async function detectLoop() {
      if (!videoRef.current || !detector) return
      try {
        const detections = await detector.detect(videoRef.current)
        if (detections && detections.length) {
          const code = detections[0].rawValue
          if (code) await handleScanned(code)
        }
      } catch (err) {
        // ignore per-frame errors
      }
      rafId = requestAnimationFrame(detectLoop)
    }

    start()

    return () => {
      setScanning(false)
      if (rafId) cancelAnimationFrame(rafId)
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
    }
    // eslint-disable-next-line
  }, [eventId])

  async function handleScanned(raw) {
    // avoid double handling
    if (!raw) return
    setStatus(`Scanned: ${raw}`)
    const ticketId = extractTicketId(raw)
    if (!ticketId) {
      setStatus('Could not parse ticket id from QR')
      return
    }
    await verifyTicket(ticketId)
  }

  function extractTicketId(raw) {
    try {
      const url = new URL(raw)
      const parts = url.pathname.split('/')
      const idx = parts.indexOf('tickets')
      if (idx >= 0 && parts[idx+1]) return parts[idx+1]
    } catch (_) {}
    // fallback: if raw looks like a ticket id (alphanumeric with dashes)
    if (/^[A-Za-z0-9\-]{6,}$/.test(raw)) return raw
    return null
  }

  async function verifyTicket(ticketId) {
    try {
      setStatus('Verifying...')
      const token = localStorage.getItem('es_token')
      const res = await fetch(`/api/tickets/${ticketId}/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Verification failed')
      setStatus(`Check-in successful: ${data.message || 'OK'}`)
      fetchStats()
    } catch (err) {
      console.error(err)
      setStatus(err.message || 'Verification error')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Event Check-in</h2>
      {stats && stats.event && (
        <div style={{ marginBottom: 12 }}>
          <strong>{stats.event.title}</strong>
          <div>Paid: {stats.paidCount} — Checked-in: {stats.scannedCount} — To enter: {stats.unscannedCount}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: 8, background: '#000' }} />
          <div style={{ marginTop: 8 }}>{scanning ? 'Scanning...' : 'Camera ready'}</div>
        </div>
        <div style={{ width: 320 }}>
          <div style={{ marginBottom: 8 }}><strong>Status</strong></div>
          <div style={{ minHeight: 80, padding: 8, background: '#0f0f12', color: '#ddd', borderRadius: 8 }}>{status || 'Idle'}</div>

          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 6 }}><strong>Manual check-in</strong></div>
            <input value={manual} onChange={e => setManual(e.target.value)} placeholder="Paste ticket URL or id" style={{ width: '100%', padding: 8, borderRadius: 6 }} />
            <button onClick={() => verifyTicket(manual)} style={{ marginTop: 8, width: '100%', padding: 10, borderRadius: 8 }}>Verify</button>
          </div>
        </div>
      </div>
    </div>
  )
}
