import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'How do I pay — what is aUEC?',
    a: 'aUEC (alpha UEC) is the in-game currency of Star Citizen. You pay at the moment of handoff: the FSIS operator will open an in-game trade window. You transfer the aUEC shown on your order confirmation, then the goods are placed in the window for you to accept. Never send aUEC outside a trade window.',
  },
  {
    q: 'What is the passphrase for?',
    a: 'The passphrase (e.g. IRON-VULTURE-47) is your identity token. Speak it to the FSIS crew member when you meet in-game — it confirms you are the buyer who placed the order, and lets you verify you\'re dealing with FSIS and not an impersonator. Keep it private until the handoff.',
  },
  {
    q: 'What do the order statuses mean?',
    a: 'NEW — received, pending review. CONFIRMED — accepted, goods are being prepared. IN FULFILLMENT — en route or awaiting your scheduled handoff window. DELIVERED — trade complete. CANCELLED — voided (only possible while status is NEW).',
  },
  {
    q: 'How does the handoff scheduling work?',
    a: 'After your order is confirmed, open the order card and click "Schedule Handoff." Propose a time window and in-game location (e.g. Lorville, Teasa Spaceport). FSIS will confirm or suggest an alternative. You\'ll see the confirmed time and any proprietor notes on your order card.',
  },
  {
    q: 'Can I cancel my order?',
    a: 'Yes — but only while the order is in NEW status, before the operator confirms it. Open the order in My Orders, use the message thread to request cancellation, or use the Cancel button if it appears. Once confirmed, cancellations are handled case-by-case via the order message thread.',
  },
  {
    q: 'Do I need an account to order?',
    a: 'No account needed. Just enter your in-game handle when you place the order. Your tracking code and passphrase are how you identify the order later — save them somewhere safe. If you do log in, your orders are linked to your profile automatically.',
  },
  {
    q: 'What is the Bulk Quote builder?',
    a: 'The Bulk Quote tab (shortcut: key 2) lets you calculate a price for large SCU volumes before committing to an order. It applies volume discount tiers automatically and shows the math. Hit "Load into Manifest" to move the quote into your cart.',
  },
  {
    q: 'Which locations does FSIS service?',
    a: 'FSIS services major trade hubs across Stanton: Lorville (Hurston), Area18 (ArcCorp), Port Olisar / Seraphim Station (Crusader), and New Babbage (MicroTech). Delivery ETAs vary — check the Bulk Quote tab for per-location estimates. Remote locations may require a custom arrangement via the order message thread.',
  },
  {
    q: 'How do I use a discount code?',
    a: 'Discount codes are issued to partner orgs and repeat patrons. During checkout, enter your code in the Discount Code field before transmitting. The discount is applied to your order total and shown on your receipt. Codes are single-use per order.',
  },
  {
    q: 'What keyboard shortcuts are available?',
    a: 'On the storefront, keys 1–4 switch tabs and / focuses the search bar. In the management desktop, Cmd/Ctrl+K opens the command palette. F11 toggles fullscreen where supported. On the order transmit button, hold until the progress ring completes to confirm.',
  },
];

export default function PatronFaq() {
  const [open, setOpen] = useState(null);

  return (
    <div className="space-y-2">
      <h3 className="font-mono text-xs tracking-[0.25em] mb-3" style={{ color: '#C8A05B' }}>// PATRON FAQ</h3>
      {FAQS.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="border" style={{ borderColor: isOpen ? '#5C4424' : '#2A2118', background: '#0E0C09' }}>
            <button
              className="w-full flex items-center justify-between p-3 text-left gap-3"
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="font-mono text-[10px] tracking-[0.08em]" style={{ color: isOpen ? '#E0A22E' : '#C8B896' }}>
                {faq.q}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0"
                style={{ color: '#6B6155' }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <p className="font-mono text-[10px] leading-relaxed px-3 pb-3 border-t" style={{ color: '#9C9080', borderColor: '#2A2118' }}>
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}