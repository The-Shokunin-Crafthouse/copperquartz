import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { formatBeverageCategory } from '@/src/app/(site)/rsvp/state';

export type RsvpDigestResponse = {
  guest_id: string;
  full_name: string;
  party_name: string;
  attending: boolean;
  monday_meetup: boolean | null;
  needs_transport: boolean | null;
  beverage_category: string | null;
  beverage_selection: string | null;
  submitted_at: string;
  updated_at: string;
};

export type RsvpDigestAccommodation = {
  party_name: string;
  notes: string;
  last_edited_by_first_name: string | null;
  updated_at: string;
};

export type RsvpDigestProps = {
  responses: RsvpDigestResponse[];
  accommodations: RsvpDigestAccommodation[];
  date: string;
};

const SANS = 'Helvetica, Arial, sans-serif';
const SERIF = "Georgia, 'Cormorant Garamond', serif";

const styles = {
  body: {
    backgroundColor: '#F3E6D3',
    margin: 0,
    padding: '32px 0',
    fontFamily: SANS,
  },
  container: {
    backgroundColor: '#F3E6D3',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '32px',
  },
  eyebrow: {
    fontFamily: SANS,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    fontSize: '12px',
    color: '#C86A4A',
    margin: '0 0 8px 0',
  },
  title: {
    fontFamily: SERIF,
    fontWeight: 600,
    fontSize: '32px',
    lineHeight: 1.1,
    color: '#4F7A4A',
    margin: '0 0 4px 0',
  },
  dateLine: {
    fontFamily: SANS,
    fontWeight: 400,
    fontSize: '14px',
    color: '#877660',
    margin: 0,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #C2A98B',
    margin: '24px 0',
  },
  partyDivider: {
    border: 'none',
    borderTop: '1px solid #C2A98B',
    margin: '16px 0',
  },
  guestBlock: {
    marginBottom: '16px',
  },
  guestName: {
    fontFamily: SERIF,
    fontWeight: 600,
    fontSize: '18px',
    color: '#2F7F7B',
    margin: 0,
  },
  partyName: {
    fontFamily: SANS,
    fontSize: '13px',
    color: '#877660',
    margin: '0 0 4px 0',
  },
  badgeAttending: {
    display: 'inline-block',
    fontFamily: SANS,
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '99px',
    padding: '2px 10px',
    backgroundColor: 'rgba(79,122,74,0.18)',
    color: '#468C3E',
  },
  badgeDeclined: {
    display: 'inline-block',
    fontFamily: SANS,
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '99px',
    padding: '2px 10px',
    backgroundColor: 'rgba(181,67,47,0.12)',
    color: '#B5432F',
  },
  updatedTag: {
    display: 'inline-block',
    marginLeft: '8px',
    fontFamily: SANS,
    fontStyle: 'italic' as const,
    fontSize: '12px',
    color: '#877660',
  },
  detailRow: {
    margin: '8px 0 0 0',
  },
  detailLabel: {
    fontFamily: SANS,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#C86A4A',
    margin: 0,
  },
  detailValue: {
    fontFamily: SANS,
    fontSize: '15px',
    color: '#4A3728',
    margin: 0,
  },
  notesHeading: {
    fontFamily: SANS,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#C86A4A',
    margin: '24px 0 12px 0',
  },
  notesPartyName: {
    fontFamily: SERIF,
    fontWeight: 600,
    fontSize: '14px',
    color: '#4A3728',
    margin: 0,
  },
  notesText: {
    fontFamily: SANS,
    fontStyle: 'italic' as const,
    fontSize: '15px',
    color: '#4A3728',
    lineHeight: 1.5,
    margin: '4px 0',
  },
  notesEditor: {
    fontFamily: SANS,
    fontSize: '13px',
    color: '#877660',
    margin: 0,
  },
  noteBlock: {
    marginBottom: '16px',
  },
  footer: {
    fontFamily: SANS,
    fontSize: '12px',
    color: '#877660',
    textAlign: 'center' as const,
    margin: 0,
  },
};

function isUpdated(submittedAt: string, updatedAt: string): boolean {
  const submitted = new Date(submittedAt).getTime();
  const updated = new Date(updatedAt).getTime();
  return submitted !== updated;
}

function mondayValue(value: boolean | null): string {
  if (value === null) return '—';
  return value ? 'Joining' : 'Not joining';
}

function transportValue(value: boolean | null): string {
  if (value === null) return '—';
  return value ? 'Needs a ride' : 'Has transport';
}

function drinkValue(
  selection: string | null,
  category: string | null,
): string {
  if (selection) return selection;
  const label = formatBeverageCategory(category);
  return label || '—';
}

function GuestRow({ response }: { response: RsvpDigestResponse }) {
  const updated = isUpdated(response.submitted_at, response.updated_at);
  return (
    <Section style={styles.guestBlock}>
      <Text style={styles.guestName}>{response.full_name}</Text>
      <Text style={styles.partyName}>{response.party_name}</Text>
      <span
        style={
          response.attending ? styles.badgeAttending : styles.badgeDeclined
        }
      >
        {response.attending ? 'Attending' : 'Not Attending'}
      </span>
      {updated ? <span style={styles.updatedTag}>(Updated)</span> : null}
      {response.attending ? (
        <>
          <Section style={styles.detailRow}>
            <Text style={styles.detailLabel}>MONDAY</Text>
            <Text style={styles.detailValue}>
              {mondayValue(response.monday_meetup)}
            </Text>
          </Section>
          <Section style={styles.detailRow}>
            <Text style={styles.detailLabel}>TRANSPORT</Text>
            <Text style={styles.detailValue}>
              {transportValue(response.needs_transport)}
            </Text>
          </Section>
          <Section style={styles.detailRow}>
            <Text style={styles.detailLabel}>DRINK</Text>
            <Text style={styles.detailValue}>
              {drinkValue(
                response.beverage_selection,
                response.beverage_category,
              )}
            </Text>
          </Section>
        </>
      ) : null}
    </Section>
  );
}

function groupByParty(
  responses: RsvpDigestResponse[],
): RsvpDigestResponse[][] {
  /* Preserve incoming order (updated_at ASC) and chunk into runs of the
     same party so we can place a divider between distinct party blocks
     without re-sorting. Two non-adjacent runs of the same party will
     appear as separate blocks — that's intentional, it preserves the
     chronology of edits. */
  const groups: RsvpDigestResponse[][] = [];
  for (const r of responses) {
    const last = groups[groups.length - 1];
    if (last && last[0].party_name === r.party_name) {
      last.push(r);
    } else {
      groups.push([r]);
    }
  }
  return groups;
}

export default function RsvpDigest({
  responses,
  accommodations,
  date,
}: RsvpDigestProps) {
  const total = responses.length;
  const partyGroups = groupByParty(responses);
  const previewText = `${total} new RSVP ${total === 1 ? 'response' : 'responses'} · ${date}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section>
            <Text style={styles.eyebrow}>RSVP DIGEST</Text>
            <Text style={styles.title}>
              {total} new {total === 1 ? 'response' : 'responses'}
            </Text>
            <Text style={styles.dateLine}>{date}</Text>
          </Section>

          <Hr style={styles.divider} />

          {partyGroups.map((group, gi) => (
            <Section key={`${group[0].party_name}-${gi}`}>
              {group.map((r) => (
                <GuestRow key={r.guest_id} response={r} />
              ))}
              {gi < partyGroups.length - 1 ? (
                <Hr style={styles.partyDivider} />
              ) : null}
            </Section>
          ))}

          {accommodations.length > 0 ? (
            <>
              <Text style={styles.notesHeading}>PARTY NOTES</Text>
              {accommodations.map((a, i) => (
                <Section key={`${a.party_name}-${i}`} style={styles.noteBlock}>
                  <Text style={styles.notesPartyName}>{a.party_name}</Text>
                  <Text style={styles.notesText}>{a.notes}</Text>
                  {a.last_edited_by_first_name ? (
                    <Text style={styles.notesEditor}>
                      Last edited by {a.last_edited_by_first_name}
                    </Text>
                  ) : null}
                </Section>
              ))}
            </>
          ) : null}

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            Sent automatically from rsvp@levibahn.com. To stop these emails,
            reply to Levi.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
