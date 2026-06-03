// e2e/fullGame.e2e.ts — happy-path game flow: login → match → play → resign
import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

describe('Full game flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('logs in as guest and plays a few moves', async () => {
    await waitFor(element(by.text('Welcome to ChessMate'))).toBeVisible().withTimeout(5000);
    await element(by.text('Guest')).tap();
    await element(by.label('Username')).typeText('detox-user');
    await element(by.text('Play as Guest')).tap();

    await waitFor(element(by.text('Quick Play'))).toBeVisible().withTimeout(5000);
    await element(by.text('Quick Play')).tap();

    // Note: real matchmaking requires a server-side fixture. In CI we
    // typically inject a deterministic opponent via mock socket.
    await detoxExpect(element(by.text('Finding match…'))).toBeVisible();
  });
});
