import Link from 'next/link'

const experience = [
  {
    title: 'Team Lead',
    company: 'IBM',
    period: 'Nov 2022 – Apr 2025',
    points: [
      'Transformed an internal framework into a Managed SaaS subscription product used by 5 SOX-compliant enterprise clients.',
      'Automated provisioning and scaling with Kubernetes operators in Go, achieving a 75% reduction in setup and management time.',
      'Mentored 8 interns and graduate hires; guided the team through developing a cloud-native product meeting critical quality benchmarks.',
      "Led development of two AI applications: a document embedding pipeline on Milvus and an AI chat app — cutting clients' barrier to AI workflows by 50%.",
    ],
  },
  {
    title: 'Senior Engineer',
    company: 'IBM',
    period: 'Nov 2021 – Oct 2022',
    points: [
      'Engineered a Hybrid-Cloud application framework that delivered an 80% reduction in app development lifecycle for teams.',
      'Crafted reusable modules and step executors in Scala/Spark, enabling scalability and rapid integration of new features.',
      'Implemented Agile practices including TDD and automated CI/CD pipelines, driving a 30% reduction in errors and 15% faster delivery.',
      'Elevated software development standards across a sub-domain of 300+ developers by promoting SOLID principles and Design Patterns.',
    ],
  },
  {
    title: 'Software Engineer',
    company: 'IBM',
    period: 'Jul 2019 – Oct 2021',
    points: [
      'Migrated legacy enterprise JCL applications from Mainframe to Cloud using event-driven architecture, improving system scalability.',
      "Delivered significant cost savings and revenue generation by migrating IBM's sales budget distribution system from Mainframe to Cloud — reducing completion time from 4 days to under 10 hours.",
    ],
  },
]

const skills = [
  { category: 'Languages',  items: 'Go, Scala, JavaScript / TypeScript, SQL' },
  { category: 'Frameworks', items: 'gRPC, REST, Django, React, Vue.js' },
  { category: 'Cloud & Infra', items: 'Azure (AKS, Cosmos), AWS (EC2, EKS), Terraform, Redis, Docker' },
  { category: 'Databases',  items: 'MySQL, MongoDB, DB2' },
  { category: 'CI/CD',      items: 'Tekton, Jenkins, Codefresh, Docker' },
  { category: 'Domains',    items: 'Distributed Systems, Microservices, Event-Driven Architecture, API Design' },
]

const timeline = [
  { period: '2019 – 2021', title: 'SDE I',    milestone: 'Migrated legacy applications to cloud' },
  { period: '2021 – 2022', title: 'SDE II',           milestone: 'Data engineering application on cloud' },
  { period: '2022 – 2025', title: 'Senior Engineer',  milestone: 'SaaS product used by enterprise clients' }
]

const projects = [
  {
    title: 'AI-Powered Auction Bidder',
    description: 'AI agents using Google Gemini API that participate in an auction and buy teams based on stats, home condition requirements and various other factors.',
    tags: ['python', 'gemini', 'ai'] as string[],
    tagVariant: 'green' as const,
  }
]

export default function Home() {
  return (
    <>
      {/* ══════════════════════════════════════════════
          HERO — Option B: editorial masthead split
      ══════════════════════════════════════════════ */}

      {/* Top band: line grid + radial glow, name dominant */}
      <section className="relative page-header-bg overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-bg" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 md:py-32">
          <div className="mb-5 h-0.5 w-10 bg-accent animate-fade-up delay-0" />
          <h1
            className="font-display font-black leading-none tracking-tight text-text-bright animate-fade-up delay-100"
            style={{ fontSize: 'clamp(3.5rem, 9vw, 7rem)' }}
          >
            Aaditya
            <br />
            Menon
          </h1>
          <p className="mt-6 font-mono text-sm tracking-widest text-text-muted uppercase animate-fade-up delay-200">
            Senior Engineer &amp; Technical Lead
          </p>
          <div className="mt-8 flex flex-wrap gap-3 animate-fade-up delay-500">
            <a href="https://github.com/Sparker0i" target="_blank" rel="noopener noreferrer" className="tag tag-green">github</a>
            <a href="https://linkedin.com/in/Sparker0i" target="_blank" rel="noopener noreferrer" className="tag tag-muted">linkedin</a>
            <Link href="/blog" className="tag tag-muted">blog</Link>
            <a href="mailto:aaditya@sparker0i.me" className="tag tag-amber">email</a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          ABOUT
      ══════════════════════════════════════════════ */}
      <section id="about" className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p className="font-mono text-sm uppercase tracking-widest text-text-muted mb-3">about</p>
          <p className="font-body text-lg leading-relaxed text-text">
            Senior Engineer and Technical Lead with 7 years of experience
            designing distributed systems and platform infrastructure at scale.
            Built a Data Engineering SaaS with multiple integrations processing
            8+ TBs of data per day. Progressed from Junior Engineer to Team
            Lead, mentoring multiple engineers to Senior-level promotions.
          </p>
          <p className="mt-4 font-body text-lg leading-relaxed text-text">
            I'm drawn to the hard problems in platform engineering — the ones
            that sit at the intersection of system design, operational
            reliability, and team velocity. Lately I've been experimenting with
            LLM-powered tooling and AI-native workflows, both as engineering
            problems and as leverage for the teams I work with.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          EXPERIENCE
      ══════════════════════════════════════════════ */}
      <section id="experience" className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="section-heading font-display text-2xl font-bold text-text-bright">
            Experience
          </h2>
          <div className="mt-8 space-y-6">
            {experience.map((role) => (
              <article key={role.period} className="border border-border bg-surface rounded p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="font-nav text-xl font-bold text-text-bright">{role.title}</span>
                    <span className="ml-2 font-mono text-sm text-text-muted">@ {role.company}</span>
                  </div>
                  <span className="font-mono text-xs text-text-muted">{role.period}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {role.points.map((point, i) => (
                    <li key={i} className="flex gap-3 font-body text-sm leading-relaxed text-text">
                      <span className="mt-1 shrink-0 text-accent font-mono">›</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SKILLS
      ══════════════════════════════════════════════ */}
      <section id="skills" className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="section-heading font-display text-2xl font-bold text-text-bright">
            Skills
          </h2>
          <div className="mt-8 overflow-hidden rounded border border-border">
            <table className="w-full text-sm">
              <tbody>
                {skills.map((row, i) => (
                  <tr key={row.category} className={i % 2 === 0 ? 'bg-surface' : 'bg-surface-elevated'}>
                    <td className="w-36 px-5 py-3 font-mono text-xs uppercase tracking-wider text-text-muted border-r border-border whitespace-nowrap">
                      {row.category}
                    </td>
                    <td className="px-5 py-3 font-body text-sm text-text">{row.items}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SELECTED WORK
      ══════════════════════════════════════════════ */}
      <section id="projects" className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="section-heading font-display text-2xl font-bold text-text-bright">
            Projects
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.title} {...p} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TIMELINE
      ══════════════════════════════════════════════ */}
      <section id="timeline" className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="section-heading font-display text-2xl font-bold text-text-bright">
            Timeline
          </h2>
          <div className="mt-8">
            {timeline.map((item) => (
              <div key={item.period} className="flex gap-6 border-b border-border py-5 last:border-b-0">
                <div className="w-28 shrink-0 font-mono text-xs text-text-muted pt-0.5">
                  {item.period}
                </div>
                <div>
                  <p className="font-mono text-sm font-medium text-text-bright">{item.title}</p>
                  <p className="mt-1 font-body text-sm text-text-muted leading-relaxed">{item.milestone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          EDUCATION
      ══════════════════════════════════════════════ */}
      <section id="education" className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="section-heading font-display text-2xl font-bold text-text-bright">
            Education
          </h2>
          <div className="mt-6 rounded border border-border bg-surface p-6">
            <p className="font-display text-base font-bold text-text-bright">
              B.Tech in Computer Science and Engineering
            </p>
            <p className="mt-1 font-mono text-sm text-text-muted">
              Amrita School of Engineering, Kerala · 2019
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA — Open to opportunities
      ══════════════════════════════════════════════ */}
      <section id="contact">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded border border-border bg-surface p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
              currently open to
            </p>
            <p className="font-body text-base leading-relaxed text-text">
              Staff / Senior Engineer (IC) roles in platform engineering,
              distributed systems, and infrastructure at scale.
              Open to opportunities in the US (H1B), Europe, Remote, and India.
            </p>
            <a
              href="mailto:aaditya@sparker0i.me"
              className="mt-5 inline-block font-mono text-sm text-accent border border-accent/30 rounded px-4 py-1.5 hover:bg-accent/5 transition-colors"
            >
              get in touch →
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

function ProjectCard({
  title,
  description,
  tags,
  tagVariant = 'green',
}: {
  title: string
  description: string
  tags: string[]
  tagVariant?: 'green' | 'amber' | 'muted'
}) {
  return (
    <article className="rounded border border-border bg-surface p-5 transition-colors duration-150 hover:border-[#3a433a]">
      <h3 className="font-display text-base font-bold text-text-bright">{title}</h3>
      <p className="mt-2 font-body text-sm leading-relaxed text-text-muted">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t} className={`tag tag-${tagVariant}`}>{t}</span>
        ))}
      </div>
    </article>
  )
}
