export default function QOALandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-cyan-500/10" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-full px-4 py-2 text-sm text-neutral-300 mb-8">
              Built for small food businesses
            </div>

            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-none mb-8">
              Stay in control during the rush.
            </h1>

            <p className="text-xl text-neutral-300 leading-relaxed mb-10 max-w-xl">
              QOA helps boba shops, taco stands, food trucks, and popup vendors handle rush-hour demand without drowning in lines, interruptions, and order chaos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 rounded-2xl text-lg transition-all">
                Start Free
              </button>

              <button className="border border-neutral-700 hover:border-neutral-500 text-white px-8 py-4 rounded-2xl text-lg transition-all">
                Watch Demo
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-lg text-sm text-neutral-400">
              <div>
                <div className="text-white font-bold text-lg">No</div>
                <div>Hardware</div>
              </div>

              <div>
                <div className="text-white font-bold text-lg">No</div>
                <div>Contracts</div>
              </div>

              <div>
                <div className="text-white font-bold text-lg">Live</div>
                <div>Queue Control</div>
              </div>
            </div>
          </div>

          {/* PHONE MOCK */}
          <div className="flex justify-center lg:justify-end">
            <div className="bg-black border border-neutral-700 rounded-[3rem] p-4 shadow-2xl shadow-emerald-500/10 w-[340px]">
              <div className="bg-neutral-900 rounded-[2.4rem] overflow-hidden border border-neutral-800">
                <div className="px-5 py-4 border-b border-neutral-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold">Tea District</div>
                    <div className="text-xs text-neutral-400">Current wait: 12 min</div>
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
                    Rush Active
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {[
                    {
                      item: 'Brown Sugar Milk Tea',
                      status: 'In Progress',
                    },
                    {
                      item: 'Thai Tea + Boba',
                      status: 'Queued',
                    },
                    {
                      item: 'Matcha Latte',
                      status: 'Ready',
                    },
                  ].map((order, idx) => (
                    <div
                      key={idx}
                      className="bg-neutral-800 rounded-2xl p-4 border border-neutral-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{order.item}</div>
                        <div className="text-xs px-2 py-1 rounded-full bg-neutral-700 text-neutral-300">
                          {order.status}
                        </div>
                      </div>

                      <div className="text-sm text-neutral-400">
                        Order #{1284 + idx}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-emerald-400 font-semibold mb-4 uppercase tracking-wider text-sm">
              The Problem
            </div>

            <h2 className="text-4xl lg:text-5xl font-black mb-8 leading-tight">
              Lunch rush destroys flow.
            </h2>

            <div className="space-y-5 text-lg text-neutral-300 leading-relaxed">
              <p>
                At 12:30 PM, twenty customers suddenly show up.
              </p>

              <p>
                One person is taking orders. Another is making drinks. Someone else is trying to manage payments, menu questions, and the line.
              </p>

              <p>
                The kitchen falls behind. Customers get impatient. Some leave.
              </p>

              <p className="text-white font-semibold">
                The problem is not effort. The problem is interruption.
              </p>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
            <div className="space-y-6">
              {[
                'Long visible lines scare customers away',
                'Staff constantly switches between orders and fulfillment',
                'Payment handling interrupts production flow',
                'Rush-hour chaos creates mistakes and delays',
                'Small teams get overloaded fast',
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 bg-neutral-800 rounded-2xl p-5"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2" />
                  <div className="text-neutral-200">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-neutral-900 border-y border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="text-emerald-400 font-semibold mb-4 uppercase tracking-wider text-sm">
              How QOA Works
            </div>

            <h2 className="text-4xl lg:text-6xl font-black mb-8">
              Customers order themselves.
            </h2>

            <p className="text-xl text-neutral-300 leading-relaxed">
              QOA removes the ordering bottleneck so your team can stay focused on fulfillment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: '1. Customer Scans QR Code',
                body: 'No app download required. Customers instantly browse your menu on their own phone.',
              },
              {
                title: '2. Order & Payment Happen Automatically',
                body: 'Customers customize items, pay instantly, and receive pickup updates by text.',
              },
              {
                title: '3. Your Team Stays in Production Mode',
                body: 'Orders appear in your live queue so staff can stay focused on making food and drinks.',
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8"
              >
                <div className="text-6xl font-black text-emerald-500/20 mb-6">
                  0{idx + 1}
                </div>

                <h3 className="text-2xl font-bold mb-5">{step.title}</h3>

                <p className="text-neutral-400 leading-relaxed text-lg">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-emerald-400 font-semibold mb-4 uppercase tracking-wider text-sm">
              Why Vendors Use QOA
            </div>

            <h2 className="text-4xl lg:text-5xl font-black mb-8 leading-tight">
              Built for the busiest 1–2 hours of your day.
            </h2>

            <div className="space-y-6 text-lg text-neutral-300 leading-relaxed">
              <p>
                QOA is not trying to replace your entire business workflow.
              </p>

              <p>
                It is designed specifically for the moments where demand spikes faster than your staff can handle interruptions.
              </p>

              <p>
                During rush periods, QOA helps:
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              {[
                'Reduce visible line pressure',
                'Keep staff focused on fulfillment',
                'Prevent lost customers during rush',
                'Create smoother operational flow',
                'Provide real queue visibility',
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-4"
                >
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <div>{item}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-neutral-800 rounded-3xl p-10">
            <div className="text-sm uppercase tracking-wider text-neutral-400 mb-4">
              Example Rush Hour
            </div>

            <div className="space-y-8">
              <div>
                <div className="text-neutral-400 mb-2">Without QOA</div>
                <div className="text-2xl font-bold mb-2">20-person line</div>
                <div className="text-neutral-300">
                  Staff constantly interrupted by ordering, payment handling, and menu questions.
                </div>
              </div>

              <div>
                <div className="text-neutral-400 mb-2">With QOA</div>
                <div className="text-2xl font-bold mb-2">Customers order asynchronously</div>
                <div className="text-neutral-300">
                  Team stays focused on fulfillment while QOA manages intake and queue flow.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-neutral-900 border-y border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="text-emerald-400 font-semibold mb-4 uppercase tracking-wider text-sm">
              Features
            </div>

            <h2 className="text-4xl lg:text-6xl font-black mb-8">
              Lightweight tools for small teams.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              'Live Queue Management',
              'Pause Ordering Controls',
              'Estimated Wait Times',
              'Order Ready Text Alerts',
              'Mobile-First Dashboard',
              'Rush Hour Analytics',
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 text-xl font-semibold"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-[3rem] p-12 lg:p-20 text-black text-center">
          <div className="max-w-4xl mx-auto">
            <div className="font-semibold uppercase tracking-wider mb-6">
              Start Free
            </div>

            <h2 className="text-4xl lg:text-7xl font-black leading-none mb-8">
              Put your line on autopilot.
            </h2>

            <p className="text-xl lg:text-2xl leading-relaxed mb-12 opacity-80 max-w-3xl mx-auto">
              Set up your menu, generate your QR code, and start taking orders in minutes.
            </p>

            <div className="bg-white rounded-[2rem] p-10 max-w-md mx-auto shadow-2xl">
              <div className="aspect-square bg-neutral-200 rounded-2xl flex items-center justify-center text-neutral-500 text-lg font-semibold mb-6">
                JOIN QR CODE
              </div>

              <div className="text-black text-xl font-bold mb-2">
                Scan to Join QOA
              </div>

              <div className="text-neutral-500">
                getqoa.com/join
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
