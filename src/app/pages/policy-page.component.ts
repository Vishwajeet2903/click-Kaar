import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-policy-page',
  standalone: true,
  imports: [BreadcrumbComponent],
  template: `
    <app-breadcrumb [label]="title" />
    <section class="container pb-5 policy">
      <p class="eyebrow">Legal</p>
      <h1 class="section-title">{{ title }}</h1>
      @for (section of sections; track section.heading) {
        <div class="surface block">
          <h2>{{ section.heading }}</h2>
          @for (paragraph of section.paragraphs; track paragraph) {
            <p class="muted">{{ paragraph }}</p>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .policy { max-width: 95vw; }
    .section-title { text-align: left; }
    .block { margin-bottom: 1rem; padding: clamp(1.1rem, 2.5vw, 1.75rem); }
    h2 { color: #111; font-size: clamp(1.25rem, 2vw, 1.7rem); font-weight: 900; line-height: 1.15; margin: 0 0 .75rem; }
    p { color: #333; font-size: 1rem; line-height: 1.72; margin: 0; }
    p + p { margin-top: .65rem; }
  `]
})
export class PolicyPageComponent {
  private readonly page = inject(ActivatedRoute).snapshot.data['page'];
  readonly title = this.page === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions';
  readonly sections = this.page === 'privacy'
    ? [
        { heading: 'Mock data', paragraphs: ['This frontend demo does not transmit personal data to a backend service.'] },
        { heading: 'Forms', paragraphs: ['Form entries are used only for client-side validation and mock UI feedback.'] },
        { heading: 'Images', paragraphs: ['Remote placeholder images are used to create a realistic photography aesthetic.'] }
      ]
    : [
        {
          heading: '1. Introduction',
          paragraphs: [
            'These Terms & Conditions ("Terms") govern every booking, rental and use of Click-Kaar\'s website, mobile application and equipment rental services (together, the "Platform"). Click-Kaar rents professional photography, videography, cinema, lighting, audio, drone, action-camera and related production equipment ("Equipment") to individuals, freelancers, content creators, production houses and businesses across India.',
            'By booking Equipment or using the Platform, you agree to these Terms, our Privacy Policy, and the linked policies referenced throughout this document (together, the "Agreement").'
          ]
        },
        {
          heading: '2. Definitions',
          paragraphs: [
            '"You" / "Customer" means the person or entity that books Equipment through the Platform.',
            '"Order" means the specific rental booking confirmed by Click-Kaar, including the Rental Order document.',
            '"Rental Period" means the period from the confirmed pickup/delivery time until the Equipment is returned to and accepted by Click-Kaar.',
            '"Security Deposit" means the refundable amount held against loss, damage or breach of this Agreement.',
            '"MRP" means the current replacement value of an item of Equipment as listed by Click-Kaar.'
          ]
        },
        { heading: '3. Acceptance of Terms', paragraphs: ['You accept these Terms electronically when you tick the acceptance checkbox at checkout, complete payment for an Order, or sign the Rental Order at pickup/delivery, whichever happens first. This constitutes a valid electronic contract under the Information Technology Act, 2000, and no physical signature is required.'] },
        {
          heading: '4. Eligibility',
          paragraphs: [
            'You must be at least 18 years old and capable of entering into a binding contract under the Indian Contract Act, 1872.',
            'You must provide accurate KYC information as described in our Customer KYC Declaration.',
            'Business and production-house accounts must provide GST details, where applicable, and an authorised signatory.',
            'Click-Kaar may verify your identity, address and payment details before confirming any Order.'
          ]
        },
        { heading: '5. Customer Accounts', paragraphs: ['You are responsible for maintaining the confidentiality of your login credentials and for all activity on your account. Notify us immediately at the contact details in Section 31 if you suspect unauthorised use of your account.'] },
        {
          heading: '6. Booking Process',
          paragraphs: [
            'Select Equipment, rental dates and pickup/delivery mode on the Platform.',
            'Complete KYC verification and pay the applicable rental amount and Security Deposit.',
            'You will receive a Rental Order confirming the booking. An Order is confirmed only once Click-Kaar issues this confirmation. Availability shown on the Platform is not a guarantee until confirmed.'
          ]
        },
        { heading: '7. Rental Orders', paragraphs: ['Each Order sets out the Equipment, accessories, Rental Period, pricing, deposit and pickup/return details. The Rental Order forms part of this Agreement. In case of conflict between the Rental Order and these Terms, the Rental Order prevails only for the specific commercial details it covers, such as dates, pricing and deposit amount.'] },
        {
          heading: '8. Pricing',
          paragraphs: [
            'Rental pricing is shown on the Platform per day/period and may vary with demand, duration and Equipment type.',
            'All prices are exclusive of applicable GST unless stated otherwise; GST is charged as per prevailing law and shown separately at checkout.',
            'Click-Kaar may revise listed prices at any time; the price confirmed at the time of your Order will not change for that Order.'
          ]
        },
        {
          heading: '9. Payments',
          paragraphs: [
            'Payments may be made through the payment methods offered on the Platform, including cards, UPI, net banking, wallets, or other modes made available.',
            'Full rental payment, or the applicable advance, and the Security Deposit must be cleared before Equipment is handed over.',
            'GST-registered customers wishing to claim input tax credit must share correct GSTIN details at the time of booking; invoices cannot be revised after issuance except for genuine errors.'
          ]
        },
        {
          heading: '10. Security Deposit',
          paragraphs: [
            'A refundable Security Deposit is collected for every Order, calculated based on the MRP and risk profile of the Equipment booked.',
            'The deposit is not a rental fee and does not reduce the rental charges payable.',
            'The deposit is refunded to the original payment method within the timeline in our Damage, Repair & Replacement Policy, after adjustment, if any, for damage, loss, late return charges or other amounts owed under this Agreement.'
          ]
        },
        { heading: '11. Equipment Collection', paragraphs: ['You, or an authorised representative carrying valid ID, must collect Equipment at the agreed time and location. Click-Kaar may require the person collecting Equipment to match the KYC on file. A joint Equipment Handover Checklist is completed and signed physically or electronically at the time of collection, along with photographic/video evidence of the Equipment\'s condition.'] },
        { heading: '12. Delivery', paragraphs: ['Where delivery is opted for, Click-Kaar will deliver Equipment to the address confirmed in the Order. Delivery timelines are estimates and may vary due to traffic, weather or logistics constraints beyond our control. You must inspect the Equipment on delivery and flag any visible issue immediately.'] },
        {
          heading: '13. Customer Responsibilities',
          paragraphs: [
            'During the Rental Period, you agree to use the Equipment only for lawful purposes and in line with its intended use and any operating instructions provided.',
            'You must keep the Equipment safe, clean and protected from weather, moisture, dust, theft and unauthorised use.',
            'You must transport the Equipment securely using appropriate cases/bags, and not expose it to conditions likely to cause damage.',
            'You must not use the Equipment for illegal activity, including activity restricted under drone/aviation regulations, obscenity, surveillance without consent, or other unlawful filming.',
            'You must not attempt to repair, service, disassemble or modify the Equipment yourself or through a third party.',
            'You must not sub-rent, lend, pledge or transfer the Equipment to any other person without Click-Kaar\'s prior written consent.',
            'You must return the Equipment complete with all accessories, cables, batteries, cases and packaging originally provided.'
          ]
        },
        { heading: '14. Equipment Condition', paragraphs: ['Equipment is rented "as inspected and accepted" at handover. Click-Kaar equipment is professionally serviced and quality-checked before each rental, and any pre-existing marks or issues are recorded on the Equipment Handover Checklist at the time of collection/delivery.'] },
        {
          heading: '15. Inspection Process',
          paragraphs: [
            'At handover, Equipment is jointly inspected, tested for basic functionality, and photographed/filmed. Both parties sign the Equipment Handover Checklist.',
            'At return, Equipment is jointly inspected against the same checklist, using the Equipment Return Checklist, with fresh photographic/video evidence.',
            'Any damage, missing accessory or malfunction identified at return that was not recorded at handover is treated as having occurred during the Rental Period, unless you can show otherwise.'
          ]
        },
        { heading: '16. Damage', paragraphs: ['You are responsible for damage caused during the Rental Period beyond normal wear and tear, whether caused by you, your representative, or anyone you allowed to access the Equipment. The full process for assessing and charging for damage is set out in our Damage, Repair & Replacement Policy, which forms part of this Agreement.'] },
        { heading: '17. Loss', paragraphs: ['If Equipment is lost during the Rental Period, including being left behind, misplaced, or otherwise not returned, you are liable for its full MRP-based replacement value, less any amount already covered by the Security Deposit, as detailed in the Damage, Repair & Replacement Policy.'] },
        {
          heading: '18. Theft',
          paragraphs: [
            'Report any theft to the nearest police station and obtain a First Information Report (FIR) or acknowledged complaint copy within 48 hours of discovering the theft.',
            'Share the FIR/complaint copy with Click-Kaar within 3 working days.',
            'Where a valid police complaint is furnished in time, Click-Kaar will assess the claim fairly; where no complaint is furnished, the theft will be treated as a loss under Section 17 and charged accordingly.'
          ]
        },
        { heading: '19. Security Deposit Adjustment', paragraphs: ['Click-Kaar may adjust the Security Deposit against outstanding rental dues, late return charges, cleaning charges for Equipment returned unreasonably soiled, repair/replacement costs for damage or loss, and any other amount properly owed under this Agreement. You will be shown an itemised statement before any adjustment, consistent with our Damage, Repair & Replacement Policy.'] },
        { heading: '20. Rental Extensions', paragraphs: ['Extension requests should be made through the Platform or customer support before the scheduled return time, and are subject to Equipment availability. Approved extensions are charged at the applicable daily rate for the extended period, payable before the extension begins.'] },
        { heading: '21. Late Returns', paragraphs: ['Equipment not returned by the agreed return time, without a pre-approved extension, will attract late fees as displayed on the Platform/Rental Order, calculated per hour/day of delay. Click-Kaar may treat prolonged, uncommunicated non-return as a loss under Section 17 and take recovery action, including engaging authorities where appropriate.'] },
        { heading: '22. Cancellation', paragraphs: ['Cancellation, rescheduling and refund timelines for both customer-initiated and Click-Kaar-initiated cancellations are set out in our Cancellation, Refund & Extension Policy, which forms part of this Agreement.'] },
        { heading: '23. Intellectual Property', paragraphs: ['The Platform, its content, branding, software and design are owned by Click-Kaar and protected under applicable intellectual property laws. You may not copy, reproduce or use Click-Kaar\'s branding or Platform content without prior written permission. Nothing in this Agreement grants you rights over Click-Kaar\'s intellectual property beyond using the Platform to book rentals.'] },
        { heading: '24. Privacy', paragraphs: ['Our collection and use of your personal data is governed by our Privacy Policy, which is aligned with the Digital Personal Data Protection Act, 2023 and forms part of this Agreement.'] },
        {
          heading: '25. Suspension & Termination',
          paragraphs: [
            'Click-Kaar may suspend or terminate your account, or refuse/cancel a booking, where we reasonably believe you have provided false information, breached this Agreement, engaged in fraud, or misused the Equipment or Platform.',
            'Click-Kaar may recover Equipment immediately, including through a representative, if it reasonably believes the Equipment is at risk of damage, loss or misuse, or if payment obligations are not met.',
            'Termination does not affect amounts already due or liabilities already accrued under this Agreement.'
          ]
        },
        { heading: '26. Limitation of Liability', paragraphs: ['Click-Kaar is not liable for indirect, incidental or consequential losses, such as loss of business, shoot cancellation costs, or loss of content/footage, arising from Equipment malfunction, delay or unavailability, except where caused by Click-Kaar\'s gross negligence or wilful default. Click-Kaar\'s total liability to you under this Agreement is limited to the rental amount paid for the relevant Order, save where Indian law does not permit such a limitation.'] },
        { heading: '27. Indemnity', paragraphs: ['You agree to indemnify Click-Kaar against claims, losses, fines or third-party damages arising from your breach of this Agreement, misuse of the Equipment, violation of applicable law, including drone/aviation, privacy or content laws, or use of the Equipment in a manner that causes harm to any person or property.'] },
        { heading: '28. Governing Law', paragraphs: ['This Agreement is governed by the laws of India. Subject to Section 29, the courts at [City], India shall have exclusive jurisdiction.'] },
        {
          heading: '29. Dispute Resolution',
          paragraphs: [
            'In case of any dispute, you agree to first raise the issue with Click-Kaar customer support for good-faith resolution within 15 days.',
            'If unresolved, disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, with a sole arbitrator appointed by Click-Kaar, seated in [City], in English.',
            'This clause does not affect your rights to approach the consumer fora under the Consumer Protection Act, 2019.'
          ]
        },
        {
          heading: '30. General Provisions',
          paragraphs: [
            'Force Majeure: Click-Kaar is not liable for delays or failures caused by events beyond its reasonable control, including natural disasters, strikes, government action, internet/network outages or civil unrest.',
            'Electronic Acceptance: Actions such as digital ticks, OTP confirmation, e-signatures or continued use of the Platform constitute valid acceptance of this Agreement and any updates to it.',
            'Website Updates: Click-Kaar may update these Terms from time to time; the version in force at the time of your Order applies to that Order, and continued use after an update constitutes acceptance of the revised Terms.',
            'Severability: If any clause is found invalid or unenforceable, the remaining clauses continue in full force.',
            'Assignment: You may not assign your rights under this Agreement without Click-Kaar\'s written consent. Click-Kaar may assign this Agreement in connection with a merger, acquisition or business transfer.',
            'Entire Agreement: This Agreement, together with the linked policies and your Rental Order, constitutes the entire agreement between you and Click-Kaar for each Order.'
          ]
        },
        {
          heading: '31. Contact Details',
          paragraphs: [
            'For questions, support or notices relating to this Agreement, contact us at:',
            'Email: info@clickkaar.com',
            'Phone: 91-9096820033',
            'Registered Office: Bld Road, Hatwane Complex, C/O Patil Steel, Malkapur, Malkapur, Buldhana, 443101'
          ]
        }
      ];
}
