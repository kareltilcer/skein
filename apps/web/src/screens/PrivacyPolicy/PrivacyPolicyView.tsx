import { Link } from 'react-router-dom'
import SkeinLogo from '../../components/ui/SkeinLogo'
import s from './PrivacyPolicyView.module.css'

const LAST_UPDATED = 'June 5, 2026'
const CONTACT_EMAIL = 'email@email.com'

export default function PrivacyPolicyView() {
  return (
    <div className={s.wrap}>
      <header className={s.topBar}>
        <Link to="/" className={s.brand}>
          <SkeinLogo size={36} />
          <span className={s.brandWord}>YarnLog</span>
        </Link>
      </header>

      <article className={s.article}>
        <p className={s.eyebrow}>Legal</p>
        <h1 className={s.title}>Privacy Policy</h1>
        <p className={s.updated}>Last updated · {LAST_UPDATED}</p>

        <section className={s.section}>
          <h2 className={s.h2}>Introduction</h2>
          <p className={s.p}>
            YarnLog ("we", "our", or "the app") is designed with privacy as a
            first principle. We believe a knitting companion should keep your
            place — not your data. This Privacy Policy describes what
            information the app handles, how it is used, and the choices
            available to you.
          </p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>Information We Collect</h2>
          <p className={s.p}>
            YarnLog does not require an account, and we do not collect personal
            information on our servers. All project data — your patterns,
            rows, repeats, stitch libraries, color choices, and progress — is
            stored locally on your device.
          </p>
          <p className={s.p}>
            We do not request access to your contacts, photos, location, or
            other personal data unless you explicitly choose a feature that
            requires it (for example, importing a project photo).
          </p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>How We Use Information</h2>
          <p className={s.p}>
            Because the app stores your data on your device, that information
            is used solely to provide the in-app experience: showing your
            projects, advancing your row, and remembering your preferences.
            We do not sell, share, or transmit your project data to any third
            party.
          </p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>Data Storage and Security</h2>
          <p className={s.p}>
            Your data is held in your device's standard application storage and
            is governed by the security model of your operating system. If you
            uninstall the app or clear its storage, your data is removed from
            the device.
          </p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>Analytics and Crash Reporting</h2>
          <p className={s.p}>
            If the app uses analytics or crash reporting, such data is limited
            to anonymous, aggregated information used to improve stability and
            user experience. It is never linked to your identity and does not
            include the contents of your projects.
          </p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>Children's Privacy</h2>
          <p className={s.p}>
            YarnLog is intended for a general audience. We do not knowingly
            collect personal information from children under the age of 13.
          </p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>Your Rights</h2>
          <p className={s.p}>
            Since your data lives on your device, you remain in control. You
            can review, modify, or delete your data at any time through the
            app's interface or by removing the application from your device.
          </p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>Changes to This Policy</h2>
          <p className={s.p}>
            We may update this Privacy Policy from time to time. When we do,
            we will revise the "Last updated" date above. Continued use of the
            app after a change indicates acceptance of the updated policy.
          </p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>Contact</h2>
          <p className={s.p}>
            Questions about this policy or your data? Reach out at{' '}
            <a className={s.link} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>
      </article>

      <footer className={s.footer}>
        <Link to="/" className={s.footerLink}>← Back to home</Link>
        <span className={s.footerDot} aria-hidden>·</span>
        <span className={s.footerCopy}>© {new Date().getFullYear()} YarnLog</span>
      </footer>
    </div>
  )
}
