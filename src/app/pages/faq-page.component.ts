import { Component } from '@angular/core';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [BreadcrumbComponent],
  template: `
    <app-breadcrumb label="FAQ" />
    <section class="container pb-5 faq">
      <p class="eyebrow">Questions</p>
      <h1 class="section-title">FAQ</h1>
      @for (item of questions; track item.q) {
        <details class="surface">
          <summary>{{ item.q }}</summary>
          <p class="muted">{{ item.a }}</p>
        </details>
      }
    </section>
  `,
  styles: [`
    .faq { max-width: 95vw; }
    details { margin-bottom: .9rem; padding: 1rem; }
    summary { cursor: pointer; font-weight: 900; }
    p { margin: .8rem 0 0; }
  `]
})
export class FaqPageComponent {
  readonly questions = [
    { q: 'What photography equipment does Click-Kaar rent in Pune?', a: 'Click-Kaar rents a wide range of premium photography and videography equipment in Pune, including DSLR and mirrorless cameras, prime and zoom lenses, professional lighting, and audio gear. We feature top-tier production gear from brands like Canon, Sony, Nikon, and Godox.' },
    { q: 'How do I book a camera rental with Click-Kaar?', a: 'You can book a camera rental with Click-Kaar through a simple four-step process on our website. First, select your rental dates to view live stock in Pune. Second, add your required cameras, lenses, and lighting to your cart. Third, confirm your booking and pricing. Finally, pick up your gear with our local support team.' },
    { q: 'Does Click-Kaar offer pre-packaged equipment kits for events?', a: 'Yes, Click-Kaar offers specialized, shoot-ready gear kits tailored for specific production needs. We currently offer a complete Wedding Photography Kit which include camera bodies, lenses, and necessary support gear.' },
    { q: 'Are the rental cameras and lenses tested before pickup?', a: 'Yes, every rental DSLR, mirrorless camera, premium lens, and lighting kit is strictly tested by Click-Kaar before your shoot. We ensure all verified equipment is in perfect working condition so you can shoot with complete confidence.' },
    { q: 'What happens if the rented camera equipment gets damaged?', a: 'If equipment is damaged during your rental period, you are responsible for the repair costs or the depreciated replacement value of the item if it is beyond repair. We provide live technical support during your shoot for immediate camera troubleshooting to help prevent operational issues.' },
    { q: 'Do I need to pay a security deposit to rent equipment?', a: 'Yes, Click-Kaar requires a refundable security deposit for all camera, lens, and lighting rentals in Pune. The exact deposit amount depends on the total market value of the equipment you are renting and is fully refunded to you when the gear is returned in working condition.' },
    { q: 'What documents are required for ID verification?', a: 'To rent equipment from Click-Kaar, you must provide a valid government-issued photo ID and a proof of local address in Pune. We accept original documents such as an Aadhaar Card, Passport, or Voter ID, which our team will verify before your first rental order is approved.' },
    { q: 'Can I extend my camera rental period after picking up the gear?', a: 'Yes, you can extend your rental duration by contacting the Click-Kaar support team at least 24 hours before your original return deadline. Extensions are completely subject to live equipment availability and will be billed at our standard daily rental rates.' },
    { q: 'What is your cancellation and refund policy?', a: 'Click-Kaar offers a full refund for rental bookings canceled at least 48 hours prior to your scheduled pickup time. If you cancel your booking within 48 hours of the scheduled pickup, the cancellation is subject to a 50% deduction of the total rental amount.' },
    { q: 'Does Click-Kaar provide equipment delivery directly to my shoot location?', a: 'Currently, Click-Kaar requires creators to pick up and return their rented photography equipment directly at our Pune facility. This ensures you have the opportunity to physically inspect and test the cameras, lenses, and audio gear with our technical support team before taking them to your set.' },
    { q: 'Can I walk into the Click-Kaar Pune store to rent a camera today?', a: 'Yes, walk-ins are welcome at our Pune Office, but we strongly recommend booking online 24 to 48 hours in advance to guarantee live equipment availability, as premium gear like the Sony A7 M5 often books out.' },
    { q: 'How much advance notice is required to book a camera rental?', a: 'For first-time renters requiring ID verification, we recommend booking at least 48 hours in advance. Returning Click-Kaar customers can book equipment up to 24 hours prior to their desired pickup date.' },
    { q: 'Do you provide home delivery for camera rentals in Pune?', a: 'Click-Kaar primarily operates on a store pickup model to allow for in-person gear testing. However, custom delivery and pickup in Pune may be arranged for high-volume production orders upon special request.' },
    { q: 'What are the pickup and drop-off timings for rental gear?', a: 'Rental gear can be picked up and dropped off during our standard store hours. A one-day rental is calculated as a 24-hour period from the time of your scheduled pickup.' },
    { q: 'Can I rent a camera for a trip outside of Pune?', a: 'Yes, you can rent equipment for out-of-station shoots or travel. You simply rent the gear for the total duration of your trip, ensuring it is picked up and returned to our Pune facility.' },
    { q: 'Why do you require document verification for a camera rental?', a: 'We require ID verification to prevent identity theft and ensure the safety of our premium photography equipment. This is a standard, one-time security process for all first-time renters.' },
    { q: 'Is a post-dated cheque required as a security deposit?', a: 'Depending on the total value of the gear rented, we may require a security cheque or a refundable UPI/Card deposit. The specific deposit requirement will be clearly displayed in your cart before booking.' },
    { q: 'How long does it take to get my security deposit refunded?', a: 'Your security deposit is refunded immediately upon the safe return and technical inspection of the rented equipment at our Pune store. Bank transfers may take 24 to 48 hours to reflect in your account.' },
    { q: 'Can a friend pick up my rental gear on my behalf?', a: 'No, the person whose name and verified ID are on the booking must be present to pick up the equipment, sign the rental agreement, and complete the gear inspection.' },
    { q: 'Do the cameras come with fully charged batteries and memory cards?', a: 'Yes, every Click-Kaar camera rental includes one fully charged battery, a standard memory card, a battery charger, and a protective carrying case. Extra batteries and high-capacity cards can be added to your cart.' },
    { q: 'Is the rented camera equipment sanitized and cleaned?', a: 'Yes, our technical team professionally cleans the camera sensors, sanitizes the camera bodies, and inspects all lenses for dust and fungus before every single rental dispatch.' },
    { q: 'What should I do if a rented camera stops working during my shoot?', a: 'If you experience technical issues, immediately call our local Pune support team. We provide live troubleshooting and, if a mechanical failure occurs (not caused by physical damage), we will attempt to provide a replacement if stock is available.' },
    { q: 'Can I rent just a camera body if I already own lenses?', a: 'Yes, you can rent individual camera bodies, specific prime or zoom lenses, or audio equipment independently. You do not have to rent a full kit.' },
    { q: 'Do you rent specialized gear like gimbals and drones?', a: 'Yes, our inventory includes professional stabilization gear like DJI gimbals. Currently, we focus on ground-based production gear and do not offer aerial drone rentals.' },
    { q: 'What is considered "damage" versus "normal wear and tear"?', a: 'Minor scuff marks on a lens hood or camera barrel are considered normal use. However, scratched glass, broken screens, impact damage, or water damage are considered chargeable damages.' },
    { q: 'Do you offer damage waivers or equipment insurance?', a: 'Currently, Click-Kaar does not offer in-house damage waivers. The renter assumes full financial responsibility for the equipment from the moment of pickup until it is safely returned.' },
    { q: 'What happens if I return the equipment late?', a: 'Late returns disrupt the bookings of other creators. Equipment returned past the agreed 24-hour cycle will be subject to a late fee, which is typically calculated as an additional full-day rental charge.' },
    { q: 'Can I return a rental early for a partial refund?', a: 'You may return equipment early; however, we do not provide refunds for unused rental days, as the gear was reserved for your exclusive use and made unavailable to other customers.' },
  ];
}
