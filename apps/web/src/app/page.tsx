import Link from 'next/link';
import { ArrowRight, Bot, BookOpenText, ClipboardList, LifeBuoy, ShieldCheck, Sparkles } from 'lucide-react';

const quickLinks = [
  {
    href: '/submit-case',
    title: 'Submit a support case',
    description: 'Open a new request for billing, technical, shipping, account, or product issues.',
    icon: ClipboardList,
  },
  {
    href: '/knowledge-base',
    title: 'Search the knowledge base',
    description: 'Browse curated guidance, troubleshooting steps, and self-service documentation.',
    icon: BookOpenText,
  },
  {
    href: '/assistant',
    title: 'Chat with the AI assistant',
    description: 'Get instant answers and suggested next steps before opening a case.',
    icon: Bot,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-primary-900 px-8 py-12 text-white shadow-2xl lg:grid-cols-[1.35fr_0.9fr] lg:px-12">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-primary-100 ring-1 ring-white/15">
            <Sparkles className="h-4 w-4" /> Intelligent customer support operations
          </span>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">Welcome to OctoCare Support</h1>
            <p className="max-w-2xl text-lg text-slate-200">
              Resolve issues faster with a unified support portal for customers and agents. Submit cases, track progress,
              search expert guidance, or collaborate with an AI assistant trained to speed up answers.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/submit-case"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-primary-50"
            >
              Open a new case <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explore agent dashboard
            </Link>
          </div>
        </div>
        <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
          <div className="rounded-2xl bg-white/10 p-5">
            <LifeBuoy className="mb-3 h-8 w-8 text-primary-200" />
            <h2 className="text-lg font-semibold">Always-on case management</h2>
            <p className="mt-2 text-sm text-slate-200">Route requests to the right team, stay on top of SLAs, and keep customers informed.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5">
            <ShieldCheck className="mb-3 h-8 w-8 text-emerald-200" />
            <h2 className="text-lg font-semibold">Transparent case tracking</h2>
            <p className="mt-2 text-sm text-slate-200">Customers can monitor status, updates, and conversation history in one secure place.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {quickLinks.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl"
          >
            <div className="mb-4 inline-flex rounded-2xl bg-primary-50 p-3 text-primary-700">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-700">
              Go now <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Everything your support organization needs</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            OctoCare Support Hub combines customer self-service and internal operations so teams can move from intake to resolution with clarity.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-950">For customers</h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            <li>Track active cases and review updates</li>
            <li>Get instant answers from AI before escalation</li>
            <li>Explore helpful articles and troubleshooting guides</li>
          </ul>
        </div>
        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-950">For agents</h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            <li>Monitor queues, critical cases, and SLA risk</li>
            <li>Review AI summaries and recommended next actions</li>
            <li>Inspect audit history and manage case workflows</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
