import {
  isExactObject,
  parseJsonRequest,
} from '@/lib/api-request';

type ExampleRequest = {
  message: string;
  topics: string[];
};

function validateExampleRequest(value: unknown): ExampleRequest | null {
  if (!isExactObject(value, ['message', 'topics'])) {
    return null;
  }

  const { message, topics } = value;

  if (
    typeof message !== 'string' ||
    message.length < 1 ||
    message.length > 10 ||
    !Array.isArray(topics) ||
    topics.length > 2 ||
    topics.some((topic) => typeof topic !== 'string' || topic.length > 5)
  ) {
    return null;
  }

  return { message, topics };
}

function createRequest(body: ReadableStream<Uint8Array>, contentLength?: string): Request {
  return {
    body,
    headers: new Headers(contentLength ? { 'content-length': contentLength } : undefined),
  } as Request;
}

function createBody(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}

describe('bounded JSON request parsing', () => {
  it('rejects an oversized declared body before reading or parsing it', async () => {
    const request = createRequest(
      new ReadableStream({
        pull() {
          throw new Error('the stream should not be read');
        },
      }),
      '101',
    );

    await expect(
      parseJsonRequest(request, { maxBytes: 100, validate: validateExampleRequest }),
    ).resolves.toEqual({ ok: false, error: 'body-too-large' });
  });

  it('rejects a body that grows past the streaming byte ceiling', async () => {
    const request = createRequest(createBody(['{"message":"hello",', '"topics":["one"]}']));

    await expect(
      parseJsonRequest(request, { maxBytes: 20, validate: validateExampleRequest }),
    ).resolves.toEqual({ ok: false, error: 'body-too-large' });
  });

  it('returns typed failures for malformed JSON without exposing parser errors', async () => {
    const request = createRequest(createBody(['{"message":']));

    await expect(
      parseJsonRequest(request, { maxBytes: 100, validate: validateExampleRequest }),
    ).resolves.toEqual({ ok: false, error: 'invalid-json' });
  });

  it('accepts an exact object accepted by its route-owned validator', async () => {
    const request = createRequest(createBody(['{"message":"hello","topics":["one"]}']));

    await expect(
      parseJsonRequest(request, { maxBytes: 100, validate: validateExampleRequest }),
    ).resolves.toEqual({
      ok: true,
      value: { message: 'hello', topics: ['one'] },
    });
  });

  it.each([
    '{"message":"hello","topics":[],"extra":true}',
    '{"message":"message is too long","topics":[]}',
    '{"message":"hello","topics":["one","two","three"]}',
    '{"message":"hello","topics":["too-long"]}',
  ])('rejects unknown keys and invalid scalar or array bounds', async (body) => {
    const request = createRequest(createBody([body]));

    await expect(
      parseJsonRequest(request, { maxBytes: 100, validate: validateExampleRequest }),
    ).resolves.toEqual({ ok: false, error: 'invalid-body' });
  });
});
