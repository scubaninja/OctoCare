import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import KnowledgeBasePage from './page';

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}));

vi.mock('@/lib/csv', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/csv')>();
  return {
    ...actual,
    downloadCsv: vi.fn(),
  };
});

import { apiGet } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';

const fixtureArticles = [
  {
    id: 'kb-1',
    title: 'Reset your password',
    category: 'Account',
    snippet: 'Steps to reset your password.',
    content: 'Full instructions for resetting your account password safely.',
    updatedAt: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 'kb-2',
    title: 'Configure VPN access',
    category: 'Network',
    snippet: 'How to configure VPN on your device.',
    content: 'Detailed VPN configuration guide for remote employees.',
    updatedAt: '2024-02-05T00:00:00.000Z',
  },
];

describe('KnowledgeBasePage', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
    vi.mocked(downloadCsv).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders all loaded articles and enables the export button once loaded', async () => {
    vi.mocked(apiGet).mockResolvedValue({ articles: fixtureArticles });

    render(<KnowledgeBasePage />);

    expect(await screen.findByText('Reset your password')).toBeTruthy();
    expect(screen.getByText('Configure VPN access')).toBeTruthy();

    const exportButton = screen.getByRole('button', { name: /export csv/i }) as HTMLButtonElement;
    expect(exportButton.disabled).toBe(false);
  });

  it('searching filters both the displayed list and the exported CSV rows', async () => {
    vi.mocked(apiGet).mockResolvedValue({ articles: fixtureArticles });
    const user = userEvent.setup();

    render(<KnowledgeBasePage />);
    await screen.findByText('Reset your password');

    const searchInput = screen.getByLabelText(/search knowledge base articles/i);
    await user.type(searchInput, 'vpn');

    // Displayed list reflects the filter.
    expect(screen.getByText('Configure VPN access')).toBeTruthy();
    expect(screen.queryByText('Reset your password')).toBeNull();

    const exportButton = screen.getByRole('button', { name: /export csv/i }) as HTMLButtonElement;
    expect(exportButton.disabled).toBe(false);

    await user.click(exportButton);

    expect(downloadCsv).toHaveBeenCalledTimes(1);
    const [filename, csvContent] = vi.mocked(downloadCsv).mock.calls[0];

    // The export reflects exactly the filtered/displayed rows: it includes
    // the matching article and excludes the filtered-out one.
    expect(filename).toBe('knowledge-base-articles-vpn.csv');
    expect(csvContent).toContain('Configure VPN access');
    expect(csvContent).not.toContain('Reset your password');

    // The export is announced to assistive technology via a live region.
    const status = await screen.findByRole('status');
    expect(status.textContent).toMatch(/exported 1 article as/i);
  });

  it('disables the export button and reports no matches when the filter excludes everything', async () => {
    vi.mocked(apiGet).mockResolvedValue({ articles: fixtureArticles });
    const user = userEvent.setup();

    render(<KnowledgeBasePage />);
    await screen.findByText('Reset your password');

    const searchInput = screen.getByLabelText(/search knowledge base articles/i);
    await user.type(searchInput, 'no-such-article-topic');

    expect(await screen.findByText('No articles matched your search.')).toBeTruthy();

    const exportButton = screen.getByRole('button', { name: /export csv/i }) as HTMLButtonElement;
    expect(exportButton.disabled).toBe(true);

    await user.click(exportButton);
    expect(downloadCsv).not.toHaveBeenCalled();
  });

  it('disables the export button and shows an error state when loading fails', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('API error: 500'));

    render(<KnowledgeBasePage />);

    expect(await screen.findByText('API error: 500')).toBeTruthy();

    const exportButton = screen.getByRole('button', { name: /export csv/i }) as HTMLButtonElement;
    expect(exportButton.disabled).toBe(true);
  });

  it('gives the export button an accessible name and description', async () => {
    vi.mocked(apiGet).mockResolvedValue({ articles: fixtureArticles });

    render(<KnowledgeBasePage />);
    await screen.findByText('Reset your password');

    const exportButton = screen.getByRole('button', { name: /export csv/i });
    const describedById = exportButton.getAttribute('aria-describedby');

    expect(describedById).toBeTruthy();
    const description = document.getElementById(describedById as string);
    expect(description?.textContent).toMatch(/exports the articles currently displayed/i);
  });
});
