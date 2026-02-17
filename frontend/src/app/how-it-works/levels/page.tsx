'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Star,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  BadgeCheck,
  Coins,
  Percent
} from 'lucide-react';
import PublicNavbar from '@/components/layout/public-navbar';

// Artisan levels data
const artisanLevels = [
  {
    name: 'Newcomer',
    emoji: '🌱',
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    ringColor: 'ring-emerald-500',
    platformFee: 12,
    freeBids: 0,
    freeBoosts: 0,
    searchBoost: 0,
    payoutDays: 7,
    requirements: {
      jobs: 0,
      rating: 0,
      monthsActive: 0
    },
    description: 'Just getting started on Taska. Complete your first few jobs to level up!'
  },
  {
    name: 'Rising Star',
    emoji: '⭐',
    color: 'amber',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    ringColor: 'ring-amber-500',
    platformFee: 10,
    freeBids: 5,
    freeBoosts: 0,
    searchBoost: 10,
    payoutDays: 5,
    requirements: {
      jobs: 5,
      rating: 4.0,
      monthsActive: 1
    },
    description: 'You\'re on the rise! Keep delivering quality work to advance further.'
  },
  {
    name: 'Silver Pro',
    emoji: '🥈',
    color: 'slate',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
    ringColor: 'ring-slate-500',
    platformFee: 8,
    freeBids: 10,
    freeBoosts: 1,
    searchBoost: 25,
    payoutDays: 3,
    requirements: {
      jobs: 15,
      rating: 4.3,
      monthsActive: 3
    },
    description: 'A proven professional with a solid track record of satisfied clients.'
  },
  {
    name: 'Gold Expert',
    emoji: '🥇',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    ringColor: 'ring-yellow-500',
    platformFee: 6,
    freeBids: 20,
    freeBoosts: 2,
    searchBoost: 50,
    payoutDays: 2,
    requirements: {
      jobs: 50,
      rating: 4.6,
      monthsActive: 6
    },
    description: 'An expert artisan trusted by many clients for exceptional work.'
  },
  {
    name: 'Elite Master',
    emoji: '👑',
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    ringColor: 'ring-purple-500',
    platformFee: 5,
    freeBids: 30,
    freeBoosts: 3,
    searchBoost: 100,
    payoutDays: 1,
    requirements: {
      jobs: 100,
      rating: 4.8,
      monthsActive: 12
    },
    description: 'The pinnacle of artisan excellence. Top-tier visibility and benefits.'
  }
];

const benefits = [
  {
    icon: Percent,
    title: 'Lower Platform Fees',
    description: 'As you level up, your platform fee decreases from 12% to just 5%, meaning you keep more of your earnings.'
  },
  {
    icon: Coins,
    title: 'Free Monthly Bids',
    description: 'Higher levels unlock free bid credits every month, helping you grow your business without extra costs.'
  },
  {
    icon: Zap,
    title: 'Free Profile Boosts',
    description: 'Get complimentary profile boosts each month to increase your visibility in search results.'
  },
  {
    icon: TrendingUp,
    title: 'Search Visibility Boost',
    description: 'Your profile appears higher in search results, making it easier for clients to find you.'
  },
  {
    icon: Clock,
    title: 'Faster Payouts',
    description: 'Get paid faster! Elite Masters receive same-day payouts while newcomers wait 7 days.'
  },
  {
    icon: BadgeCheck,
    title: 'Trust Badges',
    description: 'Display your level badge proudly on your profile to build trust with potential clients.'
  }
];

const faqs = [
  {
    question: 'How do I level up?',
    answer: 'Your level is determined by three factors: completed jobs, average rating, and time active on the platform. Meet all the requirements for a level and you\'ll automatically be promoted!'
  },
  {
    question: 'Can I lose my level?',
    answer: 'Levels are not permanent. If your rating drops significantly below the threshold or you become inactive for extended periods, you may be demoted. However, we provide warnings before any demotion.'
  },
  {
    question: 'When do I receive my free monthly bids?',
    answer: 'Free bids are credited to your account on the 1st of each month. They expire if not used within the month, so make sure to use them!'
  },
  {
    question: 'How is the search visibility boost calculated?',
    answer: 'The percentage boost is applied to your base ranking score. For example, a Gold Expert with a 50% boost will appear significantly higher in search results compared to a Newcomer with the same base score.'
  },
  {
    question: 'Do I need to verify my identity at higher levels?',
    answer: 'Yes, advancing to Silver Pro and above requires identity verification. This includes ID document verification, proof of address, and for Gold Expert and Elite Master, proof of qualifications in your trade.'
  },
  {
    question: 'How long does payout processing take?',
    answer: 'Payout processing time depends on your level. Newcomers have a 7-day holding period, while Elite Masters enjoy same-day payouts. This period helps ensure job satisfaction before funds are released.'
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

export default function LevelsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-50 via-cream-50 to-primary-50 py-20">
          <div className="container-wide">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                Artisan Levels Explained
              </h1>
              <p className="text-lg text-gray-600">
                Progress through 5 tiers to unlock lower fees, free bids, and premium benefits.
                The more you work, the more you earn!
              </p>
            </div>
          </div>
        </section>

        {/* Level Progression Visual */}
        <section className="py-16 bg-white">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Path to Elite Status</h2>
              <p className="text-lg text-gray-600">
                Start as a Newcomer and work your way up to Elite Master
              </p>
            </div>

            {/* Progression Arrow */}
            <div className="flex items-center justify-center mb-12 flex-wrap gap-2">
              {artisanLevels.map((level, index) => (
                <div key={index} className="flex items-center">
                  <div className={`flex flex-col items-center p-3 rounded-xl ${level.bgColor} transition-transform hover:scale-110`}>
                    <span className="text-3xl mb-1">{level.emoji}</span>
                    <span className={`text-xs font-medium ${level.textColor}`}>{level.name}</span>
                  </div>
                  {index < artisanLevels.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-gray-300 mx-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Level Cards */}
        <section className="py-16 bg-cream-50">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Level Benefits & Requirements</h2>
              <p className="text-lg text-gray-600">
                Compare what each level offers and what it takes to get there
              </p>
            </div>

            <div className="space-y-8">
              {artisanLevels.map((level, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-2xl border-2 ${level.borderColor} shadow-lg overflow-hidden`}
                >
                  <div className="grid lg:grid-cols-3 gap-0">
                    {/* Level Info */}
                    <div className={`${level.bgColor} p-8 flex flex-col justify-center`}>
                      <div className="text-center lg:text-left">
                        <span className="text-5xl mb-4 block">{level.emoji}</span>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{level.name}</h3>
                        <p className={`text-sm ${level.textColor}`}>{level.description}</p>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="p-8 border-b lg:border-b-0 lg:border-r border-cream-200">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Benefits</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Percent className="h-4 w-4 mr-2 text-primary-500" />
                            Platform Fee
                          </span>
                          <span className="font-bold text-gray-900">{level.platformFee}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Coins className="h-4 w-4 mr-2 text-amber-500" />
                            Free Bids/Month
                          </span>
                          <span className="font-bold text-gray-900">{level.freeBids || 'None'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                            Free Boosts/Month
                          </span>
                          <span className="font-bold text-gray-900">{level.freeBoosts || 'None'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                            Search Boost
                          </span>
                          <span className="font-bold text-gray-900">+{level.searchBoost}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-blue-500" />
                            Payout Time
                          </span>
                          <span className="font-bold text-gray-900">
                            {level.payoutDays === 1 ? 'Same day' : `${level.payoutDays} days`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="p-8">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Requirements</h4>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <CheckCircle className={`h-5 w-5 mr-2 flex-shrink-0 ${index === 0 ? 'text-gray-300' : 'text-primary-500'}`} />
                          <div>
                            <span className="text-gray-900 font-medium">
                              {level.requirements.jobs === 0 ? 'No minimum' : `${level.requirements.jobs}+ completed jobs`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <CheckCircle className={`h-5 w-5 mr-2 flex-shrink-0 ${index === 0 ? 'text-gray-300' : 'text-primary-500'}`} />
                          <div>
                            <span className="text-gray-900 font-medium">
                              {level.requirements.rating === 0 ? 'No minimum rating' : `${level.requirements.rating}+ star rating`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <CheckCircle className={`h-5 w-5 mr-2 flex-shrink-0 ${index === 0 ? 'text-gray-300' : 'text-primary-500'}`} />
                          <div>
                            <span className="text-gray-900 font-medium">
                              {level.requirements.monthsActive === 0 ? 'No minimum time' : `${level.requirements.monthsActive}+ months active`}
                            </span>
                          </div>
                        </div>
                        {index >= 2 && (
                          <div className="flex items-start">
                            <Shield className="h-5 w-5 mr-2 flex-shrink-0 text-blue-500" />
                            <div>
                              <span className="text-gray-900 font-medium">
                                {index >= 3 ? 'Full verification + qualifications' : 'Identity verified'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Overview */}
        <section className="py-16 bg-white">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Level Up?</h2>
              <p className="text-lg text-gray-600">
                Each level brings tangible benefits that help grow your business
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-cream-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                    <benefit.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 bg-cream-50">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Comparison</h2>
              <p className="text-lg text-gray-600">
                See all level benefits at a glance
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-50 border-b border-cream-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Benefit</th>
                    {artisanLevels.map((level, index) => (
                      <th key={index} className="px-4 py-4 text-center">
                        <span className="text-2xl block mb-1">{level.emoji}</span>
                        <span className="text-xs font-medium text-gray-600">{level.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                  <tr className="hover:bg-cream-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Platform Fee</td>
                    {artisanLevels.map((level, index) => (
                      <td key={index} className="px-4 py-4 text-center font-bold text-gray-900">
                        {level.platformFee}%
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-cream-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Free Bids/Month</td>
                    {artisanLevels.map((level, index) => (
                      <td key={index} className="px-4 py-4 text-center font-bold text-gray-900">
                        {level.freeBids || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-cream-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Free Boosts/Month</td>
                    {artisanLevels.map((level, index) => (
                      <td key={index} className="px-4 py-4 text-center font-bold text-gray-900">
                        {level.freeBoosts || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-cream-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Search Boost</td>
                    {artisanLevels.map((level, index) => (
                      <td key={index} className="px-4 py-4 text-center font-bold text-gray-900">
                        +{level.searchBoost}%
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-cream-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Payout Time</td>
                    {artisanLevels.map((level, index) => (
                      <td key={index} className="px-4 py-4 text-center font-bold text-gray-900">
                        {level.payoutDays === 1 ? '1 day' : `${level.payoutDays} days`}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <p className="text-lg text-gray-600">
                  Everything you need to know about the level system
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

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-primary-500 to-primary-600">
          <div className="container-wide text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Start Your Journey Today</h2>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
              Join Taska as an artisan and begin your path from Newcomer to Elite Master.
              The more jobs you complete, the more benefits you unlock!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/artisan/register"
                className="inline-flex items-center bg-white text-primary-600 font-semibold px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Join as Artisan
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <Link
                href="/how-it-works/credits"
                className="inline-flex items-center text-white font-medium hover:underline"
              >
                Learn about Credits
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section className="py-16 bg-cream-50">
          <div className="container-wide">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Learn More</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link
                href="/how-it-works/credits"
                className="card flex items-center p-4 hover:border-primary-300"
              >
                <div className="bg-amber-100 rounded-lg p-3 mr-4">
                  <Coins className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Taska Credits</h3>
                  <p className="text-sm text-gray-600">Buy and use credits</p>
                </div>
              </Link>
              <Link
                href="/how-it-works/boosts"
                className="card flex items-center p-4 hover:border-primary-300"
              >
                <div className="bg-yellow-100 rounded-lg p-3 mr-4">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Profile Boosts</h3>
                  <p className="text-sm text-gray-600">Get noticed faster</p>
                </div>
              </Link>
              <Link
                href="/pricing"
                className="card flex items-center p-4 hover:border-primary-300"
              >
                <div className="bg-green-100 rounded-lg p-3 mr-4">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Full Pricing</h3>
                  <p className="text-sm text-gray-600">See all options</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
