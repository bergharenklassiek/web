import { Event } from '../models/event';
import { Story } from '../models/story';
import { loadEventSuccess } from './content.actions';
import * as fromReducer from './content.reducer';

describe('ContentReducer', () => {
    describe('OnLoadEventSuccess action', () => {
        it('should replace event alredady in state', () => {
            const initialState: fromReducer.ContentState = {
                isLoading: false,
                displayPastEvents: false,
                contactItems: [],
                contentPages: [],
                events: [
                    { id: '123', slug: 'event-123', content: {
                        title: 'old title'
                    } as Event },
                    { id: '456', slug: 'event-456', content: {} as Event },
                    { id: '789', slug: 'event-789', content: {} as Event }
                ]
            }
            const newState: Story<Event> = {
                id: '123',
                slug: 'event-123',
                content: {
                    title: 'new title'
                } as Event
            }
            const updatedState = {
                isLoading: false,
                displayPastEvents: false,
                contactItems: [],
                contentPages: [],
                events: [
                    { id: '123', slug: 'event-123', content: {
                        title: 'new title'
                    } as Event },
                    { id: '456', slug: 'event-456', content: {} as Event },
                    { id: '789', slug: 'event-789', content: {} as Event }
                ]
            }
    
            const action = loadEventSuccess({ event: newState });
            const state = fromReducer.contentReducer(initialState, action);
    
            expect(state).toEqual(updatedState);
        });

        it('should add new event', () => {
            const initialState: fromReducer.ContentState = {
                isLoading: false,
                displayPastEvents: false,
                contactItems: [],
                contentPages: [],
                events: [
                    { id: '123', slug: 'event-123', content: {} as Event },
                    { id: '456', slug: 'event-456', content: {} as Event },
                    { id: '789', slug: 'event-789', content: {} as Event }
                ]
            }
            const newState: Story<Event> = {
                id: 'abc',
                slug: 'event-abc',
                content: {} as Event
            }
            const updatedState: fromReducer.ContentState = {
                isLoading: false,
                displayPastEvents: false,
                contactItems: [],
                contentPages: [],
                events: [
                    { id: '123', slug: 'event-123', content: {} as Event },
                    { id: '456', slug: 'event-456', content: {} as Event },
                    { id: '789', slug: 'event-789', content: {} as Event },
                    { id: 'abc', slug: 'event-abc', content: {} as Event }
                ]
            }
    
            const action = loadEventSuccess({ event: newState });
            const state = fromReducer.contentReducer(initialState, action);
    
            expect(state).toEqual(updatedState);
        });
    });
});