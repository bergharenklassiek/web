export interface ReservationEvent {
    // Storyblok story ID: unlike the slug it never changes, so the Sheet counts reservations by it
    id: string;
    title: string;
    date: string;
}

export interface ReservationGuest {
    name: string;
    email: string;
    seats: number;
    // Honeypot field, only bots fill it in
    website: string;
}

export interface ReservationRequest extends ReservationEvent, ReservationGuest {
    dateLabel: string;
}

export type ReservationStatus = 'ok' | 'full' | 'invalid' | 'error';

export interface ReservationResponse {
    status: ReservationStatus;
    // Seats still available, sent along with 'full'
    remaining?: number;
}
