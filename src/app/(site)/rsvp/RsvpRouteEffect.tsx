'use client';

import { useEffect } from 'react';

/* Marks <body> with `data-route="rsvp"` while the RSVP route is mounted.
   A global rule in globals.css consumes the marker to hide the fixed
   FooterBar on mobile — the wizard card is dense enough that the
   footer's RSVP pill + columns crowd it on phones. Cleared on unmount
   so other routes get the footer back. */
export default function RsvpRouteEffect() {
  useEffect(() => {
    document.body.dataset.route = 'rsvp';
    return () => {
      if (document.body.dataset.route === 'rsvp') {
        delete document.body.dataset.route;
      }
    };
  }, []);
  return null;
}
