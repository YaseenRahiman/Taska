import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Taska team for support, partnerships, or inquiries.',
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-cream-200 bg-white/95 backdrop-blur">
        <div className="container-wide flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5" />
            <div className="h-8 w-8 rounded-lg bg-gradient-primary"></div>
            <span className="text-xl font-bold text-gray-900">Taska</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-gradient-to-br from-cream-50 to-primary-50 py-12">
        <div className="container-wide">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
              <p className="text-lg text-gray-600">We're here to help. Reach out to us anytime.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="card">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">Send us a message</h2>
                  <form className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                          First name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                          Last name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                      </label>
                      <textarea
                        id="message"
                        rows={6}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>

                    <button type="submit" className="btn-primary w-full justify-center">
                      Send Message
                    </button>
                  </form>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card">
                  <div className="flex items-start">
                    <Mail className="h-6 w-6 text-primary-600 mt-1 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                      <a href="mailto:support@taska.co.za" className="text-gray-600 hover:text-primary-600">
                        support@taska.co.za
                      </a>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start">
                    <Phone className="h-6 w-6 text-primary-600 mt-1 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                      <a href="tel:+27123456789" className="text-gray-600 hover:text-primary-600">
                        +27 12 345 6789
                      </a>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 text-primary-600 mt-1 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Office</h3>
                      <p className="text-gray-600">
                        123 Main Street<br />
                        Johannesburg, 2000<br />
                        South Africa
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start">
                    <MessageSquare className="h-6 w-6 text-primary-600 mt-1 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">WhatsApp</h3>
                      <a href="https://wa.me/27123456789" className="text-gray-600 hover:text-primary-600">
                        Chat with us
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
