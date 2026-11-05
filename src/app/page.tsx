import { AgentConsole } from '@/components/AgentConsole';
import { Button } from '@/components/Button';
import { ContactForm } from '@/components/ContactForm';
import { GTMHero } from '@/components/gtm/GTMHero';
import { ServiceTabs } from '@/components/ServiceTabs';
import { about, consoleSection, contactHref, engagement, faq, finalCta, hero, principles, servicesIntro, site } from '@/data/site';

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

export default function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="label" data-reveal="fade" data-intro>{hero.eyebrow}</p>
          <h1 id="hero-title" className="hero__title" data-split="lines" data-intro>{hero.headline}</h1>
        </div>
        <div className="hero__side">
          <p className="hero__lede">{hero.copy}</p>
          <div className="hero__actions" data-reveal="up" data-intro data-delay="0.35">
            <Button href={contactHref} arrow>{site.cta.primary}</Button>
            <Button href="#services" variant="line">{site.cta.secondary}</Button>
          </div>
        </div>
      </section>

      {/* The pipeline story. Desktop: a tall track with a sticky stage, scroll drives the chapters. */}
      <section className="story" aria-label="how the connected revenue engine works">
        <div className="story__pin" data-reveal="fade" data-intro data-delay="0.15">
          <GTMHero />
        </div>
      </section>

      <section id="console" className="section section--console" aria-labelledby="console-title">
        <div className="section__head">
          <div className="section__lead">
            <p className="label" data-reveal="fade">{consoleSection.label}</p>
            <h2 id="console-title" className="h2" data-split="lines">{consoleSection.heading}</h2>
          </div>
          <p className="section__intro" data-reveal="up">{consoleSection.copy}</p>
        </div>
        <AgentConsole />
      </section>

      <section id="services"className="section section--services" aria-labelledby="services-title">
        <div className="section__head">
          <h2 id="services-title" className="h2" data-split="lines">{servicesIntro.heading}</h2>
          <p className="section__intro" data-reveal="up">{servicesIntro.copy}</p>
        </div>
        <ServiceTabs />
        <div className="svc__cta" data-reveal="up">
          <p>Not sure which service fits? Tell us what you&rsquo;re working on.</p>
          <Button href={contactHref} arrow>{site.cta.primary}</Button>
        </div>
      </section>


      <section id="about" className="section section--dark" aria-labelledby="about-title">
        <div className="about">
          <p className="label about__label">{about.label}</p>
          <h2 id="about-title" className="h2" data-split="lines">{about.heading}</h2>
          <p className="about__text" data-reveal="up">{about.text}</p>
        </div>
        <div className="why">
          <div className="why__head">
            <h3 className="h3">{principles.heading}</h3>
          </div>
          <ol className="why__list">
            {principles.items.map((p, i) => (
              <li key={p.name} data-reveal="up" data-delay={String(i * 0.06)}>
                <span className="why__n" aria-hidden="true">0{i + 1}</span>
                <h4 className="why__name">{p.name}</h4>
                <p className="why__text">{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="engagement" className="section section--engage" aria-labelledby="engage-title">
        <div className="engage">
          <div className="engage__head">
            <h2 id="engage-title" className="h2" data-split="lines">{engagement.heading}</h2>
            <p className="section__intro">{engagement.intro}</p>
          </div>
          <ol className="engage__list">
            {engagement.stages.map((s, i) => (
              <li key={s.name} className="engage__stage" data-reveal="up">
                <span className="engage__n" aria-hidden="true">0{i + 1}</span>
                <div>
                  <h3 className="engage__name">{s.name}</h3>
                  <p className="engage__text">{s.text}</p>
                </div>
                <p className="engage__out"><span className="label">you get</span>{s.output}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="faq" className="section section--faq" aria-labelledby="faq-title">
        <div className="faq">
          <h2 id="faq-title" className="h2" data-split="lines">{faq.heading}</h2>
          <div className="faq__list">
            {faq.items.map((f) => (
              <details key={f.q} className="faq__item">
                <summary>
                  <span>{f.q}</span>
                  <span className="faq__icon" aria-hidden="true" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, '\\u003c') }} />
      </section>

      <section id="contact" className="cta" aria-labelledby="cta-title">
        <div className="cta__intro">
          <h2 id="cta-title" className="cta__title" data-split="lines">{finalCta.heading}</h2>
          <p className="cta__copy">{finalCta.copy}</p>
        </div>
        <div className="cta__side">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
