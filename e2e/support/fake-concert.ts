import { Page } from '@playwright/test';

function inThirtyDays(): string {
  const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return `${date.toISOString().split('T')[0]} 16:00`;
}

export const fakeConcert = {
  id: 999999,
  uuid: 'e2e-test-concert',
  slug: 'e2e-test-concert',
  name: 'E2E testconcert',
  content: {
    component: 'Event',
    title: 'E2E testconcert',
    summary: 'Een concert dat alleen in de tests bestaat',
    artists: [],
    date: inThirtyDays(),
    location: 'Kerk Bergharen',
    description: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Beschrijving' }] }] },
    images: [],
  },
};

/**
 * Makes the fake concert the only upcoming concert. The browser always fetches a fresh list of upcoming concerts, which
 * replaces the list rendered on the server, so this works on every page. Call it before going to the page.
 */
export async function useFakeConcert(page: Page): Promise<void> {
  await page.route(
    (url) => url.hostname === 'api.storyblok.com'
      && url.searchParams.get('content_type') === 'Event'
      && url.searchParams.has('filter_query[date][gt_date]'),
    (route) => route.fulfill({
      json: { stories: [fakeConcert] },
      headers: { 'access-control-allow-origin': '*', total: '1' },
    }),
  );
}

// Answers the reservation request, returning what was sent. Registered after the guard in test.ts, so it takes priority.
export async function answerReservation(page: Page, answer: object = { status: 'ok' }): Promise<{ sent: () => Record<string, unknown> | undefined }> {
  let sent: Record<string, unknown> | undefined;
  await page.route('https://script.google.com/**', (route) => {
    sent = route.request().postDataJSON();
    return route.fulfill({ json: answer, headers: { 'access-control-allow-origin': '*' } });
  });
  return { sent: () => sent };
}
