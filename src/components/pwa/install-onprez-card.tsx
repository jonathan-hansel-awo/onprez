'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  Check,
  CheckCircle2,
  Download,
  MoreVertical,
  MonitorDown,
  Share2,
  Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { detectInstallPlatform, isStandaloneDisplay, type InstallPlatform } from '@/lib/pwa/install'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

interface InstallOnPrezCardProps {
  compact?: boolean
}

const instructions: Record<
  InstallPlatform,
  { title: string; icon: typeof Smartphone; steps: string[] }
> = {
  ios: {
    title: 'Install on iPhone or iPad',
    icon: Share2,
    steps: [
      'Open OnPrez in Safari.',
      'Tap the Share button in Safari.',
      'Scroll down and choose Add to Home Screen.',
      'Confirm by tapping Add.',
      'Open OnPrez from its new Home Screen icon.',
    ],
  },
  android: {
    title: 'Install on Android',
    icon: Smartphone,
    steps: [
      'Open OnPrez in Chrome.',
      'Tap Install OnPrez below when available.',
      'If no button appears, open the browser menu.',
      'Choose Install app or Add to Home screen.',
    ],
  },
  desktop: {
    title: 'Install on this computer',
    icon: MonitorDown,
    steps: [
      'Open OnPrez in Chrome or Microsoft Edge.',
      'Choose Install OnPrez below when available.',
      'You can also use the install icon in the address bar.',
    ],
  },
}

export function InstallOnPrezCard({ compact = false }: InstallOnPrezCardProps) {
  const [platform, setPlatform] = useState<InstallPlatform>('desktop')
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installDismissed, setInstallDismissed] = useState(false)

  useEffect(() => {
    const displayModeQuery = window.matchMedia('(display-mode: standalone)')
    const navigatorWithStandalone = navigator as NavigatorWithStandalone

    const updateInstalledState = () => {
      setIsInstalled(
        isStandaloneDisplay(displayModeQuery.matches, navigatorWithStandalone.standalone === true)
      )
    }

    setPlatform(
      detectInstallPlatform({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
      })
    )
    updateInstalledState()

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
      setInstallDismissed(false)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    displayModeQuery.addEventListener('change', updateInstalledState)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      displayModeQuery.removeEventListener('change', updateInstalledState)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice

    setInstallPrompt(null)
    setInstallDismissed(choice.outcome === 'dismissed')
  }

  const guide = instructions[platform]
  const GuideIcon = guide.icon

  if (isInstalled && compact) {
    return (
      <Card
        hover={false}
        className="overflow-hidden border-emerald-200 bg-gradient-to-r from-emerald-50 to-white"
      >
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-gray-950">OnPrez is installed</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Open it from your Home Screen or app launcher to go straight to your dashboard.
              </p>
            </div>
          </div>
          {compact && (
            <Link
              href="/dashboard/settings/app"
              className="text-sm font-semibold text-onprez-blue hover:text-onprez-purple"
            >
              View app guide
            </Link>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      hover={false}
      className={
        isInstalled
          ? 'overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-violet-50'
          : 'overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 via-white to-violet-50'
      }
    >
      <CardContent className={compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-2xl items-start gap-4">
            <span
              className={
                isInstalled
                  ? 'grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700'
                  : 'grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-onprez-blue to-onprez-purple text-white shadow-lg shadow-blue-600/20'
              }
            >
              {isInstalled ? (
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Download className="h-6 w-6" aria-hidden="true" />
              )}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-gray-950">
                  {isInstalled ? 'OnPrez is installed' : 'Take OnPrez with you'}
                </h2>
                <span
                  className={
                    isInstalled
                      ? 'rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700'
                      : 'rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700'
                  }
                >
                  {isInstalled ? 'Ready on this device' : 'Installable app'}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">
                {isInstalled
                  ? 'Open OnPrez from your Home Screen or app launcher to go straight to your dashboard.'
                  : 'Add OnPrez to this device for a focused, full-screen dashboard that opens from your Home Screen or app launcher.'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {!isInstalled && installPrompt && (
              <Button type="button" size="sm" onClick={handleInstall}>
                <Download className="mr-2 inline h-4 w-4" aria-hidden="true" />
                Install OnPrez
              </Button>
            )}
            {compact && (
              <Link
                href="/dashboard/settings/app"
                className="inline-flex min-h-10 items-center rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-onprez-blue transition-colors hover:border-onprez-blue hover:bg-blue-50"
              >
                Installation guide
              </Link>
            )}
          </div>
        </div>

        {!compact && (
          <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
              {isInstalled ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Installation complete
                      </p>
                      <h3 className="font-semibold text-gray-950">Ready on this device</h3>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-gray-700">
                    The installed app launches directly into your dashboard. You can still use
                    OnPrez normally in your browser whenever you prefer.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-onprez-blue">
                      <GuideIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-onprez-blue">
                        Recommended for this device
                      </p>
                      <h3 className="font-semibold text-gray-950">{guide.title}</h3>
                    </div>
                  </div>

                  <ol className="mt-5 space-y-3">
                    {guide.steps.map((step, index) => (
                      <li key={step} className="flex gap-3 text-sm leading-6 text-gray-700">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>

                  {!installPrompt && platform !== 'ios' && (
                    <p className="mt-5 flex gap-2 rounded-xl bg-gray-50 p-3 text-sm leading-6 text-gray-600">
                      <MoreVertical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      If the install button is not available yet, use your browser menu and choose
                      <strong className="font-semibold text-gray-800"> Install app</strong>.
                    </p>
                  )}

                  {installDismissed && (
                    <p className="mt-4 text-sm text-amber-700" role="status">
                      Installation was dismissed. You can try again from your browser&apos;s install
                      menu.
                    </p>
                  )}
                </>
              )}
            </section>

            <section className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700">
                  <Bell className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold text-gray-950">About booking alerts</h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-700">
                Installing OnPrez and enabling notifications are separate choices. Booking-alert
                setup uses its own clear permission button below.
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-700">
                <li className="flex gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-violet-700" aria-hidden="true" />
                  On iPhone and iPad, open OnPrez from the Home Screen before enabling booking
                  alerts.
                </li>
                <li className="flex gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-violet-700" aria-hidden="true" />
                  OnPrez will not request notification permission automatically.
                </li>
                <li className="flex gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-violet-700" aria-hidden="true" />
                  Email remains available independently of the installed app.
                </li>
              </ul>
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
