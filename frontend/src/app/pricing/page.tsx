'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Users,
  Briefcase,
  Award,
  Zap,
  Shield,
  Star,
  Calculator,
  Gift,
  TrendingUp,
  Clock,
  MessageSquare,
  BadgeCheck
} from 'lucide-react';
import PublicNavbar from '@/components/layout/public-navbar';

// Subscription plans
const subscriptionPlans = [
  {
    name: 'Free',
    price: 0,
    period: '/month',
    clientJobs: 2,
    artisanBids: 5,
    features: [
      'Basic support',
      'Job posting',
      'Bidding on jobs',
      'Secure escrow payments'
    ],
    isPopular: false,
    cta: 'Get Started Free'
  },
  {
    name: 'Premium',
    price: 299,
    period: '/month',
    clientJobs: 50,
    artisanBids: 100,
    features: [
      'Priority support',
      '50 job postings/month',
      '100 bids/month',
      'Featured listings',
      'Priority matching',
      'Advanced analytics'
    ],
    isPopular: true,
    cta: 'Upgrade to Premium'
  }
];

// Credit bundles for artisans
const creditBundles = [
  { credits: 50, price: 50, bonus: 0 },
  { credits: 100, price: 95, bonus: 5 },
  { credits: 250, price: 225, bonus: 10, popular: true },
  { credits: 500, price: 425, bonus: 15 },
  { credits: 1000, price: 800, bonus: 20 }
];

// Artisan level summary
const artisanLevels = [
  { name: 'Newcomer', emoji: '🌱', fee: '12%', freeBids: 0 },
  { name: 'Rising Star', emoji: '⭐', fee: '10%', freeBids: 5 },
  { name: 'Silver Pro', emoji: '🥈', fee: '8%', freeBids: 10 },
  { name: 'Gold Expert', emoji: '🥇', fee: '6%', freeBids: 20 },
  { name: 'Elite Master', emoji: '👑', fee: '5%', freeBids: 30 }
];

// Client features
const clientFeatures = [
  { icon: Briefcase, text: '2 free job postings per month (50 with Premium)' },
  { icon: Users, text: 'Receive multiple quotes from verified artisans' },
  { icon: MessageSquare, text: 'Direct messaging with artisans' },
  { icon: BadgeCheck, text: 'Access to verified professional profiles' },
  { icon: Shield, text: 'Secure escrow payment protection' },
  { icon: Star, text: 'Rate and review completed work' }
];

// Artisan features
const artisanFeatures = [
  { icon: Users, text: 'Create a professional profile' },
  { icon: Briefcase, text: 'Browse unlimited job listings' },
  { icon: Coins, text: '5 free bids per month (100 with Premium)' },
  { icon: Award, text: 'Level up for lower fees and perks' },
  { icon: Zap, text: 'Boost profile visibility' },
  { icon: Gift, text: 'Earn free credits through referrals' }
];

// ROI examples
const roiExamples = [
  {
    scenario: 'Plumbing Repair',
    bidCredits: 5,
    bidCost: 'R5',
    jobValue: 'R800',
    roi: '160x'
  },
  {
    scenario: 'Painting Job',
    bidCredits: 5,
    bidCost: 'R5',
    jobValue: 'R2,500',
    roi: '500x'
  },
  {
    scenario: 'Electrical Work',
    bidCredits: 5,
    bidCost: 'R5',
    jobValue: 'R1,200',
    roi: '240x'
  }
];

const faqs = [
  {
    question: 'Is it really free for clients?',
    answer: 'Yes! Clients never pay any platform fees. You post jobs for free, receive quotes for free, and only pay the artisan directly for the work completed. We charge a small commission to artisans on completed jobs instead.'
  },
  {
    question: 'How much does it cost to bid on a job?',
    answer: 'Each bid costs 5 credits (approximately R5). If you win the job, your bid credits are refunded! This means you only pay for bids on jobs you don\'t win, keeping costs low for successful artisans.'
  },
  {
    question: 'What is the platform fee for artisans?',
    answer: 'Platform fees range from 5% to 12% depending on your artisan level. Newcomers start at 12%, but as you complete more jobs and earn great reviews, you\'ll level up and your fees decrease. Elite Masters pay only 5%!'
  },
  {
    question: 'How do I get free credits?',
    answer: 'You can earn free credits by: leveling up (higher levels get free monthly bids), referring other artisans (25 credits per referral), and through special promotions and voucher codes we distribute via email and social media.'
  },
  {
    question: 'Are payments secure?',
    answer: 'Absolutely. We use escrow payment protection. Clients fund the job when accepting a quote, but funds are only released to the artisan once the client confirms the work is complete. This protects both parties.'
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept credit/debit cards, EFT bank transfers, and popular South African mobile payment methods including SnapScan and Zapper. All transactions are secured with bank-level encryption.'
  },
  {
    question: 'Can I cancel and get a refund?',
    answer: 'Credits are non-refundable once purchased, but they never expire. For jobs in progress, our escrow system ensures fair resolution for disputes. Contact support for any specific issues.'
  },
  {
    question: 'How quickly do artisans get paid?',
    answer: 'Payout speed depends on your level: Newcomers wait 7 days, Rising Stars 5 days, Silver Pros 3 days, Gold Experts 2 days, and Elite Masters get same-day payouts!'
  }
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-cream-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left hover:text-primary-600 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-gray-900">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 text-gray-600 animate-in slide-in-from-top-2">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-cream-50 to-primary-50 py-20">
          <div className="container-wide text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Free for clients. Pay-as-you-go for artisans. No hidden fees, no surprises.
            </p>
          </div>
        </section>

        {/* Main Pricing Cards */}
        <section className="py-20">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Client Card */}
              <div className="card border-2 border-cream-200">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-full mb-4">
                    <Users className="h-7 w-7 text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">For Clients</h2>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-primary-600">Free</span>
                  </div>
                  <p className="text-gray-600 mt-2">No cost to post jobs or hire</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {clientFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <feature.icon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-primary-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-primary-700 text-center">
                    <span className="font-medium">You only pay the artisan</span> - we never charge clients any fees
                  </p>
                </div>

                <Link href="/auth/register" className="btn-primary w-full justify-center text-lg py-3">
                  Post Your First Job
                </Link>
              </div>

              {/* Artisan Card */}
              <div className="card border-2 border-primary-500 ring-2 ring-primary-100">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                    Grow Your Business
                  </span>
                </div>

                <div className="text-center mb-8 pt-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full mb-4">
                    <Briefcase className="h-7 w-7 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">For Artisans</h2>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-primary-600">5-12%</span>
                  </div>
                  <p className="text-gray-600 mt-2">Commission on completed jobs</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {artisanFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <feature.icon className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-amber-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-700 text-center">
                    <span className="font-medium">Level up to reduce fees!</span> Elite Masters pay only 5%
                  </p>
                </div>

                <Link href="/artisan/register" className="btn-primary w-full justify-center text-lg py-3">
                  Join as Artisan
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Plans */}
        <section className="py-16 bg-white">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Subscription Plans</h2>
              <p className="text-lg text-gray-600">
                Choose the plan that fits your needs. Upgrade anytime for more posting and bidding power.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {subscriptionPlans.map((plan, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-2xl p-8 shadow-lg transition-all hover:shadow-xl ${
                    plan.isPopular ? 'border-2 border-primary-500 ring-2 ring-primary-100 relative' : 'border border-cream-200'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-primary-600">
                        {plan.price === 0 ? 'Free' : `R${plan.price}`}
                      </span>
                      {plan.price > 0 && <span className="text-gray-500">{plan.period}</span>}
                    </div>
                  </div>

                  <div className="bg-cream-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary-600">{plan.clientJobs}</div>
                        <div className="text-xs text-gray-600">Jobs/month</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary-600">{plan.artisanBids}</div>
                        <div className="text-xs text-gray-600">Bids/month</div>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/auth/register"
                    className={`w-full justify-center text-lg py-3 rounded-lg font-semibold transition-colors flex items-center ${
                      plan.isPopular
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-cream-100 text-gray-900 hover:bg-cream-200'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-gray-600">
                Need more? Purchase additional credits to exceed your monthly limits.
              </p>
            </div>
          </div>
        </section>

        {/* Credit Bundles */}
        <section className="py-16 bg-cream-50">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Credit Bundles for Artisans</h2>
              <p className="text-lg text-gray-600">
                Buy credits to bid on jobs. Bigger bundles = bigger savings!
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {creditBundles.map((bundle, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl p-4 text-center shadow-lg transition-all hover:shadow-xl ${
                    bundle.popular ? 'border-2 border-primary-500 ring-2 ring-primary-100' : 'border border-cream-200'
                  }`}
                >
                  {bundle.popular && (
                    <div className="text-xs font-semibold text-primary-600 mb-2">Popular</div>
                  )}
                  <div className="text-2xl font-bold text-gray-900">{bundle.credits}</div>
                  <div className="text-xs text-gray-500 mb-2">credits</div>
                  {bundle.bonus > 0 && (
                    <div className="text-xs text-green-600 font-medium mb-2">+{bundle.bonus}% bonus</div>
                  )}
                  <div className="text-lg font-bold text-primary-600">R{bundle.price}</div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/how-it-works/credits"
                className="inline-flex items-center text-primary-600 font-medium hover:underline"
              >
                Learn more about credits
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Level System Overview */}
        <section className="py-16 bg-white">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Artisan Level System</h2>
              <p className="text-lg text-gray-600">
                Complete more jobs, get better reviews, and unlock lower fees
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              {artisanLevels.map((level, index) => (
                <div
                  key={index}
                  className="bg-cream-50 rounded-xl p-4 text-center min-w-[120px] hover:shadow-lg transition-shadow"
                >
                  <div className="text-3xl mb-2">{level.emoji}</div>
                  <div className="text-sm font-semibold text-gray-900">{level.name}</div>
                  <div className="text-lg font-bold text-primary-600">{level.fee}</div>
                  <div className="text-xs text-gray-500">{level.freeBids} free bids/mo</div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/how-it-works/levels"
                className="inline-flex items-center text-primary-600 font-medium hover:underline"
              >
                See all level benefits
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* ROI Calculator */}
        <section className="py-16 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="container-wide">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-4">
                <Calculator className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">The ROI Is Clear</h2>
              <p className="text-lg text-primary-100">
                See how a small investment in bids leads to big returns
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {roiExamples.map((example, index) => (
                <div key={index} className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">{example.scenario}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-primary-200">Bid Cost:</span>
                      <span className="font-medium">{example.bidCredits} credits ({example.bidCost})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-200">Job Value:</span>
                      <span className="font-medium">{example.jobValue}</span>
                    </div>
                    <div className="border-t border-white/20 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-primary-200">ROI:</span>
                        <span className="text-2xl font-bold text-white">{example.roi}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-primary-100 text-sm">
                Plus: If you win the job, your bid credits are refunded!
              </p>
            </div>
          </div>
        </section>

        {/* Payment Security */}
        <section className="py-16 bg-cream-50">
          <div className="container-wide">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-6">
                  <Shield className="h-7 w-7 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Secure Escrow Payments</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Our payment system protects both clients and artisans with bank-level security
                  and fair dispute resolution.
                </p>
                <ul className="space-y-3">
                  {[
                    'Funds held securely until job completion',
                    'Client confirms work before release',
                    'Fair dispute resolution process',
                    'Bank-level encryption on all transactions',
                    'Multiple payment methods accepted'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">🔐</div>
                  <h3 className="text-xl font-bold text-gray-900">How It Works</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { step: 1, text: 'Client accepts quote and funds job' },
                    { step: 2, text: 'Funds held in secure escrow' },
                    { step: 3, text: 'Artisan completes the work' },
                    { step: 4, text: 'Client confirms satisfaction' },
                    { step: 5, text: 'Artisan receives payment' }
                  ].map((item) => (
                    <div key={item.step} className="flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full text-primary-600 font-bold text-sm mr-3">
                        {item.step}
                      </div>
                      <span className="text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Pricing FAQ</h2>
                <p className="text-lg text-gray-600">
                  Got questions? We have answers.
                </p>
              </div>

              <div className="bg-cream-50 rounded-xl p-6">
                {faqs.map((faq, index) => (
                  <FAQItem key={index} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Learn More Links */}
        <section className="py-16 bg-cream-50">
          <div className="container-wide">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Learn More</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link
                href="/how-it-works/credits"
                className="card flex items-center p-5 hover:border-primary-300"
              >
                <div className="bg-amber-100 rounded-lg p-3 mr-4">
                  <Coins className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">How Credits Work</h3>
                  <p className="text-sm text-gray-600">Bundles, usage, and vouchers</p>
                </div>
              </Link>
              <Link
                href="/how-it-works/levels"
                className="card flex items-center p-5 hover:border-primary-300"
              >
                <div className="bg-purple-100 rounded-lg p-3 mr-4">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Artisan Levels</h3>
                  <p className="text-sm text-gray-600">Benefits and requirements</p>
                </div>
              </Link>
              <Link
                href="/how-it-works/boosts"
                className="card flex items-center p-5 hover:border-primary-300"
              >
                <div className="bg-yellow-100 rounded-lg p-3 mr-4">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Profile Boosts</h3>
                  <p className="text-sm text-gray-600">Increase your visibility</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-gray-800 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
                <p className="text-gray-400 mb-6">
                  Have questions about our pricing or need custom solutions for your business?
                </p>
                <Link href="/contact" className="btn-outline border-white text-white hover:bg-white hover:text-gray-900">
                  Contact Sales
                </Link>
              </div>
              <div className="bg-primary-600 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to Start?</h3>
                <p className="text-primary-100 mb-6">
                  Join thousands of users already on Taska. It takes less than 2 minutes!
                </p>
                <Link href="/auth/register" className="inline-flex items-center bg-white text-primary-600 font-semibold px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors">
                  Create Free Account
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
