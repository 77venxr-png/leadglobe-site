'use client';
// The five service workflows. Every company, person and number here is a fictional example,
// labelled as such on the page.
import type { ServiceSlug } from '@/data/site';
import { Flow, Node } from './Flow';
import { Avatar, Badge, Card, Check, Chip, Row, Status } from './parts';

const caption = 'illustrative workflow. sample records are fictional.';

const gtmEdges: [string, string][] = [['account', 'record'], ['signal', 'record'], ['record', 'message'], ['message', 'review'], ['review', 'handoff']];
function GtmFlow({ active }: { active: boolean }) {
  return (
    <Flow
      label={caption}
      active={active}
      edges={gtmEdges}
      result="handoff"
      cols="0.8fr 1.2fr 1fr"
      areas={`"account record handoff" "signal message handoff" ". review handoff"`}
      colsMobile="1fr 1fr"
      areasMobile={`"account signal" "record record" "message message" "review review" "handoff handoff"`}
    >
      <Node id="account"><Chip label="new account" detail="Northwind Freight" /></Node>
      <Node id="signal"><Chip label="buying signal" detail="Hiring 3 sales roles" /></Node>
      <Node id="record">
        <Card label="account record" badge={<Badge tone="pink">researched</Badge>} title="Northwind Freight" sub="Freight logistics, 240 employees">
          <Row k="signal" v="Sales team expanding" />
          <Row k="contact" v={<><Avatar initials="DR" /> Dana Reyes, VP Sales</>} />
        </Card>
      </Node>
      <Node id="message">
        <Card label="outreach / step 1" badge={<Badge>email</Badge>}>
          <p className="mail__subject">Onboarding three new reps</p>
          <p className="mail__body">Dana, saw Northwind is hiring three sales roles. Ramping new reps usually means…</p>
        </Card>
      </Node>
      <Node id="review">
        <Card label="review" badge={<Status pending="in review" done="approved" />}>
          <ul className="checks">
            <li><Check /> Personalization checked</li>
            <li><Check /> Claims verified</li>
          </ul>
          <Row k="approver" v={<><Avatar initials="AP" /> A. Patel</>} />
        </Card>
      </Node>
      <Node id="handoff" className="is-result">
        <Card dark label="sales handoff" badge={<Status pending="waiting" done="handed off" />} title="Reply: interested">
          <Row k="owner" v="Sam K., AE" />
          <Row k="next" v="Book intro call" />
          <Row k="context" v="Research + thread attached" />
        </Card>
      </Node>
    </Flow>
  );
}

const abmEdges: [string, string][] = [['company', 'account'], ['contacts', 'account'], ['engagement', 'account'], ['account', 'crm']];
function AbmFlow({ active }: { active: boolean }) {
  return (
    <Flow
      label={caption}
      active={active}
      edges={abmEdges}
      result="crm"
      cols="0.82fr 1.3fr 1fr"
      areas={`"company account crm" "contacts account crm" "engagement account crm"`}
      areasMobile={`"company" "contacts" "engagement" "account" "crm"`}
    >
      <Node id="company"><Chip label="company data" detail="Halcyon Labs, 900 staff" /></Node>
      <Node id="contacts"><Chip label="mapped contacts" detail="4 buyers identified" /></Node>
      <Node id="engagement"><Chip label="engagement" detail="Pricing page, 3 visits" /></Node>
      <Node id="account">
        <Card label="account" badge={<Badge tone="ink">tier 1</Badge>} title="Halcyon Labs">
          <div className="buyers">
            <span className="buyers__k">buyer map</span>
            <span className="buyer"><Avatar initials="MO" /> Champion</span>
            <span className="buyer"><Avatar initials="TL" /> Economic buyer</span>
            <span className="buyer"><Avatar initials="RS" /> Daily user</span>
          </div>
          <div className="channels">
            <span className="buyers__k">campaign</span>
            <span className="channel is-on">ads</span>
            <span className="channel is-on">email</span>
            <span className="channel is-on">content</span>
          </div>
          <Row k="next action" v="AE calls champion Thu" tone="pink" />
        </Card>
      </Node>
      <Node id="crm" className="is-result">
        <Card dark label="crm / account" badge={<Status pending="syncing" done="synced" />} title="Halcyon Labs">
          <div className="bars" aria-hidden="true">
            {[28, 40, 34, 62, 78, 70].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}
          </div>
          <Row k="engaged" v="4 of 6 contacts" />
          <Row k="handoff" v="AE assigned" />
        </Card>
      </Node>
    </Flow>
  );
}

const paidEdges: [string, string][] = [['audience', 'campaign'], ['search', 'campaign'], ['campaign', 'conversion']];
function PaidFlow({ active }: { active: boolean }) {
  return (
    <Flow
      label={caption}
      active={active}
      edges={paidEdges}
      result="conversion"
      cols="0.85fr 1.25fr 1fr"
      areas={`"audience campaign conversion" "search campaign conversion"`}
      colsMobile="1fr 1fr"
      areasMobile={`"audience search" "campaign campaign" "conversion conversion"`}
    >
      <Node id="audience"><Chip label="audience signal" detail="Ops leaders, 50 to 500 staff" /></Node>
      <Node id="search"><Chip label="search intent" detail={'"lead routing software"'} /></Node>
      <Node id="campaign">
        <Card label="linkedin campaign" badge={<Badge tone="pink">variant b</Badge>}>
          <div className="ad">
            <div className="ad__brand"><Avatar initials="M" /> <span>Meridian Supply<small>Promoted</small></span></div>
            <p className="ad__copy">Leads routed to the right rep in minutes. See how ops teams set it up.</p>
            <div className="ad__media" aria-hidden="true"><span /><span /><span /></div>
            <div className="ad__foot"><span className="ad__cta">Book a demo</span></div>
          </div>
          <Row k="test" v="Headline B vs A" />
        </Card>
      </Node>
      <Node id="conversion" className="is-result">
        <Card dark label="crm / conversion" badge={<Status pending="tracking" done="demo booked" />} title="Ivy Chen, Meridian Supply">
          <Row k="source" v="LinkedIn Ads" />
          <Row k="first touch" v="Search, 6 days earlier" />
        </Card>
      </Node>
    </Flow>
  );
}

const contentEdges: [string, string][] = [['interview', 'post'], ['notes', 'post'], ['post', 'distribution']];
function ContentFlow({ active }: { active: boolean }) {
  return (
    <Flow
      label={caption}
      active={active}
      edges={contentEdges}
      result="distribution"
      cols="0.85fr 1.25fr 1fr"
      areas={`"interview post distribution" "notes post distribution"`}
      colsMobile="1fr 1fr"
      areasMobile={`"interview notes" "post post" "distribution distribution"`}
    >
      <Node id="interview"><Chip label="founder interview" detail="42 min recording" /></Node>
      <Node id="notes"><Chip label="team notes" detail="Support tickets, Q3" /></Node>
      <Node id="post">
        <Card label="linkedin post" badge={<Status pending="drafting" done="approved" />}>
          <div className="post">
            <div className="ad__brand"><Avatar initials="LO" /> <span>Lena Ortiz<small>Founder, Fernbrook</small></span></div>
            <p className="post__copy">We used to answer the same onboarding question forty times a month. Here is the guide that replaced it.</p>
          </div>
          <Row k="reused as" v="Article, 3 posts, email" />
        </Card>
      </Node>
      <Node id="distribution" className="is-result">
        <Card dark label="distribution" badge={<Status pending="scheduled" done="published" />} title="Onboarding guide">
          <Row k="search" v="Article published" />
          <Row k="linkedin" v="Founder post, Tue 9:00" />
          <Row k="sales" v="Added to follow-up library" />
        </Card>
      </Node>
    </Flow>
  );
}

const revopsEdges: [string, string][] = [['form', 'unified'], ['event', 'unified'], ['import', 'unified'], ['unified', 'clean']];
function RevopsFlow({ active }: { active: boolean }) {
  return (
    <Flow
      label={caption}
      active={active}
      edges={revopsEdges}
      result="clean"
      cols="0.9fr 1.25fr 1fr"
      areas={`"form unified clean" "event unified clean" "import unified clean"`}
      areasMobile={`"form" "event" "import" "unified" "clean"`}
    >
      <Node id="form"><Chip label="web form" detail="j.ortiz, no company" /></Node>
      <Node id="event"><Chip label="event list" detail="Jordan Ortiz, BRIGHTWELL" /></Node>
      <Node id="import"><Chip label="sales import" detail="J. Ortiz, Brightwell Robotics" /></Node>
      <Node id="unified">
        <Card label="unified record" badge={<Badge tone="pink">3 → 1</Badge>} title="Jordan Ortiz" sub="Brightwell Robotics">
          <Row k="matching" v={<><Check /> Email + domain match</>} />
          <Row k="enrichment" v="Title, company size added" />
          <Row k="ownership" v="West territory rule" />
        </Card>
      </Node>
      <Node id="clean" className="is-result">
        <Card dark label="crm / contact" badge={<Status pending="routing" done="assigned" />} title="Clean record">
          <Row k="owner" v="R. Shah" />
          <Row k="next" v="Follow up in 1 business day" />
          <Row k="duplicates" v="0 remaining" />
        </Card>
      </Node>
    </Flow>
  );
}

const flows: Record<ServiceSlug, (p: { active: boolean }) => React.JSX.Element> = {
  'gtm-services': GtmFlow,
  'account-based-marketing': AbmFlow,
  'paid-media': PaidFlow,
  'content-engineering': ContentFlow,
  revops: RevopsFlow,
};

export function Workflow({ slug, active = true }: { slug: ServiceSlug; active?: boolean }) {
  const F = flows[slug];
  return <F active={active} />;
}
