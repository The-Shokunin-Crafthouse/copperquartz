'use client';

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { type PartyResult } from '@/src/app/actions/lookupParty';
import { submitRsvp, type RsvpPayload } from '@/src/app/actions/submitRsvp';
import { spacing, motion as motionTokens } from '@/src/lib/tokens';
import StepIndicator from './components/StepIndicator';
import StepNameEntry from './steps/StepNameEntry';
import StepAttendance from './steps/StepAttendance';
import StepMondayMeetup from './steps/StepMondayMeetup';
import StepTransportation from './steps/StepTransportation';
import StepBeverage from './steps/StepBeverage';
import StepAccommodations from './steps/StepAccommodations';
import StepReview from './steps/StepReview';
import {
  BEVERAGE_CATEGORIES,
  BEVERAGE_SELECTIONS,
  type BeverageCategory,
  type Guest,
  type Step,
  type WizardState,
} from './state';
import styles from './rsvp.module.css';

const INITIAL_STATE: WizardState = {
  step: 1,
  party: null,
  submitterGuestId: null,
  attendance: {},
  mondayMeetup: {},
  transport: {},
  beverage: {},
  beverageGuestIndex: 0,
  accommodations: '',
  returnToReview: false,
  wipeWarnings: {},
  submitting: false,
  submitError: null,
};

type Action =
  | { type: 'PARTY_LOADED'; party: PartyResult; query: string }
  | { type: 'GO_TO'; step: Step }
  | { type: 'SET_ATTENDANCE'; guestId: string; next: boolean }
  | { type: 'CLEAR_WIPE'; guestId: string }
  | { type: 'TOGGLE_MONDAY'; guestId: string; next: boolean }
  | { type: 'TOGGLE_TRANSPORT'; guestId: string; next: boolean }
  | { type: 'SET_BEVERAGE_CATEGORY'; guestId: string; category: BeverageCategory }
  | { type: 'SET_BEVERAGE_SELECTION'; guestId: string; selection: string }
  | { type: 'SET_BEVERAGE_INDEX'; index: number }
  | { type: 'SET_RETURN_TO_REVIEW'; value: boolean }
  | { type: 'SET_ACCOMMODATIONS'; value: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_ERROR'; error: string };

function hasDownstreamAnswer(g: Guest): boolean {
  if (!g.existing_rsvp) return false;
  const r = g.existing_rsvp;
  return (
    r.monday_meetup !== null ||
    r.needs_transport !== null ||
    r.beverage_category !== null ||
    r.beverage_selection !== null
  );
}

/* Pick the looked-up guest as submitter when we can — exact full_name or
   first_name match. Falls back to first guest in the party. */
function pickSubmitter(party: PartyResult, query: string): string {
  const lower = query.trim().toLowerCase();
  const byFull = party.guests.find((g) => g.full_name.toLowerCase() === lower);
  if (byFull) return byFull.id;
  const byFirst = party.guests.find((g) => g.first_name.toLowerCase() === lower);
  if (byFirst) return byFirst.id;
  return party.guests[0]?.id ?? '';
}

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'PARTY_LOADED': {
      const attendance: Record<string, boolean | undefined> = {};
      const mondayMeetup: Record<string, boolean> = {};
      const transport: Record<string, boolean> = {};
      const beverage: Record<string, { category: string; selection: string | null }> = {};
      for (const g of action.party.guests) {
        const r = g.existing_rsvp;
        attendance[g.id] = r ? r.attending : undefined;
        mondayMeetup[g.id] = r?.monday_meetup ?? false;
        transport[g.id] = r?.needs_transport ?? false;
        if (r?.beverage_category) {
          beverage[g.id] = {
            category: r.beverage_category,
            selection: r.beverage_selection,
          };
        }
      }
      return {
        ...state,
        party: action.party,
        submitterGuestId: pickSubmitter(action.party, action.query),
        attendance,
        mondayMeetup,
        transport,
        beverage,
        accommodations: action.party.existing_accommodations?.notes ?? '',
        step: 2,
      };
    }
    case 'GO_TO':
      return { ...state, step: action.step };
    case 'SET_ATTENDANCE': {
      if (!state.party) return state;
      const guest = state.party.guests.find((g) => g.id === action.guestId);
      const prev = state.attendance[action.guestId];
      const nextAttendance = { ...state.attendance, [action.guestId]: action.next };
      const wipeWarnings = { ...state.wipeWarnings };
      if (prev === true && action.next === false && guest && hasDownstreamAnswer(guest)) {
        wipeWarnings[action.guestId] = true;
      } else if (action.next === true) {
        delete wipeWarnings[action.guestId];
      }
      return { ...state, attendance: nextAttendance, wipeWarnings };
    }
    case 'CLEAR_WIPE': {
      const wipeWarnings = { ...state.wipeWarnings };
      delete wipeWarnings[action.guestId];
      const attendance = { ...state.attendance, [action.guestId]: true };
      return { ...state, wipeWarnings, attendance };
    }
    case 'TOGGLE_MONDAY':
      return {
        ...state,
        mondayMeetup: { ...state.mondayMeetup, [action.guestId]: action.next },
      };
    case 'TOGGLE_TRANSPORT':
      return {
        ...state,
        transport: { ...state.transport, [action.guestId]: action.next },
      };
    case 'SET_BEVERAGE_CATEGORY': {
      const prev = state.beverage[action.guestId];
      const valid = BEVERAGE_SELECTIONS[action.category];
      const keepSelection =
        prev && prev.category === action.category ? prev.selection : null;
      return {
        ...state,
        beverage: {
          ...state.beverage,
          [action.guestId]: {
            category: action.category,
            selection: valid.length === 0 ? null : keepSelection,
          },
        },
      };
    }
    case 'SET_BEVERAGE_SELECTION': {
      const prev = state.beverage[action.guestId];
      if (!prev) return state;
      return {
        ...state,
        beverage: {
          ...state.beverage,
          [action.guestId]: { ...prev, selection: action.selection },
        },
      };
    }
    case 'SET_BEVERAGE_INDEX':
      return { ...state, beverageGuestIndex: action.index };
    case 'SET_RETURN_TO_REVIEW':
      return { ...state, returnToReview: action.value };
    case 'SET_ACCOMMODATIONS':
      return { ...state, accommodations: action.value };
    case 'SUBMIT_START':
      return { ...state, submitting: true, submitError: null };
    case 'SUBMIT_ERROR':
      return { ...state, submitting: false, submitError: action.error };
    default:
      return state;
  }
}

export default function RsvpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduced = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const submittingRef = useRef(false);
  const stepContainerRef = useRef<HTMLDivElement>(null);

  const attendingGuests: Guest[] = useMemo(() => {
    if (!state.party) return [];
    return state.party.guests.filter((g) => state.attendance[g.id] === true);
  }, [state.party, state.attendance]);

  const anyAttending = attendingGuests.length > 0;

  const indicatorTotal = anyAttending ? 7 : 4;
  const indicatorCurrent = anyAttending
    ? state.step
    : state.step <= 2
      ? state.step
      : state.step - 3;

  useEffect(() => {
    const headings: Record<Step, string> = {
      1: "What's your name?",
      2: "Who's coming?",
      3: 'Monday Evening Meetup',
      4: 'Getting to the Reception',
      5: 'Drink of Choice',
      6: 'Anything we should know?',
      7: 'Review your RSVP.',
    };
    setLiveAnnouncement(
      `Step ${indicatorCurrent} of ${indicatorTotal}: ${headings[state.step]}`,
    );
    stepContainerRef.current?.focus({ preventScroll: true });
  }, [state.step, indicatorCurrent, indicatorTotal]);

  function goTo(step: Step) {
    dispatch({ type: 'GO_TO', step });
  }

  function handleNameSuccess(party: PartyResult, query: string) {
    dispatch({ type: 'PARTY_LOADED', party, query });
  }

  function handleAttendanceContinue() {
    goTo(anyAttending ? 3 : 6);
  }

  function handleMondayContinue() {
    goTo(4);
  }

  function handleTransportContinue() {
    dispatch({ type: 'SET_BEVERAGE_INDEX', index: 0 });
    goTo(5);
  }

  function handleBeverageContinue() {
    if (state.returnToReview) {
      dispatch({ type: 'SET_RETURN_TO_REVIEW', value: false });
      goTo(7);
      return;
    }
    if (state.beverageGuestIndex < attendingGuests.length - 1) {
      dispatch({
        type: 'SET_BEVERAGE_INDEX',
        index: state.beverageGuestIndex + 1,
      });
    } else {
      goTo(6);
    }
  }

  function handleBeverageBack() {
    if (state.beverageGuestIndex > 0) {
      dispatch({
        type: 'SET_BEVERAGE_INDEX',
        index: state.beverageGuestIndex - 1,
      });
    } else {
      goTo(4);
    }
  }

  function handleAccommodationsBack() {
    if (anyAttending) {
      dispatch({ type: 'SET_BEVERAGE_INDEX', index: attendingGuests.length - 1 });
      goTo(5);
    } else {
      goTo(2);
    }
  }

  function handleEditAttendance() {
    dispatch({ type: 'SET_RETURN_TO_REVIEW', value: false });
    goTo(2);
  }

  function handleEditDrink(guest: Guest) {
    const idx = attendingGuests.findIndex((g) => g.id === guest.id);
    if (idx < 0) return;
    dispatch({ type: 'SET_BEVERAGE_INDEX', index: idx });
    dispatch({ type: 'SET_RETURN_TO_REVIEW', value: true });
    goTo(5);
  }

  async function handleSubmit() {
    if (!state.party || !state.submitterGuestId || submittingRef.current) return;
    submittingRef.current = true;
    dispatch({ type: 'SUBMIT_START' });

    const responses: RsvpPayload['responses'] = state.party.guests.map((g) => {
      const isAttending = state.attendance[g.id] === true;
      const drink = state.beverage[g.id];
      return {
        guest_id: g.id,
        attending: isAttending,
        monday_meetup: isAttending ? Boolean(state.mondayMeetup[g.id]) : null,
        needs_transport: isAttending ? Boolean(state.transport[g.id]) : null,
        beverage_category: isAttending && drink ? drink.category : null,
        beverage_selection: isAttending && drink ? drink.selection : null,
      };
    });

    try {
      const result = await submitRsvp({
        party_id: state.party.party.id,
        submitter_guest_id: state.submitterGuestId,
        responses,
        accommodation_notes: state.accommodations,
      });
      if ('success' in result) {
        const params = new URLSearchParams(searchParams?.toString() ?? '');
        params.set('confirmation', result.partyId);
        router.push(`/rsvp?${params.toString()}`);
      } else {
        submittingRef.current = false;
        dispatch({ type: 'SUBMIT_ERROR', error: result.error });
      }
    } catch (err) {
      submittingRef.current = false;
      dispatch({
        type: 'SUBMIT_ERROR',
        error: err instanceof Error ? err.message : 'Something went wrong.',
      });
    }
  }

  const transition = reduced
    ? { duration: 0 }
    : { duration: motionTokens.std, ease: motionTokens.easeOutSoft };
  const initial = reduced ? false : { opacity: 0, y: spacing[1] };
  const animate = reduced ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 };
  const exit = reduced ? { opacity: 1 } : { opacity: 0, y: -spacing[1] };

  function renderStep() {
    if (state.step === 1 || !state.party) {
      return <StepNameEntry onSuccess={handleNameSuccess} />;
    }
    const party = state.party;
    switch (state.step) {
      case 2:
        return (
          <StepAttendance
            party={party}
            attendance={state.attendance}
            wipeWarnings={state.wipeWarnings}
            onAttendanceChange={(guestId, next) =>
              dispatch({ type: 'SET_ATTENDANCE', guestId, next })
            }
            onUndo={(guestId) => dispatch({ type: 'CLEAR_WIPE', guestId })}
            onContinue={handleAttendanceContinue}
            onBack={() => goTo(1)}
          />
        );
      case 3:
        return (
          <StepMondayMeetup
            attendingGuests={attendingGuests}
            mondayMeetup={state.mondayMeetup}
            onToggle={(guestId, next) =>
              dispatch({ type: 'TOGGLE_MONDAY', guestId, next })
            }
            onContinue={handleMondayContinue}
            onBack={() => goTo(2)}
          />
        );
      case 4:
        return (
          <StepTransportation
            attendingGuests={attendingGuests}
            transport={state.transport}
            onToggle={(guestId, next) =>
              dispatch({ type: 'TOGGLE_TRANSPORT', guestId, next })
            }
            onContinue={handleTransportContinue}
            onBack={() => goTo(3)}
          />
        );
      case 5: {
        const guest = attendingGuests[state.beverageGuestIndex];
        if (!guest) return null;
        const entry = state.beverage[guest.id];
        const fallbackCategory: BeverageCategory = BEVERAGE_CATEGORIES[0];
        return (
          <StepBeverage
            guest={guest}
            index={state.beverageGuestIndex}
            total={attendingGuests.length}
            category={entry?.category ?? ''}
            selection={entry?.selection ?? null}
            onCategory={(next) =>
              dispatch({
                type: 'SET_BEVERAGE_CATEGORY',
                guestId: guest.id,
                category: next ?? fallbackCategory,
              })
            }
            onSelection={(next) =>
              dispatch({
                type: 'SET_BEVERAGE_SELECTION',
                guestId: guest.id,
                selection: next,
              })
            }
            onContinue={handleBeverageContinue}
            onBack={handleBeverageBack}
          />
        );
      }
      case 6:
        return (
          <StepAccommodations
            value={state.accommodations}
            existing={party.existing_accommodations}
            onChange={(next) => dispatch({ type: 'SET_ACCOMMODATIONS', value: next })}
            onContinue={() => goTo(7)}
            onBack={handleAccommodationsBack}
          />
        );
      case 7:
        return (
          <StepReview
            party={party}
            attendance={state.attendance}
            mondayMeetup={state.mondayMeetup}
            transport={state.transport}
            beverage={state.beverage}
            accommodations={state.accommodations}
            submitting={state.submitting}
            submitError={state.submitError}
            onMondayToggle={(guestId) =>
              dispatch({
                type: 'TOGGLE_MONDAY',
                guestId,
                next: !state.mondayMeetup[guestId],
              })
            }
            onTransportToggle={(guestId) =>
              dispatch({
                type: 'TOGGLE_TRANSPORT',
                guestId,
                next: !state.transport[guestId],
              })
            }
            onAccommodationsChange={(next) =>
              dispatch({ type: 'SET_ACCOMMODATIONS', value: next })
            }
            onEditAttendance={handleEditAttendance}
            onEditDrink={handleEditDrink}
            onSubmit={handleSubmit}
            onBack={() => goTo(6)}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className={styles.card} ref={stepContainerRef} tabIndex={-1}>
      <StepIndicator current={indicatorCurrent} total={indicatorTotal} />
      <div aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        {liveAnnouncement}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${state.step}-${state.beverageGuestIndex}`}
          initial={initial}
          animate={animate}
          exit={exit}
          transition={transition}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
