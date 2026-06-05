import { Link } from 'react-router-dom'
import SkeinLogo from '../../components/ui/SkeinLogo'
import s from './AppInDevelopmentView.module.css'

const GOOGLE_PLAY_URL = '#'

export default function AppInDevelopmentView() {
  return (
    <div className={s.wrap}>
      <section className={s.center}>
        <div className={s.logoWrap}>
          <SkeinLogo size={132} />
          <span className={s.motifStar} aria-hidden>* * *</span>
          <span className={s.motifSlash} aria-hidden>// // //</span>
        </div>

        <h1 className={s.greeting}>YarnLog</h1>
        <p className={s.tagline}>stitch happens.</p>

        <p className={s.body}>
          The web version is still on the needles. We're knitting it together,
          row by row — check back soon.
        </p>

        <p className={s.bodyAlt}>
          In the meantime, you can cast on with the mobile app:
        </p>

        <a
          className={s.cta}
          href={GOOGLE_PLAY_URL}
          target="_blank"
          rel="noreferrer noopener"
        >
          <span className={s.ctaLabel}>Get it on</span>
          <span className={s.ctaName}>Google Play</span>
        </a>

        <p className={s.note}>no account needed · ever</p>
      </section>

      <footer className={s.footer}>
        <Link to="/privacy-policy" className={s.footerLink}>Privacy Policy</Link>
        <span className={s.footerDot} aria-hidden>·</span>
        <span className={s.footerCopy}>© {new Date().getFullYear()} YarnLog</span>
      </footer>
    </div>
  )
}
