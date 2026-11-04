import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/Button';
import { Orbit } from '@/components/Orbit';
import { Workflow } from '@/components/flow/workflows';
import { contactHref, services, site } from '@/data/site';

export const dynamicParams = false;
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<'/services/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const s = services.find((x) => x.slug === slug);
  if (!s) return {};
  const title = s.tab.replace(/^gtm/, 'GTM').replace(/^revops$/, 'RevOps').replace(/^\w/, (c) => c.toUpperCase());
  return {
    title,
    description: s.intro,
    openGraph: { type: 'website', siteName: site.name, title: `${title} | ${site.name}`, description: s.intro, images: ['/og.png'] },
  };
}

export default async function ServicePage({ params }: PageProps<'/services/[slug]'>) {
  const { slug } = await params;
  const i = services.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const s = services[i];
  const next = services[(i + 1) % services.length];

  return (
    <article className="svc-page">
      <header className="svc-page__hero">
        <div className="svc-page__copy">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link className="draw" href="/#services">services</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{s.tab}</span>
          </nav>
          <p className="label" data-reveal="fade" data-intro>{s.label}</p>
          <h1 className="svc-page__title" data-split="lines" data-intro>{s.headline}</h1>
          <p className="svc-page__intro">{s.intro}</p>
          <div className="hero__actions" data-reveal="up" data-intro data-delay="0.3">
            <Button href={contactHref} arrow>{site.cta.primary}</Button>
          </div>
        </div>
        <nav className="svc-page__orbit" aria-label="Services">
          <Orbit current={s.slug} />
        </nav>
      </header>

      <section className="svc-page__flow" aria-label={`${s.tab} workflow`}>
        <Workflow slug={s.slug} />
      </section>

      <section className="svc-page__caps" aria-labelledby="caps-title">
        <h2 id="caps-title" className="h2" data-split="lines">what we run.</h2>
        <ol className="cap-list">
          {s.capabilities.map((c, k) => (
            <li key={c.name} data-reveal="up">
              <span className="cap-list__n" aria-hidden="true">0{k + 1}</span>
              <h3 className="cap-list__name">{c.name}</h3>
              <p className="cap-list__detail">{c.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="svc-page__split">
        <div>
          <h2 className="h3">what you get</h2>
          <ul className="ticks">
            {s.deliverables.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </div>
        <div>
          <h2 className="h3">a good fit when</h2>
          <ul className="ticks">
            {s.fit.map((d) => <li key={d}>{d}</li>)}
          </ul>
          <p className="svc-page__note">
            Any of these capabilities can be scoped on its own, or combined with other service lines. See{' '}
            <Link className="i-link" href="/#engagement">how engagements work</Link>.
          </p>
        </div>
      </section>

      <nav className="next" aria-label="Next service">
        <Link href={`/services/${next.slug}/`} className="next__link">
          <span className="label">next service</span>
          <span className="next__title">{next.tab}</span>
          <span className="next__arrow" aria-hidden="true">→</span>
        </Link>
      </nav>
    </article>
  );
}
