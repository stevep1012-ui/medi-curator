import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PolicyDocuments from '../../src/components/PolicyDocuments';

describe('PolicyDocuments', () => {
  it('publishes privacy, terms, overseas transfer, and launch placeholders', () => {
    render(<PolicyDocuments />);

    expect(screen.getByRole('heading', { name: '개인정보처리방침' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '이용약관' })).toBeInTheDocument();
    expect(screen.getByText(/국외이전/)).toBeInTheDocument();
    expect(screen.getAllByText('[출시 전 확정 필요]').length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText(/건강정보를 서버에 저장하지 않습니다/)).toBeInTheDocument();
  });
});
