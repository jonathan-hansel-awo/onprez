import { type Metric, onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

function sendToAnalytics(metric: Metric) {
  // Send to your analytics endpoint
  const body = JSON.stringify(metric)
  const url = '/api/analytics'

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body)
  } else {
    fetch(url, {
      body,
      method: 'POST',
      keepalive: true,
    })
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics)
  onINP(sendToAnalytics)
  onFCP(sendToAnalytics)
  onLCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
}
