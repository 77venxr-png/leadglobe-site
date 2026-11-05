// All visible copy for leadglobe lives here. Edit this file to change the site's words.
//
// Assumptions (placeholders the owner must replace or confirm):
// - site.url and site.email: no domain or contact address was supplied.
// - site.legal: no legal pages were supplied, so the footer shows none until links are added.
// - No clients, testimonials, metrics, partners or certifications are shown anywhere (none supplied).
// - Records inside the workflow illustrations (company names, people, numbers) are fictional
//   examples and are labelled as illustrative on the page.

export type ServiceSlug = 'gtm-services' | 'account-based-marketing' | 'paid-media' | 'content-engineering' | 'revops';

export type Service = {
  slug: ServiceSlug;
  tab: string; // tab label (lowercase, matches the wordmark)
  label: string; // small mono label above the headline
  headline: string;
  description: string;
  capabilities: { name: string; detail: string }[];
  // Service page only
  intro: string;
  deliverables: string[];
  fit: string[];
  // Search snippet: <title> (before the "| leadglobe" template) and meta description
  seo: { title: string; description: string };
};

export const site = {
  name: 'leadglobe',
  legalName: 'LeadGlobe',
  role: 'GTM services and systems',
  url: 'https://leadglobe.co', // PLACEHOLDER: production URL (canonical, OG, sitemap)
  email: 'hello@leadglobe.co', // PLACEHOLDER: contact address
  description:
    'leadglobe builds and runs the systems, campaigns and workflows behind go-to-market: outbound, account-based marketing, paid media, content and RevOps.',
  // Home page <title> (used as-is, no template) and default meta description
  seo: {
    title: 'leadglobe | AI-native GTM agency for outbound, ABM & RevOps',
    description:
      'AI-native GTM agency. We set your go-to-market strategy, then run outbound, ABM, paid media, content and RevOps as one connected system.',
  },
  cta: {
    primary: 'discuss your gtm needs',
    secondary: 'explore services',
    subject: 'GTM operations: where can leadglobe help?',
  },
  // PLACEHOLDER: where the contact form posts (e.g. a Formspree, Basin or CRM form URL that accepts
  // a JSON POST). Left empty, the form opens a pre-filled email to site.email instead.
  formEndpoint: '',
  legal: [] as { label: string; href: string }[], // e.g. [{ label: 'privacy', href: '/privacy/' }]
  socials: [] as { label: string; href: string }[], // e.g. [{ label: 'linkedin', href: 'https://www.linkedin.com/company/…' }]
};

/** Every primary CTA leads to the contact form at the end of the home page. */
export const contactHref = '/#contact';
export const mailHref = `mailto:${site.email}?subject=${encodeURIComponent(site.cta.subject)}`;

export const nav = [
  { label: 'services', href: '/#services' },
  { label: 'how it works', href: '/#console' },
  { label: 'about', href: '/#about' },
];

export const hero = {
  eyebrow: 'ai-native gtm agency',
  headline: 'strategy + connected execution to fix your pipeline leakage',
  copy:
    'We set your go-to-market strategy, then run outbound, ABM, paid media, content and RevOps as one connected system, so qualified buyers stop slipping through the gaps between teams and tools.',
  // The connected revenue engine under the hero. Scroll (desktop) or a timer (phones) moves the
  // focus through four chapters; the engine itself runs continuously. Labels stay lowercase.
  visual: {
    title: 'strategy + connected execution closes the gaps.',
    chapters: [
      'strategy creates direction.',
      'connected execution creates pipeline.',
      'revenue is the outcome.',
      'revops connects every stage, and every outcome sharpens the next decision.',
    ],
    status: { before: 'before: five vendors, no shared system', after: 'now: one connected gtm system' },
    layers: ['gtm intelligence', 'connected execution', 'sales pipeline', 'revops'],
    intel: ['icp & market segmentation', 'target account selection', 'buying signals & intent', 'contact enrichment'],
    revops: ['crm & data integrity', 'attribution & measurement', 'pipeline analytics', 'conversion optimization'],
    feedback: 'feedback loop',
    intake: 'engagement signals',
    lost: 'closed lost',
  },
};

// The console: one shift of work in the run log, between the engine and services. Named agents
// post rows; anything that represents the client's brand waits at an approval gate.
// OWNER TO CONFIRM: the operating model (agents research, watch signals, draft and route; a person
// approves anything brand-facing) and that the client ("your team") is the approver.
// Records are fictional and reused from the workflow illustrations (flow/workflows.tsx).
export type RunStatus = 'running' | 'done' | 'drafted' | 'waiting' | 'approved';
export type RunRow = {
  agent: 'research' | 'signal' | 'writing' | 'routing';
  service: ServiceSlug;
  task: string;
  result: string;
  needsApproval: boolean;
  /** The row's resting state: what reduced motion, no-JS and the end of the loop show. */
  status: RunStatus;
};

export const consoleSection = {
  label: 'the run log',
  heading: 'ai does the work. people make the calls.',
  copy:
    'Named agents research accounts, watch for signals, draft copy and route records, and every step is posted here. Nothing that represents your brand goes out until a person approves it.',
  points: [
    { name: 'agents do the work', text: 'Named agents handle research, signals, first drafts and routing.' },
    { name: 'people approve', text: 'Anything that represents your brand waits for a person to approve it.' },
    { name: 'everything is logged', text: 'Every step is recorded, so you can see what ran and why.' },
  ],
  agents: [
    { id: 'research', name: 'research agent', role: 'accounts, buyers and context' },
    { id: 'signal', name: 'signal agent', role: 'watches for buying signals' },
    { id: 'writing', name: 'writing agent', role: 'drafts copy for review' },
    { id: 'routing', name: 'routing agent', role: 'records, owners and handoffs' },
  ],
  // Short service names for the log's service column.
  serviceShort: {
    'gtm-services': 'gtm services',
    'account-based-marketing': 'abm',
    'paid-media': 'paid media',
    'content-engineering': 'content',
    revops: 'revops',
  } satisfies Record<ServiceSlug, string>,
  rows: [
    { agent: 'research', service: 'gtm-services', task: 'Research Northwind Freight and its sales leadership', result: 'Account record researched', needsApproval: false, status: 'done' },
    { agent: 'signal', service: 'gtm-services', task: 'Flag Northwind Freight hiring three sales roles', result: 'Signal routed to outbound', needsApproval: false, status: 'done' },
    { agent: 'writing', service: 'gtm-services', task: 'Draft step 1 email to Dana Reyes', result: 'Draft ready for review', needsApproval: true, status: 'waiting' },
    { agent: 'research', service: 'account-based-marketing', task: 'Map the buying group at Halcyon Labs', result: '4 buyers identified', needsApproval: false, status: 'done' },
    { agent: 'routing', service: 'account-based-marketing', task: 'Send Halcyon Labs pricing visits to the AE', result: 'AE assigned', needsApproval: false, status: 'done' },
    { agent: 'writing', service: 'paid-media', task: 'Write headline B for the ops leaders campaign', result: 'Variant launched after review', needsApproval: true, status: 'approved' },
    { agent: 'writing', service: 'content-engineering', task: 'Turn the founder interview into a LinkedIn post', result: 'Post drafted in founder voice', needsApproval: true, status: 'drafted' },
    { agent: 'routing', service: 'revops', task: 'Merge three Jordan Ortiz records into one', result: 'Matching, owner next', needsApproval: false, status: 'running' },
  ] satisfies RunRow[],
  panel: { title: 'run log', row: 'row', rows: 'rows' },
  approval: { waiting: 'needs approval', approved: 'approved', by: 'your team', byPrefix: 'by', action: 'approve' },
  caption: 'illustrative run log. sample records are fictional.',
  statusLabels: {
    running: 'running',
    done: 'done',
    drafted: 'drafted',
    waiting: 'needs approval',
    approved: 'approved',
  } satisfies Record<RunStatus, string>,
};

export const servicesIntro = {
  heading: 'services',
  copy: 'Five service lines, each made of capabilities you can scope on their own. Pick a line to see the workflow we run.',
};

export const services: Service[] = [
  {
    slug: 'gtm-services',
    tab: 'gtm services',
    seo: {
      title: 'Outbound GTM agency: research to sales handoff',
      description:
        'Outbound run as one process: account targeting, buyer research, signal tracking, deliverable sending and a clean handoff to your sales team.',
    },
    label: '01 / gtm services',
    headline: 'from target accounts to sales conversations',
    description: 'We research prospects, run outbound campaigns, and manage follow-ups and sales handoffs.',
    capabilities: [
      { name: 'Account targeting', detail: 'Build and maintain the list of companies worth pursuing, with the criteria written down so it can be reviewed and changed.' },
      { name: 'Buyer research', detail: 'Identify the people involved in a decision at each account and what is relevant to them right now.' },
      { name: 'Signal tracking', detail: 'Watch for events such as hiring, funding, launches or site visits, and route them to the right next step.' },
      { name: 'Outbound infrastructure', detail: 'Set up domains, mailboxes, sending limits and sequencing tools so outreach is deliverable and accountable.' },
      { name: 'Campaign execution', detail: 'Write, review, send and iterate multi-step campaigns across email and LinkedIn.' },
      { name: 'Sales handoff', detail: 'Pass interested replies to your team with the research, context and conversation history attached.' },
    ],
    intro:
      'Outbound and account research run as one connected process: who to contact, why now, what to say, and what happens when someone replies.',
    deliverables: [
      'A documented targeting definition and a maintained account list',
      'Researched contact records with the reason for outreach',
      'Configured sending infrastructure and sequencing',
      'Campaign copy with a review and approval step before anything sends',
      'A handoff process your sales team agrees to',
    ],
    fit: [
      'You want consistent outbound without building the team and tooling in house.',
      'Your team has the market knowledge but not the hours to research and send.',
      'Replies are slipping through the gap between marketing and sales.',
    ],
  },
  {
    slug: 'account-based-marketing',
    tab: 'account-based marketing',
    seo: {
      title: 'Account-based marketing (ABM) agency',
      description:
        'ABM run end to end: tiered account lists agreed with sales, buyer maps, coordinated ads, email and sales touches, and account-level reporting.',
    },
    label: '02 / account-based marketing',
    headline: 'turn target accounts into pipeline.',
    description: 'We coordinate account research, targeted campaigns, and sales engagement.',
    capabilities: [
      { name: 'Account selection', detail: 'Agree with sales on which accounts to focus on, and in which tier.' },
      { name: 'Buyer mapping', detail: 'Map the decision makers, influencers and users at each account.' },
      { name: 'Account research', detail: 'Collect the context that makes outreach relevant: priorities, changes, tools, timing.' },
      { name: 'Coordinated campaigns', detail: 'Run ads, email, content and sales touches against the same accounts in a planned order.' },
      { name: 'Engagement tracking', detail: 'Record account-level activity so everyone can see who is engaging and how.' },
      { name: 'Pipeline reporting', detail: 'Report on which targeted accounts progressed, and what happened along the way.' },
    ],
    intro:
      'Account-based marketing works when marketing and sales act on the same list, at the same time, with the same information. We run the coordination.',
    deliverables: [
      'A tiered account list agreed with sales',
      'Buyer maps for priority accounts',
      'A campaign plan that sequences channels per tier',
      'Account-level engagement views in your CRM',
      'Regular reporting on account progress',
    ],
    fit: [
      'You sell to a defined set of larger accounts with several people in each decision.',
      'Marketing and sales are working different lists.',
      'Campaigns run, but nobody can say what happened at a specific account.',
    ],
  },
  {
    slug: 'paid-media',
    tab: 'paid media',
    seo: {
      title: 'Paid media agency: LinkedIn and search ads',
      description:
        'LinkedIn and search campaigns with conversion tracking connected to your CRM, so spend, conversions and pipeline are reported in one place.',
    },
    label: '03 / paid media',
    headline: 'make your ad spend accountable.',
    description: 'We run and optimize paid campaigns, connecting spend to conversions and pipeline reporting.',
    capabilities: [
      { name: 'LinkedIn Ads', detail: 'Campaigns built on company, role and audience targeting, with lead forms or site traffic.' },
      { name: 'Search advertising', detail: 'Search campaigns built around the terms buyers use when they are actively looking.' },
      { name: 'Creative testing', detail: 'Structured tests of messages and formats, with a record of what was tested and learned.' },
      { name: 'Audience strategy', detail: 'Define, build and refresh the audiences each campaign reaches.' },
      { name: 'Conversion tracking', detail: 'Set up tracking so form fills and booked meetings can be traced back to the campaign.' },
      { name: 'Performance reporting', detail: 'Report spend, conversions and pipeline from paid channels in one place.' },
    ],
    intro:
      'Paid media is only useful when you can see what it produced. We plan and run the campaigns and set up the measurement that connects spend to outcomes.',
    deliverables: [
      'A channel and audience plan with budget allocation',
      'Campaign builds and launch',
      'A creative testing plan and test log',
      'Conversion tracking connected to your CRM',
      'Recurring performance reports',
    ],
    fit: [
      'You are spending on ads but cannot trace results past the click.',
      'You want to start paid acquisition with tracking in place from day one.',
      'Creative is changed on instinct rather than tested.',
    ],
  },
  {
    slug: 'content-engineering',
    tab: 'content engineering',
    seo: {
      title: 'Content engineering: founder and expert content',
      description:
        'We interview founders and experts and turn what they know into posts, articles and reusable sales assets, published on a regular schedule.',
    },
    label: '04 / content engineering',
    headline: 'turn expertise into content that works.',
    description: 'We turn ideas and conversations into content your team can publish, distribute, and reuse.',
    capabilities: [
      { name: 'Founder content', detail: 'Interview founders and turn what they know into posts, articles and talks in their own voice.' },
      { name: 'Team content', detail: 'Do the same for subject experts across the business.' },
      { name: 'Content repurposing', detail: 'Turn one source, such as an interview or webinar, into several formats.' },
      { name: 'Search discovery', detail: 'Structure articles and pages so the people searching for a topic can find them.' },
      { name: 'Content distribution', detail: 'Publish and share on the channels where your audience reads, including sales outreach.' },
      { name: 'Design and publishing', detail: 'Design, format and publish content so it ships on schedule.' },
    ],
    intro:
      'Most expertise never leaves a meeting room. We run the process that captures it, shapes it and gets it in front of the right audience on a regular schedule.',
    deliverables: [
      'A content plan built from interviews with your team',
      'Drafted, reviewed and designed content',
      'A publishing calendar and distribution plan',
      'Reusable assets your sales team can share',
    ],
    fit: [
      'Your founders and experts know the market but do not have time to write.',
      'Content is published in bursts, then stops.',
      'Sales has nothing current to send prospects.',
    ],
  },
  {
    slug: 'revops',
    tab: 'revops',
    seo: {
      title: 'RevOps agency: CRM, routing and attribution',
      description:
        'RevOps for CRMs nobody trusts: deduplicated records, lead routing, attribution, documented automations and reports your team actually uses.',
    },
    label: '05 / revops',
    headline: 'make your revenue systems work together.',
    description: 'We connect CRM data, routing, reporting, and automation into reliable workflows.',
    capabilities: [
      { name: 'CRM data quality', detail: 'Deduplicate, standardize and enrich records, and set rules that keep them clean.' },
      { name: 'Lead routing', detail: 'Assign new leads and accounts to the right owner, quickly and predictably.' },
      { name: 'Attribution', detail: 'Record where leads and opportunities came from, in a way the team agrees on.' },
      { name: 'Account and pipeline management', detail: 'Define stages, fields and ownership so pipeline reflects reality.' },
      { name: 'Workflow automation', detail: 'Automate the repetitive steps between tools, with clear owners for exceptions.' },
      { name: 'Reporting and analytics', detail: 'Build the reports and dashboards your team actually uses to make decisions.' },
    ],
    intro:
      'Every GTM activity ends up as data in a system. When that data is inconsistent, nobody trusts the reports. We fix the system underneath.',
    deliverables: [
      'An audit of current CRM data and processes',
      'Cleaned and standardized records with matching rules',
      'Routing and ownership rules',
      'Documented automations',
      'Reports and dashboards agreed with the people who use them',
    ],
    fit: [
      'Your CRM has duplicates and nobody trusts the numbers.',
      'Leads wait too long, or go to the wrong person.',
      'Marketing and sales report different numbers for the same thing.',
    ],
  },
];

export const principles = {
  heading: 'how we work',
  items: [
    { name: 'Execution over advice', text: 'We do the work, not just recommend it.' },
    { name: 'Reliable by design', text: 'Clear ownership, validation, and documentation.' },
    { name: 'Visible at every step', text: 'Know what is running and what it produces.' },
    { name: 'Measured against outcomes', text: 'Agree on success measures before work begins.' },
  ],
};

export const engagement = {
  heading: 'working together',
  intro: 'Start with one service or a single capability. Every engagement is scoped to what you need now.',
  stages: [
    { name: 'Scope', text: 'Agree on the work, deliverables, and measures of success.', output: 'A written scope with owners and success measures.' },
    { name: 'Launch', text: 'Configure, test, and deploy the agreed systems or campaigns.', output: 'Live campaigns or systems, tested and signed off.' },
    { name: 'Improve', text: 'Review results and optimize ongoing execution.', output: 'Regular reports and a log of what changed.' },
  ],
};

export const faq = {
  heading: 'questions',
  items: [
    {
      q: 'Which services does leadglobe offer?',
      a: 'Five areas: GTM services (outbound, research, signals and sales handoff), account-based marketing, paid media, content engineering and RevOps. Each area is a set of capabilities that can be scoped individually.',
    },
    // OWNER TO CONFIRM: same operating-model claim as consoleSection.
    {
      q: 'How does leadglobe use AI?',
      a: 'Named AI agents do the groundwork: account and buyer research, watching for buying signals, first drafts and CRM routing. People set the strategy and make the calls, and anything that represents your brand is approved by your team before it goes out.',
    },
    {
      q: 'Do we have to buy all five services?',
      a: 'No. Most engagements start with one area or a few capabilities within it. We scope the work to what you need and add to it only if it makes sense.',
    },
    {
      q: 'What does onboarding look like?',
      a: 'After discovery and scoping, we request access to the relevant tools, document the workflows we will run and test them on a small batch. Nothing runs at volume until your team has reviewed it.',
    },
    {
      q: 'Which tools do you work with?',
      a: 'We work inside the tools you already use where possible, such as your CRM, ad accounts and sequencing tools. We confirm the stack, access and permissions during discovery, and recommend changes only when there is a clear reason.',
    },
    {
      q: 'How do you measure results?',
      a: 'We agree on the measures before the work starts, for example meetings booked, qualified pipeline or data accuracy, and report against them on a regular schedule.',
    },
    {
      q: 'How do we collaborate day to day?',
      a: 'You get a named point of contact, a shared channel for questions and approvals, and regular review calls. Anything that represents your brand goes through an approval step first.',
    },
  ],
};

export const finalCta = {
  heading: 'let’s put your gtm plans into action.',
  copy: 'Tell us what you need to build or improve. We’ll discuss the right scope of work.',
};

export const about = {
  label: 'about leadglobe',
  heading: 'execution over advice.',
  text: 'We build and run the campaigns, systems, and workflows behind go-to-market execution.',
};
