'use client';

import { useState } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  Coins,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Gift,
  Zap,
  Star,
  Shield,
  Wallet,
  ArrowRight
} from 'lucide-react';

// Credit bundle data
const creditBundles = [
  {
    credits: 50,
    price: 50,
    bonus: 0,
    bonusCredits: 0,
    popular: false,
    description: 'Perfect for trying out the platform'
  },
  {
    credits: 100,
    price: 95,
    bonus: 5,
    bonusCredits: 5,
    popular: false,
    description: 'Great for occasional bidding'
  },
  {
    credits: 250,
    price: 225,
    bonus: 10,
    bonusCredits: 25,
    popular: true,
    description: 'Most popular choice for active artisans'
  },
  {
    credits: 500,
    price: 425,
    bonus: 15,
    bonusCredits: 75,
    popular: false,
    description: 'Best value for serious professionals'
  },
  {
    credits: 1000,
    price: 800,
    bonus: 20,
    bonusCredits: 200,
    popular: false,
    description: 'Maximum savings for high-volume bidders'
  }
];

const creditUses = [
  {
    icon: Zap,
    title: 'Submit Bids',
    description: 'Use 5 credits per bid on job listings. Win the job and get your credits back!',
    creditCost: '5 credits/bid'
  },
  {
    icon: Star,
    title: 'Boost Your Profile',
    description: 'Increase your visibility in search results and get noticed by more clients.',
    creditCost: '10-50 credits'
  },
  {
    icon: Gift,
    title: 'Featured Listings',
    description: 'Get your profile featured on the homepage and category pages.',
    creditCost: '25-100 credits'
  },
  {
    icon: Shield,
    title: 'Verified Badge',
    description: 'Maintain your verified status with premium features and trust indicators.',
    creditCost: 'Included in plans'
  }
];

const faqs = [
  {
    question: 'What are Taska Credits?',
    answer: 'Taska Credits are our platform currency that artisans use to bid on jobs, boost their profiles, and access premium features. Credits provide a fair and transparent way to participate in the marketplace.'
  },
  {
    question: 'How much does a bid cost?',
    answer: 'Each bid costs 5 credits. If you win the job, you get your bid credits refunded! This ensures artisans are incentivized to bid on jobs they are genuinely interested in and qualified for.'
  },
  {
    question: 'Do credits expire?',
    answer: 'No, your credits never expire! Once purchased, they remain in your account until you use them. This gives you the flexibility to bid at your own pace.'
  },
  {
    question: 'Can I get a refund on credits?',
    answer: 'Credits are non-refundable once purchased. However, if you win a job, your bid credits are automatically returned to your account. We recommend starting with a smaller bundle to test the platform.'
  },
  {
    question: 'What are vouchers?',
    answer: 'Vouchers are special promotional codes that can be redeemed for free credits. Look out for vouchers from Taska promotions, referral programs, or special events. Enter your voucher code in your account settings to claim your free credits.'
  },
  {
    question: 'How do I earn free credits?',
    answer: 'You can earn free credits through our referral program (get 25 credits for each artisan you refer), by leveling up your artisan tier, and through special promotions. Higher-tier artisans also receive free monthly bid credits.'
  },
  {
    question: 'Can I transfer credits to another account?',
    answer: 'Credits are non-transferable and are tied to your account. This ensures the integrity of our platform and protects against fraud.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept credit/debit cards, EFT bank transfers, and mobile payment methods popular in South Africa including SnapScan and Zapper. All transactions are secured with bank-level encryption.'
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

export default function CreditsPage() {
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
        <section className="bg-gradient-to-br from-amber-50 via-cream-50 to-primary-50 py-20">
          <div className="container-wide">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
                <Coins className="h-8 w-8 text-amber-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                How Taska Credits Work
              </h1>
              <p className="text-lg text-gray-600">
                Credits are your key to winning jobs on Taska. Buy credits, submit bids,
                and grow your artisan business with our transparent pricing system.
              </p>
            </div>
          </div>
        </section>

        {/* What Are Credits */}
        <section className="py-16 bg-white">
          <div className="container-wide">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Your Currency for Success
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Taska Credits are the platform currency that powers your artisan business.
                  Use them to bid on jobs, boost your visibility, and access premium features
                  that help you stand out from the competition.
                </p>
                <ul className="space-y-4">
                  {[
                    'Pay only for the features you use',
                    'Credits never expire - use at your own pace',
                    'Win a job? Get your bid credits refunded!',
                    'Earn free credits through referrals and promotions'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-primary-100 rounded-2xl p-8 text-center">
                <div className="text-6xl mb-4">
                  <Wallet className="h-20 w-20 mx-auto text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Simple Math</h3>
                <p className="text-gray-600 mb-4">1 Credit = R1.00 base value</p>
                <div className="bg-white/80 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Buy in bulk and save up to <span className="font-bold text-primary-600">20%</span> with bonus credits!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Credit Bundles */}
        <section className="py-16 bg-cream-50">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Credit Bundles</h2>
              <p className="text-lg text-gray-600">
                Choose the bundle that fits your business needs. Bigger bundles = bigger savings!
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              {creditBundles.map((bundle, index) => (
                <div
                  key={index}
                  className={`relative bg-white rounded-xl p-6 shadow-lg transition-all hover:shadow-xl hover:scale-105 ${
                    bundle.popular ? 'border-2 border-primary-500 ring-2 ring-primary-100' : 'border border-cream-200'
                  }`}
                >
                  {bundle.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {bundle.credits}
                    </div>
                    <div className="text-sm text-gray-500 mb-4">credits</div>

                    {bundle.bonus > 0 && (
                      <div className="inline-flex items-center bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full mb-3">
                        <Gift className="h-3 w-3 mr-1" />
                        +{bundle.bonusCredits} bonus ({bundle.bonus}% extra)
                      </div>
                    )}

                    <div className="text-2xl font-bold text-primary-600 mb-1">
                      R{bundle.price}
                    </div>
                    <div className="text-xs text-gray-500 mb-4">
                      R{(bundle.price / (bundle.credits + bundle.bonusCredits)).toFixed(2)}/credit
                    </div>

                    <p className="text-xs text-gray-600 mb-4">
                      {bundle.description}
                    </p>

                    <Link
                      href="/auth/register"
                      className={`block w-full py-2 rounded-lg font-medium transition-colors ${
                        bundle.popular
                          ? 'bg-primary-500 text-white hover:bg-primary-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Buy Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What Can Credits Be Used For */}
        <section className="py-16 bg-white">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What Can You Do With Credits?</h2>
              <p className="text-lg text-gray-600">
                Unlock powerful features to grow your artisan business
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {creditUses.map((use, index) => (
                <div key={index} className="bg-cream-50 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-full mb-4">
                    <use.icon className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{use.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{use.description}</p>
                  <span className="inline-block bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded-full">
                    {use.creditCost}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Voucher System */}
        <section className="py-16 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="container-wide">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-6">
                  <Gift className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-6">Voucher System</h2>
                <p className="text-lg text-primary-100 mb-6">
                  Vouchers are special promotional codes that give you free credits!
                  Keep an eye out for exclusive voucher codes from:
                </p>
                <ul className="space-y-3">
                  {[
                    'Referral program rewards',
                    'Seasonal promotions and special events',
                    'Partner collaborations',
                    'Social media giveaways',
                    'Email newsletter exclusives'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-primary-200 mr-3 flex-shrink-0" />
                      <span className="text-primary-100">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-8">
                <h3 className="text-xl font-semibold mb-4">How to Redeem a Voucher</h3>
                <ol className="space-y-4">
                  {[
                    'Sign in to your Taska account',
                    'Go to Settings > Wallet',
                    'Click "Redeem Voucher"',
                    'Enter your voucher code',
                    'Credits are added instantly!'
                  ].map((step, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full text-sm font-semibold mr-3 flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-primary-100">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
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
                  Everything you need to know about Taska Credits
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
        <section className="py-16 bg-cream-50">
          <div className="container-wide">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-8 md:p-12 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Bidding?</h2>
              <p className="text-lg text-amber-100 mb-8 max-w-2xl mx-auto">
                Join thousands of successful artisans on Taska. Get your first credits today
                and start winning jobs in your area!
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
                  href="/how-it-works/levels"
                  className="inline-flex items-center text-white font-medium hover:underline"
                >
                  Learn about Artisan Levels
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section className="py-16 bg-white">
          <div className="container-wide">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Learn More</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link
                href="/how-it-works/levels"
                className="card flex items-center p-4 hover:border-primary-300"
              >
                <div className="bg-primary-100 rounded-lg p-3 mr-4">
                  <Star className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Artisan Levels</h3>
                  <p className="text-sm text-gray-600">Unlock more benefits</p>
                </div>
              </Link>
              <Link
                href="/how-it-works/boosts"
                className="card flex items-center p-4 hover:border-primary-300"
              >
                <div className="bg-amber-100 rounded-lg p-3 mr-4">
                  <Zap className="h-6 w-6 text-amber-600" />
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
                  <Wallet className="h-6 w-6 text-green-600" />
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
