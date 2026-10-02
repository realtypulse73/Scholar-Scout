import { fireEvent, render, screen } from '@testing-library/react';
import ContributorMediaIntake from '@/components/contributor-media/ContributorMediaIntake';

describe('ContributorMediaIntake', () => {
  it('keeps private package feedback actionable and rejects an unsupported local video', async () => {
    render(<ContributorMediaIntake programmes={[{ id: 'programme-1', name: 'Pilot programme' }]} initialStatus={{ status: 'Draft', revision: 1 }} />);
    fireEvent.change(screen.getByLabelText('Programme'), { target: { value: 'programme-1' } });
    fireEvent.change(screen.getByLabelText(/Original MP4 video/), { target: { files: [new File(['x'], 'clip.mov', { type: 'video/quicktime' })] } });
    fireEvent.change(screen.getByLabelText(/JPEG or PNG poster/), { target: { files: [new File(['x'], 'poster.png', { type: 'image/png' })] } });
    fireEvent.submit(screen.getByRole('button', { name: /prepare private upload/i }).closest('form')!);
    expect(await screen.findByText(/Action needed: use one MP4 video/i)).toBeInTheDocument();
    expect(window.localStorage.getItem('contributor-media')).toBeNull();
  });
});
