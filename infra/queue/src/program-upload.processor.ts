export class ProgramUploadProcessor {
  process(job: { schoolAccountId: string; fileName: string }) {
    return {
      status: 'queued',
      ...job,
      queuedAt: new Date().toISOString(),
    };
  }
}

