import { afterEach, describe, expect, it, vi } from 'vitest';

import { HttpError, httpGet } from './http';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('http client', () => {
  it('reads json from the api origin', async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(httpGet('/items')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      `${window.location.origin}/api/items`,
    );
  });

  it('raises the problem code when the response fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ code: 'not_found' }, { status: 404 })),
    );
    await expect(httpGet('/missing')).rejects.toMatchObject({
      status: 404,
      code: 'not_found',
    });
    await expect(httpGet('/missing')).rejects.toBeInstanceOf(HttpError);
  });
});
