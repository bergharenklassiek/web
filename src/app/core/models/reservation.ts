export interface ReservationEvent {
    slug: string;
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
