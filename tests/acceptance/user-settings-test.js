import { currentURL, visit, fillIn, click } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';
import { getPageTitle } from 'ember-page-title/test-support';

let server;

module('Acceptance | user-settings', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();

    server.get('http://localhost:8080/v4/users/settings', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        1018240: {
          showPRJobs: true
        },
        1048190: {
          showPRJobs: false
        },
        displayJobNameLength: 30,
        timestamFormat: 'LOCAL_TIMEZONE'
      })
    ]);

    server.get('http://localhost:8080/v4/tokens', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '1'
      })
    ]);

    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '1'
      })
    ]);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('visiting /user-settings/preferences', async function (assert) {
    await authenticateSession({ token: 'faketoken' });
    await visit('/user-settings/preferences');

    assert.equal(currentURL(), '/user-settings/preferences');
    assert.dom('section.preference li').exists({ count: 3 });
  });

  test('update user preferences', async function (assert) {
    server.put('http://localhost:8080/v4/users/settings', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '1'
      })
    ]);

    server.get('http://localhost:8080/v4/users/settings', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
    ]);

    await authenticateSession({ token: 'faketoken' });
    await visit('/user-settings/preferences');

    assert.equal(currentURL(), '/user-settings/preferences');
    assert.equal(
      getPageTitle(),
      'User Settings > Preferences',
      'Page title is correct'
    );
    assert.dom('.ember-power-select-selected-item').hasText('Local Timezone');
    assert.dom('.display-job-name').hasProperty('placeholder', '20');

    await click('.ember-basic-dropdown-trigger');
    await click('.ember-power-select-options li:last-child');
    await fillIn('.display-job-name', 50);
    await click('button.blue-button');

    assert.dom('.ember-power-select-selected-item').hasText('UTC');
    assert.dom('.display-job-name').hasValue('50');
    assert
      .dom('.alert-success span:not(button span)')
      .hasText('User settings updated successfully!');
  });
});
