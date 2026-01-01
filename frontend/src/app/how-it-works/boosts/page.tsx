'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Star,
  Crown,
  TrendingUp,
  Bell,
  Eye,
  Clock,
  Sparkles,
  Target,
  Calendar,
  Coins,
  Award
} from 'lucide-react';

// Boost types data
const boostTypes = [
  {
    name: 'Standard Boost',
    icon: Zap,
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    credits: 10,
    duration: '24 hours',
    visibility: '+25%',
    features: [
      '25% higher in search results',
      '24-hour duration',
      'Basic visibility boost'
    ],
    notIncluded: [
      'Featured badge',
      'Client notifications',
      'Extended duration'
    ],
    bestFor: 'Testing the waters or quick visibility bump',
    popular: false
  },
  {
    name: 'Super Boost',
    icon: Star,
    color: 'amber',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    credits: 25,
    duration: '48 hours',
    visibility: '+50%',
    features: [
      '50% higher in search results',
      '48-hour duration',
      'Featured badge on profile',
      'Highlighted in category listings'
    ],
    notIncluded: [
      'Client notifications',
      'Week-long visibility'
    ],
    bestFor: 'Serious about landing new clients this week',
    popular: true
  },
  {
    name: 'Premium Boost',
    icon: Crown,
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    credits: 50,
    duration: '7 days',
    visibility: '+100%',
    features: [
      '100% higher in search results',
      '7-day duration',
      'Premium featured badge',
      'Highlighted in all listings',
      'Push notifications to nearby clients',
      'Featured on homepage carousel'
    ],
    notIncluded: [],
    bestFor: 'Maximum exposure for growing your business',
    popular: false
  }
];

const strategicTips = [
  {
    icon: Target,
    title: 'Target High-Demand Periods',
    description: 'Use boosts on Monday mornings when clients are posting weekend project ideas, or Friday afternoons for urgent weekend jobs.'
  },
  {
    icon: Calendar,
    title: 'Seasonal Timing',
    description: 'Boost during peak seasons for your trade - spring for garden work, winter for heating repairs, holiday season for decorations.'
  },
  {
    icon: Sparkles,
    title: 'After Profile Updates',
    description: 'Just added new photos or reviews? Boost your profile to showcase your fresh content to more potential clients.'
  },
  {
    icon: TrendingUp,
    title: 'Stack with Quality',
    description: 'Boosts work best with a complete profile. Ensure you have photos, reviews, and verified credentials before boosting.'
  }
];

const faqs = [
  {
    question: 'How do boosts affect my search ranking?',
    answer: 'Boosts multiply your base ranking score by the boost percentage. A Standard Boost (+25%) means if your base score would put you at position 10, you\'d appear around position 7-8 instead. Premium Boost (+100%) could move you to the top positions.'
  },
  {
    question: 'Can I stack multiple boosts?',
    answer: 'No, you can only have one active boost at a time. If you purchase a new boost while one is active, the new boost will replace the current one. We recommend waiting for your current boost to expire before activating a new one.'
  },
  {
    question: 'Do boosts guarantee more jobs?',
    answer: 'Boosts increase your visibility significantly, but landing jobs still depends on your profile quality, reviews, pricing, and how well you match client needs. Think of boosts as getting your foot in the door - you still need to make a great impression!'
  },
  {
    question: 'What are the push notifications in Premium Boost?',
    answer: 'With Premium Boost, clients in your service area who have enabled notifications will receive an alert about highly-rated artisans in their area. This is a powerful way to reach clients before they even post a job.'
  },
  {
    question: 'Can I cancel a boost and get a refund?',
    answer: 'Once activated, boosts cannot be cancelled or refunded as the visibility benefits begin immediately. Make sure you\'re ready to respond to potential client inquiries before activating your boost.'
  },
  {
    question: 'How often should I boost my profile?',
    answer: 'This depends on your goals. For steady lead flow, many successful artisans boost weekly during their target periods. For maximum impact, consider Premium Boosts during your seasonal peak times.'
  },
  {
    question: 'Do higher-level artisans get better boost results?',
    answer: 'Yes! Boost percentages stack with your level\'s search visibility bonus. An Elite Master with a Premium Boost (+100%) plus their level bonus (+100%) would have a combined +200% boost to their ranking score.'
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

export default function BoostsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-cream-200 bg-white/95 backdrop-blur">
        <div className="container-wide flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5" />
            <div className="h-8 w-8 rounded-lg bg-gradient-primary"></div>
            <span className="text-xl font-bold text-gray-900">Taska</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login" className="nav-link">Sign In</Link>
            <Link href="/auth/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-yellow-50 via-cream-50 to-amber-50 py-20">
          <div className="container-wide">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                Boost Your Profile
              </h1>
              <p className="text-lg text-gray-600">
                Stand out from the crowd and get noticed by more clients.
                Profile boosts increase your visibility in search results and help you land more jobs.
              </p>
            </div>
          </div>
        </section>

        {/* What Are Boosts */}
        <section className="py-16 bg-white">
          <div className="container-wide">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Get Seen, Get Hired
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  With thousands of artisans on Taska, standing out is essential.
                  Profile boosts elevate your ranking in search results, making it easier
                  for clients to find and choose you for their projects.
                </p>
                <ul className="space-y-4">
                  {[
                    'Appear higher in client search results',
                    'Get more profile views and bid opportunities',
                    'Featured badges increase trust and credibility',
                    'Premium boosts notify nearby clients directly'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl p-8">
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm flex items-center">
                    <div className="bg-purple-100 rounded-full p-2 mr-3">
                      <Crown className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">John P.</span>
                        <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">Premium</span>
                      </div>
                      <span className="text-sm text-gray-500">Master Plumber</span>
                    </div>
                    <div className="text-amber-500 flex">
                      {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                    </div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-4 flex items-center">
                    <div className="bg-gray-100 rounded-full p-2 mr-3">
                      <div className="h-5 w-5 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-4 flex items-center opacity-75">
                    <div className="bg-gray-100 rounded-full p-2 mr-3">
                      <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-14"></div>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-amber-700 mt-4 font-medium">
                  Boosted profiles appear at the top of search results
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Boost Types Comparison */}
        <section className="py-16 bg-cream-50">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Boost</h2>
              <p className="text-lg text-gray-600">
                Three powerful options to match your goals and budget
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {boostTypes.map((boost, index) => (
                <div
                  key={index}
                  className={`relative bg-white rounded-2xl border-2 ${boost.borderColor} shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                    boost.popular ? 'ring-2 ring-amber-400' : ''
                  }`}
                >
                  {boost.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-amber-400 text-white text-center text-xs font-semibold py-1">
                      Most Popular
                    </div>
                  )}

                  <div className={`${boost.bgColor} p-6 ${boost.popular ? 'pt-8' : ''}`}>
                    <div className="flex items-center justify-center mb-4">
                      <div className={`${boost.iconBg} rounded-full p-3`}>
                        <boost.icon className={`h-8 w-8 ${boost.iconColor}`} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{boost.name}</h3>
                    <div className="text-center">
                      <span className="text-3xl font-bold text-gray-900">{boost.credits}</span>
                      <span className="text-gray-600 ml-1">credits</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Eye className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">Visibility</span>
                        </div>
                        <span className={`font-bold ${boost.textColor}`}>{boost.visibility}</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">Duration</span>
                        </div>
                        <span className={`font-bold ${boost.textColor}`}>{boost.duration}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {boost.features.map((feature, i) => (
                        <div key={i} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                      {boost.notIncluded.map((feature, i) => (
                        <div key={i} className="flex items-start opacity-50">
                          <div className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 rounded-full border border-gray-300"></div>
                          <span className="text-sm text-gray-500">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-6">
                      <p className="text-xs text-gray-600 text-center">
                        <span className="font-medium">Best for:</span> {boost.bestFor}
                      </p>
                    </div>

                    <Link
                      href="/auth/register"
                      className={`block w-full py-3 rounded-lg font-semibold text-center transition-colors ${
                        boost.popular
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Get {boost.name}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 bg-white">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Boost Comparison</h2>
              <p className="text-lg text-gray-600">
                Side-by-side comparison of all boost features
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
                <thead>
                  <tr className="bg-gray-50 border-b border-cream-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    {boostTypes.map((boost, index) => (
                      <th key={index} className="px-6 py-4 text-center">
                        <div className={`inline-flex items-center justify-center w-10 h-10 ${boost.iconBg} rounded-full mb-2`}>
                          <boost.icon className={`h-5 w-5 ${boost.iconColor}`} />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{boost.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                  <tr className="hover:bg-cream-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Credit Cost</td>
                    {boostTypes.map((boost, index) => (
                      <td key={index} className="px-6 py-4 text-center font-bold text-gray-900">
                        {boost.credits}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-cream-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Duration</td>
                    {boostTypes.map((boost, index) => (
                      <td key={index} className="px-6 py-4 text-center text-gray-700">
                        {boost.duration}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-cream-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Visibility Boost</td>
                    {boostTypes.map((boost, index) => (
                      <td key={index} className={`px-6 py-4 text-center font-bold ${boost.textColor}`}>
                        {boost.visibility}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-cream-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Featured Badge</td>
                    <td className="px-6 py-4 text-center text-gray-400">-</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-cream-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Category Highlight</td>
                    <td className="px-6 py-4 text-center text-gray-400">-</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-cream-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Client Notifications</td>
                    <td className="px-6 py-4 text-center text-gray-400">-</td>
                    <td className="px-6 py-4 text-center text-gray-400">-</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-cream-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Homepage Feature</td>
                    <td className="px-6 py-4 text-center text-gray-400">-</td>
                    <td className="px-6 py-4 text-center text-gray-400">-</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Strategic Tips */}
        <section className="py-16 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">When to Boost Strategically</h2>
              <p className="text-lg text-primary-100">
                Maximize your boost ROI with these proven strategies
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {strategicTips.map((tip, index) => (
                <div key={index} className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <tip.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{tip.title}</h3>
                  <p className="text-sm text-primary-100">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI Calculator Visual */}
        <section className="py-16 bg-white">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Boost ROI Example</h2>
                <p className="text-lg text-gray-600">
                  See how a boost can pay for itself with just one extra job
                </p>
              </div>

              <div className="bg-cream-50 rounded-2xl p-8">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-4xl mb-2">25</div>
                    <div className="text-sm text-gray-600 mb-4">Credits for Super Boost</div>
                    <div className="text-xs text-gray-500">(R25 value)</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-8 w-8 text-primary-500" />
                  </div>
                  <div className="bg-primary-50 rounded-xl p-6 shadow-sm border-2 border-primary-200">
                    <div className="text-4xl mb-2 text-primary-600">R500+</div>
                    <div className="text-sm text-gray-600 mb-4">Average Job Value</div>
                    <div className="text-xs text-primary-600 font-medium">20x Return!</div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 text-center">
                    <span className="font-medium">The math is simple:</span> Even if a boost only helps you land
                    one additional job, it pays for itself many times over. Most boosted artisans report
                    2-3x more profile views during their boost period.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-cream-50">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <p className="text-lg text-gray-600">
                  Everything you need to know about profile boosts
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                {faqs.map((faq, index) => (
                  <FAQItem key={index} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-amber-500 to-yellow-500">
          <div className="container-wide text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Noticed?</h2>
            <p className="text-lg text-amber-100 mb-8 max-w-2xl mx-auto">
              Join Taska today and use profile boosts to stand out from the competition.
              Your next client is searching right now!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/artisan/register"
                className="inline-flex items-center bg-white text-amber-600 font-semibold px-6 py-3 rounded-lg hover:bg-amber-50 transition-colors"
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
        <section className="py-16 bg-white">
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
                href="/how-it-works/levels"
                className="card flex items-center p-4 hover:border-primary-300"
              >
                <div className="bg-purple-100 rounded-lg p-3 mr-4">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Artisan Levels</h3>
                  <p className="text-sm text-gray-600">Unlock more benefits</p>
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
