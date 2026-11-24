import { expect, it } from 'vitest';
import { panelLink } from './toolNavigation';

it('opens the HA app panel with only the selected tool in the URL', () => {
  expect(panelLink(new URL('https://ha.test/local_good_tools?session=private'),'pdf-tools'))
    .toBe('https://ha.test/app/local_good_tools?tool=pdf-tools');
  expect(panelLink(new URL('https://ha.test/api/hassio_ingress/private/'),'file-checksum'))
    .toBe('https://ha.test/app/47dec900_good_tools?tool=file-checksum');
  expect(panelLink(new URL('http://ha.test/hassio/ingress/47dec900_good_tools'),'uuid-gen'))
    .toBe('http://ha.test/hassio/ingress/47dec900_good_tools?tool=uuid-gen');
  expect(panelLink(new URL('http://ha.test/app/5c53de3b_good_tools/'),'uuid-gen'))
    .toBe('http://ha.test/app/5c53de3b_good_tools?tool=uuid-gen');
});
