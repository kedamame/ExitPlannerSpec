'use client'

import { useLocalStorage } from '@/hooks/useLocalStorage'

export function LanguageToggle() {
  const [locale, setLocale] = useLocalStorage<string>('exit_planner_locale', 'en')

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')}
      className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-gray-800"
      title="Toggle language"
    >
      {locale === 'en' ? '🇯🇵' : '🇺🇸'}
    </button>
  )
}
