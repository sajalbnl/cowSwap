/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react'

import { isMobile } from 'react-device-detect'
import { UaEventOptions } from 'react-ga4/types/ga4'
import { useNetworkId } from 'state/network'
import { getCLS, getFCP, getFID, getLCP, Metric } from 'web-vitals'

import GoogleAnalyticsProvider from './GoogleAnalyticsProvider'

const GOOGLE_ANALYTICS_ID: string | undefined = process.env.REACT_APP_EXPLORER_GOOGLE_ANALYTICS_ID
export const GOOGLE_ANALYTICS_CLIENT_ID_STORAGE_KEY = 'ga_client_id'

const storedClientId = window.localStorage.getItem(GOOGLE_ANALYTICS_CLIENT_ID_STORAGE_KEY)

const googleAnalytics = new GoogleAnalyticsProvider()

export function sendEvent(event: string | UaEventOptions, params?: any): void {
  googleAnalytics.sendEvent(event, params)
}

export function outboundLink(
  {
    label,
  }: {
    label: string
  },
  hitCallback: () => unknown
): any {
  return googleAnalytics.outboundLink({ label }, hitCallback)
}

export function sendTiming(timingCategory: any, timingVar: any, timingValue: any, timingLabel: any): any {
  return googleAnalytics.gaCommandSendTiming(timingCategory, timingVar, timingValue, timingLabel)
}

if (typeof GOOGLE_ANALYTICS_ID === 'string') {
  googleAnalytics.initialize(GOOGLE_ANALYTICS_ID, {
    gaOptions: {
      storage: 'none',
      storeGac: false,
      clientId: storedClientId ?? undefined,
    },
  })
  googleAnalytics.set({
    anonymizeIp: true,
    customBrowserType: !isMobile
      ? 'desktop'
      : 'web3' in window || 'ethereum' in window
      ? 'mobileWeb3'
      : 'mobileRegular',
  })
} else {
  googleAnalytics.initialize('test', { gtagOptions: { debug_mode: true } })
}

const installed = Boolean(window.navigator.serviceWorker?.controller)
const hit = Boolean((window as any).__isDocumentCached)
const action = installed ? (hit ? 'Cache hit' : 'Cache miss') : 'Not installed'
sendEvent({ category: 'Service Worker', action, nonInteraction: true })

function reportWebVitals({ name, delta, id }: Metric): void {
  sendTiming('Web Vitals', name, Math.round(name === 'CLS' ? delta * 1000 : delta), id)
}

// tracks web vitals and pageviews
export function useAnalyticsReporter({ pathname, search }: { pathname: string; search: string }, app: string): void {
  useEffect(() => {
    getFCP(reportWebVitals)
    getFID(reportWebVitals)
    getLCP(reportWebVitals)
    getCLS(reportWebVitals)
  }, [])

  const chainId = useNetworkId()
  useEffect(() => {
    // cd1 - custom dimension 1 - chainId
    googleAnalytics.set({ cd1: chainId ?? 0 })
  }, [chainId])

  useEffect(() => {
    googleAnalytics.pageview(`${pathname}${search}`)
  }, [pathname, search, app])

  useEffect(() => {
    // typed as 'any' in react-ga4 -.-
    googleAnalytics.ga((tracker: any) => {
      if (!tracker) return

      const clientId = tracker.get('clientId')
      window.localStorage.setItem(GOOGLE_ANALYTICS_CLIENT_ID_STORAGE_KEY, clientId)
    })
  }, [])
}
