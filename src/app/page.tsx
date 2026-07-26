import { Game } from '@/components/Game'
import { LocaleProvider } from '@/i18n/LocaleProvider'

export default function Page() {
  return (
    <LocaleProvider>
      <Game />
    </LocaleProvider>
  )
}
